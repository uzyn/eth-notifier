import React from 'react';
import { web3 } from '../../../contract/Notifier.sol';

// import BigNumber from 'twilio';
// import { BigNumber } from '../../../contract/Notifier.sol';
const BigNumber = web3.eth.gasPrice.constructor;

const propTypes = {
  wei: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
    React.PropTypes.instanceOf(BigNumber),
  ]),
  fixed: React.PropTypes.number,
};

const defaultProps = {
  fixed: 3,
};

export default function DisplayEth(props) {
  return <span>ETH {web3.fromWei(props.wei, 'ether').toFixed(props.fixed)}</span>;
}

DisplayEth.propTypes = propTypes;
DisplayEth.defaultProps = defaultProps;
