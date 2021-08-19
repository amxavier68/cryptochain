const Blockchain = require('./index');
const Block = require('./block');
const { cryptoHash } = require('../util');
const Wallet = require('../wallet');
const Transaction = require('../wallet/transaction');
const { rewardTransaction } = require('../wallet/transaction');

describe('Blockchain', () => {

  let bc, nc, originalChain, errorMock;

  beforeEach(() => {
    bc = new Blockchain();
    nc = new Blockchain();
    originalChain = bc.chain;

    errorMock = jest.fn();
    global.console.error = errorMock;
  });

  it('contains a `chain` Array instance', () => {
    expect(bc.chain instanceof Array).toBe(true);
  });

  it('starts with the genesis block', () => {
    expect(bc.chain[0]).toEqual(Block.genesis());
  });

  it('adds a new block to the chain', () => {
    const newData = 'foo bar';

    bc.addBlock({ extraData: newData });
    console.log(newData);

    expect(bc.chain[bc.chain.length-1].extraData).toEqual(newData);
  });
  
  describe('isValidChain()', () => {

    beforeEach(() => {
      bc.addBlock({ extraData: '0x1234'});
      bc.addBlock({ extraData: '0x4321'});
      bc.addBlock({ extraData: '0x9999'});
    });

    describe('when the chain does not start with the genesis block', () => {
      it('returns false', () => {
        bc.chain[0] = { extraData: 'fake-genesis' };
        expect(Blockchain.isValidChain(bc.chain)).toBe(false);
      });
    });

    describe('when the chain starts with the genesis block and has multiple blocks', () => {
      describe('and a `parentHash` has changed', () => {
        it('returns false', () => {
          bc.chain[2].parentHash = 'broken parentHash';
          expect(Blockchain.isValidChain(bc.chain)).toBe(false);          
        });
      });

      describe('and the chain contains a block with an invalid field', () => {
        it('returns false', () => {
          bc.chain[2].extraData = 'some-bad-and-evil-data';
          expect(Blockchain.isValidChain(bc.chain)).toBe(false); 
        });
      });

      describe('and the chain contains block with a jumped difficulty', () => {
        it('returns false', () => {
          const lastBlock = bc.chain[bc.chain.length-1];
          const parentHash = lastBlock.mixHash;
          const timestamp = Date.now();
          const nonce = 0;
          const extraData = [];
          const difficulty = lastBlock.difficulty -3;

          const mixHash = cryptoHash(timestamp, parentHash, difficulty, nonce, extraData);

          const badBlock = new Block({ timestamp, parentHash, mixHash, difficulty, nonce, extraData });

          bc.chain.push(badBlock);

          expect(Blockchain.isValidChain(bc.chain)).toBe(false);
        });
      });

      describe('and the chain does not contain any invalid blocks', () => {
        it('returns true', () => {
          expect(Blockchain.isValidChain(bc.chain)).toBe(true);
        });
      });
    });


  });

  describe('replaceChain()', () => {

    let logMock;

    beforeEach(() => {
      logMock = jest.fn();
      global.console.log = logMock;
    });

    describe('when the new chain is not longer', () => {

      beforeEach(() => {
        nc.chain[0] = { new: 'chain' };
        bc.replaceChain(nc.chain);
      });

      it('does not replace the chain', () => {
        expect(bc.chain).toEqual(originalChain);
      });

      it('logs an error', () => {
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('when the chain is longer', () => {

      beforeEach(() => {
        nc.addBlock({ extraData: '0x1234'});
        nc.addBlock({ extraData: '0x4321'});
        nc.addBlock({ extraData: '0x9999'});
      });

      describe('and the chain is invalid', () => {

        beforeEach(() => {
          nc.chain[2].extraData = 'fake-extraData';
          bc.replaceChain(nc.chain);
        });

        it('does not replace the chain', () => {
          expect(bc.chain).toEqual(originalChain);
        });

        it('logs an error', () => {
          expect(errorMock).toHaveBeenCalled();
        });
      });
      
      describe('and the chain is valid', () => {
        
        beforeEach(() => {
          bc.replaceChain(nc.chain);
        });
        
        it('replaces the chain', () => {
          expect(bc.chain).toEqual(nc.chain);
        });

        it('logs about the chain replacement', () => {
          expect(logMock).toHaveBeenCalled();
        });
      });
    });

    describe('and the `validateTrxs` flag is true', () => {
      it('calls ValidateTrxData()', () => {
        const validateTrxDataMock = jest.fn();
        bc.validTrxData = validateTrxDataMock;

        nc.addBlock({ extraData: 'foo' });

        bc.replaceChain(nc.chain, true);
        expect(validateTrxDataMock).toHaveBeenCalled();
      });
    });
  });

  describe('ValidTrxData()', () => {
    
    let trx, rewardTrx, wallet;

    beforeEach(() => {
      wallet = new Wallet();

      trx = wallet.createTransaction({ address: 'foo-address', amount: 65 });
      rewardTrx = Transaction.rewardTransaction({ minerWallet: wallet });
    });

    describe('and the transaction data is valid', () => {
      it('returns true', () => {
        nc.addBlock({ extraData: [ trx, rewardTrx ] }); 
        expect(bc.validTrxData({ chain: nc.chain })).toBe(true);
        expect(errorMock).not.toHaveBeenCalled();
      });
    });

    describe('and the transaction data has multiple rewards', () => {});
      it('returns false and logs an error', () => {
        nc.addBlock({ extraData: [ trx, rewardTrx, rewardTrx ]});
        expect(bc.validTrxData({ chain: nc.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });

    describe('and the transaction data has at least one malformed outputMap', () => {
      describe('and the transaction is not a reward transaction', () => {
        it('returns false and logs an error', () => {
          trx.outputMap[wallet.publicKey] = 999999.99;

          nc.addBlock({ extraData: [ trx, rewardTrx ]});

          expect(bc.validTrxData({ chain: nc.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the transaction is a reward transaction', () => {
        it('returns false and logs an error', () => {
          rewardTrx.outputMap[wallet.publicKey] = 999999.99;
          nc.addBlock({ extraData: [ trx, rewardTrx ] });

          expect(bc.validTrxData({ chain: nc.chain })).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });

    describe('and the transaction data has at least one malformed input', () => {
      it('returns false and logs an error', () => {
        wallet.balance = 9000;

        const evilOutputMap = {
          [wallet.publicKey]: 8900,
          fooRecipient: 100
        };

        const evilTrx = {
          input: {
            timestamp: Date.now(),
            amount: wallet.balance,
            address: wallet.publicKey,
            signature: wallet.sign(evilOutputMap)
          },
          outputMap: evilOutputMap
        }

        nc.addBlock({ extraData: [evilTrx, rewardTrx] });

        expect(bc.validTrxData({ chain: nc.chain })).toBe(false);
        expect(errorMock).toHaveBeenCalled();
      });
    });

    describe('and a block has multiple identical transaction', () => {
      it('returns false and logs an error', () => {

        nc.addBlock({
          extraData: [trx, trx, trx, rewardTrx]
        });

        expect(bc.validTrxData({ chain: nc.chain })).toBe(false);

        expect(errorMock).toHaveBeenCalled();
      });
    });

  });
});