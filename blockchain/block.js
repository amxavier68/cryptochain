const hexToBinary = require('hex-to-binary');
const { GENESIS_STATE_FILE, GAS_LIMIT } = require('../config');
const { cryptoHash } = require('../util');

class Block {
  constructor({ timestamp, parentHash, mixHash, extraData, difficulty, nonce }) {
    this.timestamp = timestamp,   // Unix timestamp
    this.parentHash = parentHash, // lastHash - 256bit hash
    this.mixHash = mixHash,       // hash - 256bit hash
    this.difficulty = difficulty, // Proof of Work - Determines how hard it is to mine a block
    this.nonce = nonce,           // Proof of Work
    this.extraData = extraData    // Arbitrary
  }

  // Factory Method
  static genesis() {
    return new this(GENESIS_STATE_FILE);
  }

  static mineBlock({ lastBlock, extraData }) {

    const parentHash = lastBlock.mixHash;
    let mixHash, timestamp;
    let { difficulty } = lastBlock;
    let nonce = 0;

    do {
      nonce++;
      timestamp = Date.now();
      difficulty = Block.adjustDifficulty({ originalBlock: lastBlock, timestamp });

      mixHash = cryptoHash(timestamp, parentHash, extraData, nonce, difficulty);
    } while (hexToBinary(mixHash).substring(0, difficulty) !== '0'.repeat(difficulty));

    return new this({ 
      timestamp,
      parentHash,
      extraData,
      difficulty,
      nonce,
      mixHash
     });
  }

  static adjustDifficulty({ originalBlock, timestamp }) {
    const { difficulty } = originalBlock;

    if (difficulty < 1) return 1;

    if ((timestamp - originalBlock.timestamp) > GAS_LIMIT ) return difficulty - 1;

    return difficulty + 1;
  }
}




module.exports = Block;