contract withAccounts {
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
  mapping (address => uint) public userTxs;

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
   * Deposit funds into account
   */
  function deposit(address _user, uint _amount) private {
    if (_amount <= 0) {
      throw;
    }

    availableBalances[_user] += _amount;
    availableBalance += _amount;
  }

  /**
   * Creates a transaction and hold the funds for _timeoutPeriod
   */
  function createTx(address _user, uint _amount, uint _timeoutPeriod) private returns (uint txid) {
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
    userTxs[_user] = txid;
    ++txCount;

    availableBalances[_user] -= _amount;
    availableBalance -= _amount;

    onholdBalances[_user] += _amount;
    onholdBalance += _amount;

    return txid;
  }

  function settle(uint _txid, uint _amountSpent) private {
    if (accountTxs[_txid].state != 1 || _amountSpent > accountTxs[_txid].amount) {
      throw;
    }

    // Deliberately not checking for timeout period
    // because if provider has actual update, it should stand

    accountTxs[_txid].amountSpent = _amountSpent;
    accountTxs[_txid].state = 2; // processed and refunded;

    spentBalance += _amountSpent;

    onholdBalances[accountTxs[_txid].user] -= accountTxs[_txid].amountHeld;
    onholdBalance -= accountTxs[_txid].amountHeld;

    uint changeAmount = accountTxs[_txid].amountHeld - _amountSpent;
    availableBalances[accountTxs[_txid].user] += changeAmount;
    availableBalance += changeAmount;
  }
}
