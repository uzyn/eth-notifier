import React from 'react';
import { Notifier, web3 } from '../../../contract/Notifier.sol';
import DisplayEth from '../helper/DisplayEth.jsx';

export default function NotifierComponent() {
  return (
    <div className="Notifier">
      <h1>ETH Notifier</h1>

      <h2>Sends SMS from Ethereum</h2>

      <p>Address: <strong>{Notifier.address}</strong></p>
      <p>Adopts <strong>IoT Standard v0.1 Draft</strong>.</p>

      <p>ABI: <br />
        <textarea name="Notifier.abi" readOnly value={JSON.stringify(Notifier.abi)} />
      </p>

      <h3>Status</h3>

      <dl>
        <dt>Onchain balance</dt>
        <dd>{web3.eth.getBalance(Notifier.address).toString()}</dd>
      </dl>


      <h3>Transactions</h3>
      <p><DisplayEth wei={web3.eth.getBalance(Notifier.address)} /></p>
    </div>
  );
}
//  {displayEth(web3.eth.getBalance(Notifier.address))}</p>
// <p>On-chain balance: <DisplayEth wei={web3.eth.getBalance(Notifier.address)} /> </p>
// <dd><DisplayEth wei={web3.eth.getBalance(Notifier.address)} /></dd>
