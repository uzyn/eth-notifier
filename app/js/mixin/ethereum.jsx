import React from 'react';
import { web3 } from '../../../contract/Notifier.sol';

function DisplayEth(props) {
  return <span>ETH {props.wei}</span>;
}

DisplayEth.propTypes = {
  wei: React.PropTypes.func.isRequired,
};

export default { DisplayEth };

// return <span>ETH {web3.fromWei(props.wei, 'ether')}</span>;
