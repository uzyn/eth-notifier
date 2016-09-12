import 'library/owned.sol';
import 'library/withAccounts.sol';

contract Notifier is owned, withAccounts {
  uint minEthPerNotification = 0.03 ether; // ~ USD 0.3

  struct Task {
    string xipfs; // Hash for IPFS-augmented calls

    // Augmentable parameters
    uint8 transport; // 1: sms, 2: email
    string destination;
    string message;

    address sender;
    uint txid; // AccountTxid (dealing with payment)
    uint8 state; // 10: pending
                 // 20: processed, but tx still open
                 // [ FINAL STATES >= 50 ]
                 // 50: processed, costing done, tx settled
                 // 60: rejected or error-ed, costing done, tx settled
  }

  mapping(uint => Task) public tasks;
  uint public tasksCount = 0;

  /**
   * Events to be picked up by API
   */
  event TaskUpdated(uint taskId, uint8 state, uint8 transport);

  function Notifier() public {
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
  function notify(uint8 _transport, string _destination, string _message) public handleDeposit returns (uint txid) {
    if (_transport != 1 && _transport != 2) {
      throw;
    }

    txid = createTx(msg.sender, minEthPerNotification, 1 weeks);

    uint id = tasksCount;
    tasks[id] = Task({
      xipfs: '',
      transport: _transport, // 1: sms, 2: email
      destination: _destination,
      message: _message,

      sender: msg.sender,
      txid: txid,
      state: 10, // pending
    });
    TaskUpdated(id, 10, 1);
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

  function xnotify(string _hash) public handleDeposit returns (uint txid) {
    txid = createTx(msg.sender, minEthPerNotification, 1 weeks);

    uint id = tasksCount;
    tasks[id] = Task({
      xipfs: _hash,
      transport: 1, // sms
      destination: '',
      message: '',

      sender: msg.sender,
      txid: txid,
      state: 10, // pending
    });
    TaskUpdated(id, 10, 1);
    ++tasksCount;

    return txid;
  }

/**
 * --------------
 * Owner-only functions
 * ---------------
 */

  function updateMinEthPerNotification(uint _newMin) public onlyOwner{
    minEthPerNotification = _newMin;
  }

  /**
   * Mark task as processed, but no costing yet
   * This is an optional state
   */
  function taskProcessedNoCosting(uint _taskId) public onlyOwner {
    updateState(_taskId, 20, 0);
  }

  /**
   * Mark task as processed, and process funds + costings
   * This is a FINAL state
   */
  function taskProcessedWithCosting(uint _taskId, uint _cost) public onlyOwner {
    updateState(_taskId, 50, _cost);
  }

  /**
   * Mark task as rejected or error-ed,  and processed funds + costings
   * This is a FINAL state
   */
  function taskRejected(uint _taskId, uint _cost) public onlyOwner {
    updateState(_taskId, 60, _cost);
  }

  function updateState(uint _taskId, uint8 _state, uint _cost) private {
    if (tasks[_taskId].state == 0 || tasks[_taskId].state >= 50) {
      throw;
    }

    tasks[_taskId].state = _state;

    // Cost settlement is done only for final states (>= 50)
    if (_state >= 50) {
      settle(tasks[_taskId].txid, _cost);
    }
    TaskUpdated(_taskId, _state, tasks[_taskId].transport);
  }

  /**
   * Handle deposits
   */
  function () handleDeposit {
  }
}
