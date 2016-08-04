import 'library/owned.sol';
import 'library/withAccounts.sol';

contract Notifier is owned, withAccounts {
  uint minEthPerNotification = 0.05 ether; // ~ USD 0.5

  struct Task {
    uint8 transport; // 1: sms
    address sender;
    string destination;
    string message;
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
   * Main function - sends out notification
   */
  function notify(string _destination, string _message) public handleDeposit returns (uint txid) {
    txid = createTx(msg.sender, minEthPerNotification, 1 weeks);

    uint id = tasksCount;
    tasks[id] = Task({
      transport: 1, // sms
      sender: msg.sender,
      destination: _destination,
      message: _message,
      txid: txid,
      state: 10 // pending
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
  function taskProcessed(uint _taskId, uint _cost) public onlyOwner {
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
  }

  /**
   * Handle deposits
   */
  function () handleDeposit {
  }
}
