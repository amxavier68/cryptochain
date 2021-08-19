const Block = require('./block');
const Transaction = require('../wallet/transaction');
const Wallet = require('../wallet');
const { cryptoHash } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

class Blockchain {
  constructor() {
    this.chain = [Block.genesis()];
  }

  addBlock({ extraData }) {
    const newBlock = Block.mineBlock({
      lastBlock: this.chain[this.chain.length-1],
      extraData
    });

    this.chain.push(newBlock);
  }

  replaceChain(chain, validateTrxs, onSuccess) {
    if (chain.length <= this.chain.length) {
      console.error('The incoming chain must be longer');
      return;
    }

    if (!Blockchain.isValidChain(chain)) {
      console.error('The incoming chain must be valid');
      return;
    }

    if (validateTrxs && !this.validTrxData({ chain })) {
      console.error('The incoming chain has invalid data');
      return;
    }

    if (onSuccess) onSuccess();
    console.log('replacing chain with', chain);
    this.chain = chain;
  }

  validTrxData({ chain }) {
    for (let i=1; i<chain.length; i++) {
      const block = chain[i];
      const transactionSet = new Set();
      let rewardTrxCount = 0;

      for (let trx of block.extraData) {
        if (trx.input.address === REWARD_INPUT.address) {
          rewardTrxCount += 1;

          if (rewardTrxCount > 1) {
            console.error('Miner rewards exceed limit');
            return false;
          }

          if (Object.values(trx.outputMap)[0] !== MINING_REWARD) {
            console.error('Miner reward amount is invalid');
            return false;
          }
        } else {
          if (!Transaction.validTransaction(trx)) {
            console.error('Invalid transaction');
            return false;
          }

          const trueBalance = Wallet.calcBalance({
            chain: this.chain,
            address: trx.input.address
          });

          if (trx.input.amount !== trueBalance) {
            console.error('Invalid input amount');
            return false;
          }

          if (transactionSet.has(trx)) {
            console.error('An identical transaction appears more than once in the block');
            return false;
          } else {
            transactionSet.add(trx);
          }
        }
      }
    }

    return true;
  }

  static isValidChain(chain) {
    if (JSON.stringify(chain[0]) !== JSON.stringify(Block.genesis())) {
      return false;
    };

    for (let i=1; i<chain.length; i++) {
      const { timestamp, parentHash, mixHash, nonce, difficulty, extraData } = chain[i];
      const actualLastHash = chain[i-1].mixHash;
      const lastDifficulty = chain[i-1].difficulty;

      if (parentHash !== actualLastHash) return false;

      const validatedHash = cryptoHash(timestamp, parentHash, extraData, nonce, difficulty);

      if (mixHash !== validatedHash) return false;

      if (Math.abs(lastDifficulty - difficulty) > 1) return false;
    }

    return true;
  }
}

module.exports = Blockchain;