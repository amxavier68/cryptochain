// https://arvanaghi.com/blog/explaining-the-genesis-block-in-ethereum/

const GAS_LIMIT = 1000;         // AKA mine_rate, num of computations
const INITIAL_DIFFICULTY = 4;   // How many leading zeros should it lead with
const STARTING_BALANCE = 1000;  // TODO: Generate balance on user creation
const MINING_REWARD = 5;        // Based on Ethereum 5 Ether Mining Reward

const GENESIS_STATE_FILE = {
  timestamp: '0x00', 
  parentHash: '0x0000000000000000000000000000000000000000000000000000000000000000', 
  mixHash: '0x0000000000000000000000000000000000000000000000000000000000000000', 
  extraData: '0x43a3dfdb4j343b428c638c19837004b5ed33adb3db69cbdb7a38e1e50b1b82fa', 
  difficulty: INITIAL_DIFFICULTY, // i.e 0x000
  nonce: '0x0000'
};

const REWARD_INPUT = { address: '*authorized-reward*' };

module.exports = { 
  INITIAL_DIFFICULTY, 
  GENESIS_STATE_FILE, 
  GAS_LIMIT, 
  STARTING_BALANCE, 
  REWARD_INPUT,
  MINING_REWARD 
};