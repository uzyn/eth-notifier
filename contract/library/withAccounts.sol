pragma solidity ^0.4.0;

import "./withOwners.sol";

/**
 * ----------------
 * Application-agnostic user account contract
 * ----------------
 */
contract withAccounts is withOwners {
  uint defaultTimeoutPeriod = 2 days; // if locked fund is not settled within timeout period, account holders can refund themselves

  struct AccountTx {
    uint timeCreated;
    address user;
    uint amountHeld;
    uint amountSpent;
    uint8 state; // 1: on-hold/locked; 2: processed and refunded;
  }

  uint public txCount = 0;
  mapping (uint => AccountTx) public accountTxs;
  //mapping (address => uint) public userTxs;

  /**
   * Handling user account funds
   */
  uint public availableBalance = 0;
  uint public onholdBalance = 0;
  uint public spentBalance = 0; // total withdrawal balance by owner (service provider)

  mapping (address => uint) public availableBalances;
  mapping (address => uint) public onholdBalances;
  mapping (address => bool) public doNotAutoRefund;

  modifier handleDeposit {
    deposit(msg.sender, msg.value);
    _;
  }

/**
 * ----------------------
 * PUBLIC FUNCTIONS
 * ----------------------
 */

  /**
   * Deposit into other's account
   * Useful for services that you wish to not hold funds and not having to keep refunding after every tx and wasting gas
   */
  function depositFor(address _address) public payable {
    deposit(_address, msg.value);
  }

  /**
   * Account owner withdraw funds
   * leave blank at _amount to collect all funds on user's account
   */
  function withdraw(uint _amount) public {
    if (_amount == 0) {
      _amount = availableBalances[msg.sender];
    }
    if (_amount > availableBalances[msg.sender]) {
      throw;
    }

    incrUserAvailBal(msg.sender, _amount, false);
    if (!msg.sender.call.value(_amount)()) {
      throw;
    }
  }

  /**
   * Checks if an AccountTx is timed out
   * can be called by anyone, not only account owner or provider
   * If an AccountTx is already timed out, return balance to the user's available balance.
   */
  function checkTimeout(uint _id) public {
    if (
      accountTxs[_id].state != 1 ||
      (now - accountTxs[_id].timeCreated) < defaultTimeoutPeriod
    ) {
      throw;
    }

    settle(_id, 0); // no money is spent, settle the tx

    // Specifically for Notification contract
    // updateState(_id, 60, 0);
  }

  /**
   * Sets doNotAutoRefundTo of caller's account to:
   * true: stops auto refund after every single transaction
   * false: proceeds with auto refund after every single transaction
   *
   * Manually use withdraw() to withdraw available funds
   */
  function setDoNotAutoRefundTo(bool _option) public {
    doNotAutoRefund[msg.sender] = _option;
  }

  /**
   * Update defaultTimeoutPeriod
   */
  function updateDefaultTimeoutPeriod(uint _defaultTimeoutPeriod) public onlyOwners {
    if (_defaultTimeoutPeriod < 1 hours) {
      throw;
    }

    defaultTimeoutPeriod = _defaultTimeoutPeriod;
  }

  /**
   * Owner - collect spentBalance
   */
  function collectRev() public onlyOwners {
    uint amount = spentBalance;
    spentBalance = 0;

    if (!msg.sender.call.value(amount)()) {
      throw;
    }
  }

  /**
   * Owner: release availableBalance to account holder
   * leave blank at _amount to release all
   * set doNotAutoRefund to true to stop auto funds returning (keep funds on user's available balance account)
   */
  function returnFund(address _user, uint _amount) public onlyManagers {
    if (doNotAutoRefund[_user] || _amount > availableBalances[_user]) {
      throw;
    }
    if (_amount == 0) {
      _amount = availableBalances[_user];
    }

    incrUserAvailBal(_user, _amount, false);
    if (!_user.call.value(_amount)()) {
      throw;
    }
  }

/**
 * ----------------------
 * INTERNAL FUNCTIONS
 * ----------------------
 */

  /**
   * Deposit funds into account
   */
  function deposit(address _user, uint _amount) internal {
    if (_amount > 0) {
      incrUserAvailBal(_user, _amount, true);
    }
  }

  /**
   * Creates a transaction
   */
  function createTx(uint _id, address _user, uint _amount) internal {
    if (_amount > availableBalances[_user]) {
      throw;
    }

    accountTxs[_id] = AccountTx({
      timeCreated: now,
      user: _user,
      amountHeld: _amount,
      amountSpent: 0,
      state: 1 // on hold
    });

    incrUserAvailBal(_user, _amount, false);
    incrUserOnholdBal(_user, _amount, true);
  }

  function settle(uint _id, uint _amountSpent) internal {
    if (accountTxs[_id].state != 1 || _amountSpent > accountTxs[_id].amountHeld) {
      throw;
    }

    // Deliberately not checking for timeout period
    // because if provider has actual update, it should stand

    accountTxs[_id].amountSpent = _amountSpent;
    accountTxs[_id].state = 2; // processed and refunded;

    spentBalance += _amountSpent;
    uint changeAmount = accountTxs[_id].amountHeld - _amountSpent;

    incrUserOnholdBal(accountTxs[_id].user, accountTxs[_id].amountHeld, false);
    incrUserAvailBal(accountTxs[_id].user, changeAmount, true);
  }

  function incrUserAvailBal(address _user, uint _by, bool _increase) internal {
    if (_increase) {
      availableBalances[_user] += _by;
      availableBalance += _by;
    } else {
      availableBalances[_user] -= _by;
      availableBalance -= _by;
    }
  }

  function incrUserOnholdBal(address _user, uint _by, bool _increase) internal {
    if (_increase) {
      onholdBalances[_user] += _by;
      onholdBalance += _by;
    } else {
      onholdBalances[_user] -= _by;
      onholdBalance -= _by;
    }
  }
}

