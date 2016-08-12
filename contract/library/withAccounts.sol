import "./owned.sol";

contract withAccounts is owned {
  uint defaultTimeoutPeriod = 1 weeks; // if locked fund is not settled in a week, automatically refund user

  struct AccountTx {
    uint txid;
    uint timeCreated;
    uint timeSettled;
    uint timeoutPeriod;
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

  modifier handleDeposit {
    if (msg.value > 0) {
      deposit(msg.sender, msg.value);
    }
    _
  }

/**
 * ----------------------
 * PUBLIC FUNCTIONS
 * ----------------------
 */

  /**
   * Checks available balance
   */
  function getBalance() constant public returns (uint balance) {
    balance = availableBalances[msg.sender];
    return balance;
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

    availableBalances[msg.sender] -= _amount;
    if (!msg.sender.call.value(_amount)()) {
      throw;
    }
  }

  /**
   * Checks if an AccountTx is timed out
   * can be called by anyone, not only account owner or provider
   * If an AccountTx is already timed out, return balance to the user's available balance.
   */
  function checkTimeout(uint _txid) public {
    if (
      accountTxs[_txid].state != 1 ||
      (now - accountTxs[_txid].timeCreated) < accountTxs[_txid].timeoutPeriod
    ) {
      throw;
    }

    settle(_txid, 0); // no money is spent, settle the tx
  }

  /**
   * Owner - collect spentBalance
   * leave blank at _amount to collect all spentBalance
   */
  function collect(uint _amount) public onlyOwner {
    if (_amount == 0) {
      _amount = spentBalance;
    }
    if (_amount > spentBalance) {
      throw;
    }

    spentBalance -= _amount;
    if (!msg.sender.call.value(_amount)()) {
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
    if (_amount <= 0) {
      throw;
    }

    availableBalances[_user] += _amount;
    availableBalance += _amount;
  }

  /**
   * Creates a transaction and hold the funds for _timeoutPeriod
   */
  function createTx(address _user, uint _amount, uint _timeoutPeriod) internal returns (uint txid) {
    if (_amount > availableBalances[_user]) {
      throw;
    }
    if (_timeoutPeriod == 0) {
      _timeoutPeriod = defaultTimeoutPeriod;
    }

    txid = txCount;
    accountTxs[txid] = AccountTx({
      txid: txid,
      timeCreated: now,
      timeSettled: 0, // not yet settled
      timeoutPeriod: _timeoutPeriod,
      user: _user,
      amountHeld: _amount,
      amountSpent: 0,
      state: 1 // on hold
    });
    //userTxs[_user] = txid;
    ++txCount;

    availableBalances[_user] -= _amount;
    availableBalance -= _amount;

    onholdBalances[_user] += _amount;
    onholdBalance += _amount;

    return txid;
  }

  function settle(uint _txid, uint _amountSpent) internal {
    if (accountTxs[_txid].state != 1 || _amountSpent > accountTxs[_txid].amountHeld) {
      throw;
    }

    // Deliberately not checking for timeout period
    // because if provider has actual update, it should stand

    accountTxs[_txid].amountSpent = _amountSpent;
    accountTxs[_txid].timeSettled = now;
    accountTxs[_txid].state = 2; // processed and refunded;

    spentBalance += _amountSpent;

    onholdBalances[accountTxs[_txid].user] -= accountTxs[_txid].amountHeld;
    onholdBalance -= accountTxs[_txid].amountHeld;

    uint changeAmount = accountTxs[_txid].amountHeld - _amountSpent;
    availableBalances[accountTxs[_txid].user] += changeAmount;
    availableBalance += changeAmount;
  }
}
