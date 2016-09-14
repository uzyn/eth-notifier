import "./owned.sol";

contract withEncryption is owned {
  string public xIPFSPublicKey;

  function updateXIPFSPublicKey(string _publicKey) public onlyOwner {
    xIPFSPublicKey = _publicKey;
  }
}
