const Blockchain = require('../blockchain');
const bc = new Blockchain();

bc.addBlock({ extraData: 'initial' });

console.log('first block: ', bc.chain[bc.chain.length-1]);

let prevTimestamp, nextTimestamp, nextBlock, timeDiff, average;

const times = [];

for (let i=0; i < 10000; i++) {
  prevTimestamp = bc.chain[bc.chain.length-1].timestamp;

  bc.addBlock({ extraData: `${i}`});
  nextBlock = bc.chain[bc.chain.length-1];

  nextTimestamp = nextBlock.timestamp;
  timeDiff = nextTimestamp - prevTimestamp;
  times.push(timeDiff);

  average = times.reduce((total, num) => (total + num) )/times.length;

  console.log(`Time to mine block: ${timeDiff}ms. Difficulty: ${nextBlock.difficulty}. Average time: ${average.toFixed(2)}ms.`)
}