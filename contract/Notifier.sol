pragma solidity ^0.4.0;

/**
 * ----------------
 * Application-agnostic user permission (owner, manager) contract
 * ----------------
 */
contract withOwners {
  uint8 public ownersCount = 0;
  uint8 public managersCount = 0;

  /**
   * Owner: full privilege
   * Manager: lower privilege (set status, but not withdraw)
   */
  mapping (address => bool) public owners;
  mapping (address => bool) public managers;

  modifier onlyOwners {
    if (owners[msg.sender] != true) {
      throw;
    }
    _;
  }

  modifier onlyManagers {
    if (owners[msg.sender] != true && managers[msg.sender] != true) {
      throw;
    }
    _;
  }

  function addOwner(address _candidate) public onlyOwners {
    if (owners[_candidate] == true) {
      throw; // already owner
    }

    owners[_candidate] = true;
    ++ownersCount;
  }

  function removeOwner(address _candidate) public onlyOwners {
    // Stop removing the only/last owner
    if (ownersCount <= 1 || owners[_candidate] == false) {
      throw;
    }

    owners[_candidate] = false;
    --ownersCount;
  }

  function addManager(address _candidate) public onlyOwners {
    if (managers[_candidate] == true) {
      throw; // already manager
    }

    managers[_candidate] = true;
    ++managersCount;
  }

  function removeManager(address _candidate) public onlyOwners {
    if (managers[_candidate] == false) {
      throw;
    }

    managers[_candidate] = false;
    --managersCount;
  }
}

/**
 * ----------------
 * Application-agnostic user account contract
 * ----------------
 */
