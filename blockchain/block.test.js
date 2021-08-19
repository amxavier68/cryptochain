const Block = require('./block');
const { GENESIS_STATE_FILE, GAS_LIMIT, INITIAL_DIFFICULTY } = require('../config');
const { cryptoHash } = require('../util');
const hexToBinary = require('hex-to-binary');

describe('Block', () => {

  const 
    timestamp = 2000, 
    parentHash = '0x0000000000000000000000000000000000000000000000000000000000000000', 
    mixHash = '0x0000000000000000000000000000000000000000000000000000000000000000', 
    extraData = '0x43a3dfdb4j343b428c638c19837004b5ed33adb3db69cbdb7a38e1e50b1b82fa', 
    difficulty = INITIAL_DIFFICULTY, 
    nonce = '0x0000', 
    block = new Block({ timestamp, parentHash, mixHash, extraData, difficulty, nonce });

  it('has the following properties: `timestamp`, `parentHash`, `mixHash`, `extraData`, `difficulty`, `nonce`', () => {
    expect(block.timestamp).toEqual(timestamp);
    expect(block.parentHash).toEqual(parentHash);
    expect(block.mixHash).toEqual(mixHash);
    expect(block.extraData).toEqual(extraData);
    expect(block.nonce).toEqual(nonce);
    expect(block.difficulty).toEqual(difficulty);
  });

  describe('genesis()', () => {
    const genesisBlock = Block.genesis();

    it('returns a Block instance', () => {
      expect(genesisBlock instanceof Block).toBe(true);
    });

    it('returns the genesis data', () => {
      expect(genesisBlock).toEqual(GENESIS_STATE_FILE);
    });
  });

  describe('mineBlock()', () => {
    const lastBlock = Block.genesis();
    const extraData = ['mined', 'extra', 'data'];
    const minedBlock = Block.mineBlock({ lastBlock, extraData });

    it('returns a Block instance', () => {
      expect(minedBlock instanceof Block).toBe(true);
    });

    it('sets the `parentHash` to be the `mixHash` of the lastBlock', () => {
      expect(minedBlock.parentHash).toEqual(lastBlock.mixHash);
    });

    it('sets the `extraData`', () => {
      expect(minedBlock.extraData).toEqual(extraData);
    });

    it('it sets the `timestamp`', () => {
      expect(minedBlock.timestamp).not.toEqual(undefined);
    });

    it('creates a `SHA-256` based upon the proper inputs', () => {
      expect(minedBlock.mixHash)
        .toEqual(
          cryptoHash(
            minedBlock.timestamp, 
            minedBlock.nonce, 
            minedBlock.difficulty, 
            lastBlock.parentHash, 
            extraData
          ));
    });

    it('sets the `mixHash` that matches the difficulty criteria', () => {
      expect(hexToBinary(minedBlock.mixHash).substring(0, minedBlock.difficulty))
        .toEqual('0'.repeat(minedBlock.difficulty));
    });

    it('adjusts the difficulty', () => {
      const possibleResults = [lastBlock.difficulty+1, lastBlock.difficulty-1];
      expect(possibleResults.includes(minedBlock.difficulty)).toBe(true);
    });
  });

  describe('adjustDifficulty()', () => {
    it('raises the difficulty for a quickly mined block', () => {
      expect(Block.adjustDifficulty({ 
        originalBlock: block,
        timestamp: block.timestamp + GAS_LIMIT - 100
      })).toEqual(block.difficulty+1);
    });

    it('lowers the difficulty for a slowly mined block', () => {
      expect(Block.adjustDifficulty({ 
        originalBlock: block,
        timestamp: block.timestamp + GAS_LIMIT + 100
      })).toEqual(block.difficulty-1);
    });

    it('has a lower level of 1', () => {
      block.difficulty = -1;
      expect(Block.adjustDifficulty({originalBlock: block})).toEqual(1);
    });
  });
});