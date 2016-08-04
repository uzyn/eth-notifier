import "library/owned.sol";
import "library/withAccounts.sol";

contract Notifier is owned, withAccounts {

  struct Task {
    uint8 transport; // 1: sms
    address sender;
    string destination;
    string message;
    uint8 state; // 10: pending, 20: processed, 30: rejected
  }

  //Task[] public tasks;
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

  function notify(string _destination, string _message) public handleDeposit {
    uint id = tasksCount;
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
