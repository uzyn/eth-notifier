import React from 'react';
// import { Notifier, web3 } from '../../../contract/Notifier.sol';
import { Notifier, web3 } from '../../../contract/.deployed';
import DisplayEth from '../helper/DisplayEth.jsx';

export default function NotifierComponent() {
  return (
    <div className="Notifier row">
      <section className="intro-panel col-md-5">
        <img src="/img/eth-notifier-logo.svg" alt="eth-notifier" className="logo" />
        <h1>ETH Notifier</h1>

        <h2>Sends SMS from Ethereum</h2>

        <h4>Currently running on Ethereum Morden testnet</h4>

        <p className="hidden-xs hidden-sm">&nbsp;</p>
        <p>&nbsp;</p>

        <p>Contract address: <strong><a href={`https://testnet.etherscan.io/address/${Notifier.address}`} target="_blank">{Notifier.address}</a></strong></p>

        <p className="adopt">
          Adopts <a href="https://github.com/uzyn/ethereum-service-standard" target="_blank"><strong>Ethereum Service Standard</strong></a> (v0.1 Draft)
        </p>
      </section>

      <section className="main-panel col-md-7">
        <h2>Statistics</h2>
        <table className="table stats-table">
          <tr>
            <th>Tasks received</th>
            <td>{Notifier.tasksCount().toString()}</td>
          </tr>
          <tr>
            <th>Balance on contract</th>
            <td><DisplayEth wei={web3.eth.getBalance(Notifier.address)} /></td>
          </tr>
          <tr>
            <th>Spent balance (earned available revenue)</th>
            <td><DisplayEth wei={Notifier.spentBalance()} /></td>
          </tr>
          <tr>
            <th>Total available ETH on users' accounts</th>
            <td><DisplayEth wei={Notifier.availableBalance()} /></td>
          </tr>
          <tr>
            <th>Total ETH currently on-hold</th>
            <td><DisplayEth wei={Notifier.onholdBalance()} /></td>
          </tr>
        </table>

        <section className="use">
        <h2>How to use</h2>

        <h3>Quick and simple</h3>
        <ol>
        <li>Watch ETH Notifier's contract address with the following Application Binary Interface (ABI) from your favorite Ethereum wallet or browser: <br />
          <textarea name="Notifier.abi" readOnly value={JSON.stringify(Notifier.abi)} />
        </li>
        <li>
          Call <code>notify(transport, destination, message)</code> with ETH 0.03 <span className="small">(Unspent ETH will be refunded)</span>

          <table className="table table-striped table-bordered table-params">
          <tbody>
          <tr>
            <td><code>transport</code></td>
            <td><code>1</code> for SMS. Email coming soon.</td>
          </tr>
          <tr>
            <td><code>destination</code></td>
            <td>Phone number in E.164 beginning with <code>+</code>.</td>
          </tr>
          <tr>
            <td><code>message</code></td>
            <td>Message in UTF-8 encoding.</td>
          </tr>
          </tbody>
          </table>
        </li>

        <li>
          Done! You should be receiving an SMS seconds after your transaction is mined and confirmed.<br />
          Check your account balance with various balance functions (see ABI) and withdraw to your wallet with <code>withdraw()</code>.
        </li>

        </ol>
        </section>

        <h2>Transactions</h2>
        <p>View raw transactions from <a href={`https://testnet.etherscan.io/address/${Notifier.address}`} target="_blank">Etherscan</a> or <a href={`https://morden.ether.camp/account/${Notifier.address}`} target="_blank">Ether.camp</a>.</p>
      </section>
    </div>
  );
}
