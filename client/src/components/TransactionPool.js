import React, { Component } from 'react';
import Transaction from './Transaction';
import { Link } from 'react-router-dom';
import { Button } from 'react-bootstrap';
import history from '../history';

const POLL_INTERVAL_MS = 2500; 

class TransactionPool extends Component {

  state = { transactionPoolMap: {} };

  fetchTrxPoolMap = () => {
    fetch(`${document.location.origin}/api/transaction-pool-map`)
    .then(response => response.json())
    .then(json => this.setState({ transactionPoolMap: json }));    
  }

  fetchMineTrx = () => {
    fetch(`${document.location.origin}/api/mine-transactions`)
    .then(response => {
      if (response.status === 200) {
        alert('Success');
        this.props.history.push('/blocks');
      } else {
        alert('The mine-transaction block did not complete.');
      }
    });

  }

  componentDidMount() {
    this.fetchTrxPoolMap();

    this.fetchPoolMapInterval = setInterval(() => this.fetchTrxPoolMap(), POLL_INTERVAL_MS );
  }

  componentWillUnmount() {
    clearInterval(this.fetchPoolMapInterval);
  }

  render() {
    
    console.log('this.state', this.state);
    
    return (
      <div className="trx-pool">
        <div><Link to="/">Home</Link></div>
        <div><Link to="/conduct-transaction">Conduct a Transaction</Link></div>

        <h3>Transaction Pool</h3>
        {
          Object.values(this.state.transactionPoolMap).map( trx => (
            <div key={trx.id}>
              <hr />
              <Transaction transaction={trx} />
            </div>
          ))
        }  
        <hr />
        <Button
          className="btn btn-success btn-lg"
          onClick={this.fetchMineTrx}
        >
          Mine Transactions
        </Button>
      </div>
    )
  }
}

export default  TransactionPool;