contract accountSupported {
  /**
   * Handling user account funds
   */
  uint public unspentBalance = 0;
  uint public spentBalance = 0;

  mapping (address => uint) public balances;

  modifier handleDeposit {
    if (msg.value > 0) {
      deposit(msg.sender, msg.value);
    }
    _
  }

  function deposit(address _user, uint _value) private {
    if (_value <= 0) {
      throw;
    }

    balances[_user] += _value;
    unspentBalance += _value;
  }

  function spend(address _user, uint _value) private {
    if (_value <= 0 || _value < balances[_user]) {
      throw;
    }

    balances[_user] -= _value;
    unspentBalance -= _value;
    spentBalance += _value;
  }
}
