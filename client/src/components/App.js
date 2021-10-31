import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import logo from '../assets/logo4.jpg';

const App = () => {

  const [walletInfo, setWalletInfo] = useState({});
  // state = {
  //   walletInfo: {}
  // }

  useEffect(async () => {
      const json = await axios.get('/api/wallet-info');

      
  });

  // React Lifecycle Method
  // componentDidMount() {
  //   fetch(`${document.location.origin}/api/wallet-info`)
  //     .then(response => response.json())
  //     .then(json => this.setState({ walletInfo: json }));
  // }

  // render() {

    const { address, balance } = this.state.walletInfo;

    return (
      <div className="App">
        <img src={logo} className="logo" />
        <div>Welcome to the Blockchain!</div>
        <Link to="/blocks">Blocks</Link>
        <Link to="/conduct-transaction">Conduct a Transaction</Link>
        <Link to="/transaction-pool">Transaction Pool</Link>
        <div className="wallet-info">
        <div>Address: { address }</div>
        <div>Balance: { balance }</div>
        </div>
      </div>
    )
  // }
}

export default App;
