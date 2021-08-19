import React, { Component } from 'react';
import { Button } from 'react-bootstrap';
import Transaction from './Transaction';

class Block extends Component {
  state = { displayTransaction: false };

  toggleTransaction = () => {
    this.setState({ displayTransaction: !this.state.displayTransaction });
  }

  get displayTransaction() {
    const { extraData } = this.props.block;

    const stringifiedData = JSON.stringify(extraData);

    const dataDisplay = stringifiedData.length > 35 ?
      `${stringifiedData.substring(0, 35)}...` :
      stringifiedData;

    if (this.state.displayTransaction) {
      return (
        <div>
          {
            extraData.map(transaction => (
              <div key={transaction.id}>
                <hr />
                <Transaction transaction={transaction} />
              </div>
            ))
          }
          <br />
          <Button
            className="btn btn-danger btn-sm"
            onClick={this.toggleTransaction}
          >
            Show Less
          </Button>
        </div>
      )
    }

    return (
      <div>
        <div>Data: {dataDisplay}</div>
        <Button
          className="btn btn-danger btn-sm"
          onClick={this.toggleTransaction}
        >
          Show More
        </Button>
      </div>
    );
  }

  render() {
    const { timestamp, mixHash } = this.props.block;

    const hashDisplay = `${mixHash.substring(0, 15)}...`;

    return (
      <div className='block'>
        <div>Hash: {hashDisplay}</div>
        <div>Timestamp: {new Date(timestamp).toLocaleString()}</div>
        {this.displayTransaction}
      </div>
    );
  }
};

export default Block;