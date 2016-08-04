contract owned {
  uint8 public ownersCount = 0;
  mapping (address => bool) public owners;

  modifier onlyOwner {
    if (owners[msg.sender] != true) {
      throw;
    }
    _
  }

  function addOwner(address _candidate) public onlyOwner {
    if (owners[_candidate] == true) {
      throw; // already owner
    }

    owners[_candidate] = true;
    ++ownersCount;
  }

  function removeOwner(address _candidate) public onlyOwner {
    // Stop removing the only/last owner
    if (ownersCount <= 1 || owners[_candidate] == false) {
      throw;
    }

    owners[_candidate] = false;
    --ownersCount;
  }
}
