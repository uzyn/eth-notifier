import React from 'react';
// import { Notifier, web3 } from '../../../contract/Notifier.sol';
import { Notifier, web3 } from '../../../contract/.deployed';
import DisplayEth from '../helper/DisplayEth.jsx';

export default function NotifierComponent() {
  return (
    <div className="Notifier row">
      <section className="intro-panel col-md-5">
        <h1>ETH Notifier</h1>

        <h2>Sends SMS from Ethereum</h2>

        <h4>Currently running on Ethereum Morden testnet</h4>

        <p>&nbsp;</p>
        <p>&nbsp;</p>

        <p>Contract address: <strong><a href={`https://testnet.etherscan.io/address/${Notifier.address}`} target="_blank">{Notifier.address}</a></strong></p>

        <p>&nbsp;</p>

        <p className="adopt">
          Adopts <a href="https://github.com/uzyn/ethereum-service-standard" target="_blank"><strong>Ethereum Service Standard v0.1 Draft</strong></a>
        </p>
      </section>

      <section className="main-panel col-md-7">
        <h3>Stats</h3>
        <dl>
          <dt>Balance on contract</dt>
          <dd><DisplayEth wei={web3.eth.getBalance(Notifier.address)} /></dd>
          <dt>Spent balance (earned available revenue)</dt>
          <dd><DisplayEth wei={Notifier.spentBalance()} /></dd>
          <dt>Total available ETH on users' accounts</dt>
          <dd><DisplayEth wei={Notifier.availableBalance()} /></dd>
          <dt>Total ETH currently on-hold</dt>
          <dd><DisplayEth wei={Notifier.onholdBalance()} /></dd>
          <dt>Tasks received</dt>
          <dd>{Notifier.tasksCount().toString()}</dd>
        </dl>

        <p>Application Binary Interface (ABI): <br />
          <textarea name="Notifier.abi" readOnly value={JSON.stringify(Notifier.abi)} />
        </p>

        <h3>Transactions</h3>
        <p>View raw transactions from <a href={`https://testnet.etherscan.io/address/${Notifier.address}`} target="_blank">Etherscan</a></p>
      </section>
    </div>
  );
}
