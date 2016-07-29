import "library/owned.sol";

contract Notifier is owned {

  struct Task {
    uint8 transport; // 1: sms
    address sender;
    string destination;
    string message;
    uint8 state; // 10: pending, 20: processed, 30: rejected
  }

  //Task[] public tasks;
  mapping(bytes4 => Task) public tasks;
  uint public tasksCount = 0;

  event TaskUpdated(bytes4 taskId, uint8 state, uint8 transport);

  function Notifier() {
    ownersCount++;
    owners[msg.sender] = true;
  }

  function notifyPls(string _destination, string _message) {
    bytes4 id = msg.sig;
    tasks[id] = Task({
      transport: 1, // sms
      sender: msg.sender,
      destination: _destination,
      message: _message,
      state: 10 // pending
    });
    TaskUpdated(id, 10, 1);
    ++tasksCount;
  }

  /**
   * Prevents accidental sending of ether
   */
  function () {
    throw;
  }
}
