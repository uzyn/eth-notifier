pragma solidity ^0.4.0;

import 'library/withOwners.sol';
import 'library/withAccounts.sol';

contract Notifier is withOwners, withAccounts {
  string public xIPFSPublicKey;
  uint public minEthPerNotification = 0.02 ether;

  struct Task {
    address sender;
    uint8 state; // 10: pending
                 // 20: processed, but tx still open
                 // [ FINAL STATES >= 50 ]
                 // 50: processed, costing done, tx settled
                 // 60: rejected or error-ed, costing done, tx settled

    bool isxIPFS;  // true: IPFS-augmented call (xIPFS); false: on-chain call
  }

  struct Notification {
    uint8 transport; // 1: sms, 2: email
    string destination;
    string message;
  }

  mapping(uint => Task) public tasks;
  mapping(uint => Notification) public notifications;
  mapping(uint => string) public xnotifications; // IPFS-augmented Notification (hash)
  uint public tasksCount = 0;

  /**
   * Events to be picked up by API
   */
  event TaskUpdated(uint id, uint8 state);

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
   * Sends notification
   */
  function notify(uint8 _transport, string _destination, string _message) public payable handleDeposit {
    if (_transport != 1 && _transport != 2) {
      throw;
    }

    uint id = tasksCount;
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
      isxIPFS: false // on-chain
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
    uint id = tasksCount;
    uint8 state = 10; // pending

    createTx(id, msg.sender, minEthPerNotification);
    xnotifications[id] = _hash;
    tasks[id] = Task({
      sender: msg.sender,
      state: state,
      isxIPFS: true
    });

    TaskUpdated(id, state);
    ++tasksCount;
  }

/**
 * --------------
 * Owner-only functions
 * ---------------
 */

  function updateMinEthPerNotification(uint _newMin) public onlyManagers {
    minEthPerNotification = _newMin;
  }

  /**
   * Mark task as processed, but no costing yet
   * This is an optional state
   */
  function taskProcessedNoCosting(uint _id) public onlyManagers {
    updateState(_id, 20, 0);
  }

  /**
   * Mark task as processed, and process funds + costings
   * This is a FINAL state
   */
  function taskProcessedWithCosting(uint _id, uint _cost) public onlyManagers {
    updateState(_id, 50, _cost);
  }

  /**
   * Mark task as rejected or error-ed,  and processed funds + costings
   * This is a FINAL state
   */
  function taskRejected(uint _id, uint _cost) public onlyManagers {
    updateState(_id, 60, _cost);
  }

  /**
   * Update public key for xIPFS
   */
  function updateXIPFSPublicKey(string _publicKey) public onlyOwners {
    xIPFSPublicKey = _publicKey;
  }

  function updateState(uint _id, uint8 _state, uint _cost) internal {
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
