pragma solidity ^0.4.0;

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

contract withAccounts is withOwners {
  uint defaultTimeoutPeriod = 1 days; // if locked fund is not settled within timeout period, account holders can refund themselves

  struct AccountTx {
    uint32 txid;
    uint timeCreated;
    address user;
    uint128 amountHeld;
    uint128 amountSpent;
    uint8 state; // 1: on-hold/locked; 2: processed and refunded;
  }

  uint32 public txCount = 0;
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

  // Do not forget payable at individual functions
  modifier handleDeposit {
    if (msg.value > 0) {
      deposit(msg.sender, msg.value);
    }
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
  function checkTimeout(uint32 _txid) public {
    if (
      accountTxs[_txid].state != 1 ||
      (now - accountTxs[_txid].timeCreated) < defaultTimeoutPeriod
    ) {
      throw;
    }

    settle(_txid, 0); // no money is spent, settle the tx
  }

  /**
   * Update defaultTimeoutPeriod
   */
  function updateDefaultTimeoutPeriod(uint _defaultTimeoutPeriod) public onlyOwners {
    if (_defaultTimeoutPeriod < 1 hours) {
      _defaultTimeoutPeriod = 1 hours;
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
   */
  function returnFund(address _account, uint _amount) public onlyManagers {
    if (_amount > availableBalances[_account]) {
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
  function createTx(address _user, uint128 _amount) internal returns (uint32 txid) {
    if (_amount > availableBalances[_user]) {
      throw;
    }

    txid = txCount;
    accountTxs[txid] = AccountTx({
      txid: txid,
      timeCreated: now,
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

  function settle(uint32 _txid, uint128 _amountSpent) internal {
    if (accountTxs[_txid].state != 1 || _amountSpent > accountTxs[_txid].amountHeld) {
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
contract Notifier is withOwners, withAccounts {
  string public xIPFSPublicKey;
  uint128 public minEthPerNotification = 0.02 ether;

  struct Task {
    string xipfs; // Hash for IPFS-augmented calls

    // Augmentable parameters
    uint8 transport; // 1: sms, 2: email
    string destination;
    string message;

    address sender;
    uint32 txid; // AccountTxid (dealing with payment)
    uint8 state; // 10: pending
                 // 20: processed, but tx still open
                 // [ FINAL STATES >= 50 ]
                 // 50: processed, costing done, tx settled
                 // 60: rejected or error-ed, costing done, tx settled
  }

  mapping(uint32 => Task) public tasks;
  uint32 public tasksCount = 0;

  /**
   * Events to be picked up by API
   */
  event TaskUpdated(uint32 taskId, uint8 state);

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
  function notify(uint8 _transport, string _destination, string _message) public payable handleDeposit returns (uint32 txid) {
    if (_transport != 1 && _transport != 2) {
      throw;
    }

    txid = createTx(msg.sender, minEthPerNotification);

    uint32 id = tasksCount;
    tasks[id] = Task({
      xipfs: '',
      transport: _transport, // 1: sms, 2: email
      destination: _destination,
      message: _message,

      sender: msg.sender,
      txid: txid,
      state: 10, // pending
    });
    TaskUpdated(id, 10);
    ++tasksCount;

    return txid;
  }

/**
 * --------------
 * Extended functions, for
 * - IPFS-augmented calls
 * - Encrypted calls
 * --------------
 */

  function xnotify(string _hash) public payable handleDeposit returns (uint32 txid) {
    txid = createTx(msg.sender, minEthPerNotification);

    uint32 id = tasksCount;
    tasks[id] = Task({
      xipfs: _hash,
      transport: 1, // sms
      destination: '',
      message: '',

      sender: msg.sender,
      txid: txid,
      state: 10, // pending
    });
    TaskUpdated(id, 10);
    ++tasksCount;

    return txid;
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
  function taskProcessedNoCosting(uint32 _taskId) public onlyManagers {
    updateState(_taskId, 20, 0);
  }

  /**
   * Mark task as processed, and process funds + costings
   * This is a FINAL state
   */
  function taskProcessedWithCosting(uint32 _taskId, uint128 _cost) public onlyManagers {
    updateState(_taskId, 50, _cost);
  }

  /**
   * Mark task as rejected or error-ed,  and processed funds + costings
   * This is a FINAL state
   */
  function taskRejected(uint32 _taskId, uint128 _cost) public onlyManagers {
    updateState(_taskId, 60, _cost);
  }

  /**
   * Update public key for xIPFS
   */
  function updateXIPFSPublicKey(string _publicKey) public onlyOwners {
    xIPFSPublicKey = _publicKey;
  }

  function updateState(uint32 _taskId, uint8 _state, uint128 _cost) private {
    if (tasks[_taskId].state == 0 || tasks[_taskId].state >= 50) {
      throw;
    }

    tasks[_taskId].state = _state;

    // Cost settlement is done only for final states (>= 50)
    if (_state >= 50) {
      settle(tasks[_taskId].txid, _cost);
    }
    TaskUpdated(_taskId, _state);
  }

  /**
   * Handle deposits
   */
  function () payable handleDeposit {
  }
}
