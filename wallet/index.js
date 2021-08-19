const { STARTING_BALANCE } = require('../config');
const { ec, cryptoHash } = require('../util');
const Transaction = require('./transaction');

class Wallet {
  constructor() {
    this.balance = STARTING_BALANCE;

    this.keyPair = ec.genKeyPair();
    this.publicKey = this.keyPair.getPublic().encode('hex');
    this.privateKey = this.keyPair.getPrivate().toString('hex');
  }

  sign(extraData) {
    return this.keyPair.sign(cryptoHash(extraData));
  }
  
  createTransaction({ recipient, amount, chain }) {
    if (chain) {
      this.balance = Wallet.calcBalance({
        chain,
        address: this.publicKey
      });
    }
  
    if (amount > this.balance) {
      throw new Error('Amount exceeds balance');
    }
  
    return new Transaction({ senderWallet: this, recipient, amount });
  }

  static calcBalance({ chain, address }) {
    let hasConductedTrx = false;
    let outputsTotal = 0;

    for (let i=chain.length-1; i > 0; i--) {
      const block = chain[i];

      for (let trx of block.extraData) {

        if (trx.input.address === address) {
          hasConductedTrx = true;
        }

        const addressOutput = trx.outputMap[address];
        if (addressOutput) {
          outputsTotal = outputsTotal + addressOutput;
        }
      }
      if (hasConductedTrx) {
        break;
      }
    }

    return hasConductedTrx ? outputsTotal : STARTING_BALANCE + outputsTotal;
  }
}



module.exports = Wallet;