contract withAccounts is withOwners {
  uint defaultTimeoutPeriod = 1 days; // if locked fund is not settled within timeout period, account holders can refund themselves

  struct AccountTx {
    uint timeCreated;
    address user;
    uint128 amountHeld;
    uint128 amountSpent;
    uint8 state; // 1: on-hold/locked; 2: processed and refunded;
  }

  mapping (uint32 => AccountTx) public accountTxs;
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

  // Do not forget payable at individual functions
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
   * Checks available balance
   */
  function getBalance() constant public returns (uint balance) {
    balance = availableBalances[msg.sender];
    return balance;
  }

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
  function checkTimeout(uint32 _id) public {
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
  function setDoNotAutoRefundTo(bool _option) {
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
   * leave blank at _amount to collect all spentBalance
   */
  function collectRev(uint _amount) public onlyOwners {
    if (_amount > spentBalance) {
      throw;
    }
    if (_amount == 0) {
      _amount = spentBalance;
    }

    spentBalance -= _amount;
    if (!msg.sender.call.value(_amount)()) {
      throw;
    }
  }

  /**
   * Owner: release availableBalance to account holder
   * leave blank at _amount to release all
   * set doNotAutoRefund to true to stop auto funds returning (keep funds on user's available balance account)
   */
  function returnFund(address _account, uint _amount) public onlyManagers {
    if (doNotAutoRefund[_account] || _amount > availableBalances[_account]) {
      throw;
    }
    if (_amount == 0) {
      _amount = availableBalances[_account];
    }

    availableBalances[_account] -= _amount;
    availableBalance -= _amount;

    if (!_account.call.value(_amount)()) {
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
   * Creates a transaction
   */
  function createTx(uint32 _id, address _user, uint128 _amount) internal {
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

    availableBalances[_user] -= _amount;
    availableBalance -= _amount;

    onholdBalances[_user] += _amount;
    onholdBalance += _amount;
  }

  function settle(uint32 _id, uint128 _amountSpent) internal {
    if (accountTxs[_id].state != 1 || _amountSpent > accountTxs[_id].amountHeld) {
      throw;
    }

    // Deliberately not checking for timeout period
    // because if provider has actual update, it should stand

    accountTxs[_id].amountSpent = _amountSpent;
    accountTxs[_id].state = 2; // processed and refunded;

    spentBalance += _amountSpent;

    onholdBalances[accountTxs[_id].user] -= accountTxs[_id].amountHeld;
    onholdBalance -= accountTxs[_id].amountHeld;

    uint changeAmount = accountTxs[_id].amountHeld - _amountSpent;
    availableBalances[accountTxs[_id].user] += changeAmount;
    availableBalance += changeAmount;
  }
}


/**
 * ----------------
 * Application contract
 * ----------------
 */
contract Notifier is withOwners, withAccounts {
  string public xIPFSPublicKey;
  uint128 public minEthPerNotification = 0.02 ether;

  struct Task {
    address sender;
    uint8 state; // 10: pending
                 // 20: processed, but tx still open
                 // [ FINAL STATES >= 50 ]
                 // 50: processed, costing done, tx settled
                 // 60: rejected or error-ed, costing done, tx settled

    bool isIPFS;  // true: IPFS-augmented call; false: on-chain call
  }

  struct Notification {
    uint8 transport; // 1: sms, 2: email
    string destination;
    string message;
  }

  mapping(uint32 => Task) public tasks;
  mapping(uint32 => Notification) public notifications;
  mapping(uint32 => string) public xnotifications; // IPFS-augmented Notification (hash)
  uint32 public tasksCount = 0;

  /**
   * Events to be picked up by API
   */
  event TaskUpdated(uint32 id, uint8 state);

  function Notifier(string _xIPFSPublicKey) public {
    xIPFSPublicKey = _xIPFSPublicKey;
    ownersCount++;
    owners[msg.sender] = true;
  }

/**
 * --------------
 * Main functions
 * --------------
 */

  /**
   * Sends out notification
   */
  function notify(uint8 _transport, string _destination, string _message) public payable handleDeposit {
    if (_transport != 1 && _transport != 2) {
      throw;
    }

    uint32 id = tasksCount;
    uint8 state = 10; // pending

    createTx(id, msg.sender, minEthPerNotification);
    notifications[id] = Notification({
      transport: _transport,
      destination: _destination,
      message: _message
    });
    tasks[id] = Task({
      sender: msg.sender,
      state: state,
      isIPFS: false // on-chain
    });

    TaskUpdated(id, state);
    ++tasksCount;
  }

/**
 * --------------
 * Extended functions, for
 * - IPFS-augmented calls
 * - Encrypted calls
 * --------------
 */

  function xnotify(string _hash) public payable handleDeposit {
    uint32 id = tasksCount;
    uint8 state = 10; // pending

    createTx(id, msg.sender, minEthPerNotification);
    xnotifications[id] = _hash;
    tasks[id] = Task({
      sender: msg.sender,
      state: state,
      isIPFS: true // IPFS
    });

    TaskUpdated(id, state);
    ++tasksCount;
  }

/**
 * --------------
 * Owner-only functions
 * ---------------
 */

  function updateMinEthPerNotification(uint128 _newMin) public onlyManagers {
    minEthPerNotification = _newMin;
  }

  /**
   * Mark task as processed, but no costing yet
   * This is an optional state
   */
  function taskProcessedNoCosting(uint32 _id) public onlyManagers {
    updateState(_id, 20, 0);
  }

  /**
   * Mark task as processed, and process funds + costings
   * This is a FINAL state
   */
  function taskProcessedWithCosting(uint32 _id, uint128 _cost) public onlyManagers {
    updateState(_id, 50, _cost);
  }

  /**
   * Mark task as rejected or error-ed,  and processed funds + costings
   * This is a FINAL state
   */
  function taskRejected(uint32 _id, uint128 _cost) public onlyManagers {
    updateState(_id, 60, _cost);
  }

  /**
   * Update public key for xIPFS
   */
  function updateXIPFSPublicKey(string _publicKey) public onlyOwners {
    xIPFSPublicKey = _publicKey;
  }

  function updateState(uint32 _id, uint8 _state, uint128 _cost) private {
    if (tasks[_id].state == 0 || tasks[_id].state >= 50) {
      throw;
    }

    tasks[_id].state = _state;

    // Cost settlement is done only for final states (>= 50)
    if (_state >= 50) {
      settle(_id, _cost);
    }
    TaskUpdated(_id, _state);
  }

  /**
   * Handle deposits
   */
  function () payable handleDeposit {
  }
}
