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
    _
  }

  modifier onlyManagers {
    if (owners[msg.sender] != true && managers[msg.sender] != true) {
      throw;
    }
    _
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
