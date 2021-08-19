import React, { Component } from 'react';
import { FormGroup, FormControl, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import history from '../history';

class ConductTransaction extends Component {

  state = { recipient: '', amount: 0.00 };

  updateRecipient = event => {
    this.setState({ recipient: event.target.value });
  }

  updateAmount = () => {
    this.setState({ amount: Number(event.target.value) });
  }

  conductTransaction = () => {
    const { recipient, amount } = this.state;

    fetch(`${document.location.origin}/api/transact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipient, amount })
    }).then(response => response.json())
      .then(json => {
        alert(json.message || json.type);
        this.props.history.push('/transaction-pool');
      });
  }

  render() {
    return (
      <div className="conduct-transactions">
        <Link to="/">Home</Link>
        <h3>Conduct a Transaction</h3>
        <FormGroup>
          <FormControl
            input="text"
            placeholder="recipient"
            value={this.state.recipient}
            onChange={this.updateRecipient}
          />
        </FormGroup>
        <FormGroup>
          <FormControl
            input="text"
            placeholder="amount"
            value={this.state.amount}
            onChange={this.updateAmount}
          />
        </FormGroup>
        <div>
          <Button
          className="btn btn-danger btn-lg"
          onClick={this.conductTransaction}
          >
            Submit
          </Button>
        </div>
      </div>
    )
  }
}

export default ConductTransaction;