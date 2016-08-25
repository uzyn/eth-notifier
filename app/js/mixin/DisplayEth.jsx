import React from 'react';
// import BigNumber from 'twilio';
// import { BigNumber } from '../../../contract/Notifier.sol';

// console.log(BigNumber);

const propTypes = {
  wei: React.PropTypes.oneOfType([
    React.PropTypes.string,
    React.PropTypes.number,
    //React.PropTypes.instanceOf(BigNumber),
  ]),
};

class DisplayEth extends React.Component {
  render() {
    return <span>ETH {this.props.wei.toString() / 1000000000000000000}</span>;
  }
}

DisplayEth.propTypes = propTypes;

export default DisplayEth;

/*
export default function DisplayEth() {
  return <span>osijdf {props.wei}</span>;
}
*/
