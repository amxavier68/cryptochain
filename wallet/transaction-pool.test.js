const TransactionPool = require('./transaction-pool');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain');
const Wallet = require('./index');

describe('TransactionPool', () => {

  let tp, trx, bc, senderWallet;

  beforeEach(() => {
    tp = new TransactionPool();
    senderWallet = new Wallet();
    trx = new Transaction({
      senderWallet,
      recipient: 'fake-recipient',
      amount: 14.95
    });
  });

  describe('setTransaction()', () => {
    it('adds a transaction', () => {
      tp.setTransaction(trx);
      expect(tp.transactionMap[trx.id]).toBe(trx);
    });
  });

  describe('existingTransaction()', () => {
    it('returns an existing transaction given an input address', () => {
      tp.setTransaction(trx);

      expect(
        tp.existingTransaction({ inputAddress: senderWallet.publicKey })
      ).toBe(trx);
    });
  });

  describe('validTransactions()', () => {

    let validTransactions, errorMock;

    beforeEach(() => {
      validTransactions = [];
      errorMock = jest.fn();

      global.console.error = errorMock;

      for (let i = 0; i < 10; i++) {
        trx = new Transaction({
          senderWallet,
          recipient: 'any-recipient',
          amount: 30
        })

        if (i%3===0) {
          trx.input.amount = 999999.99;
        } else if (i%3===1) {
          trx.input.signature = new Wallet().sign('foo');
        } else {
          validTransactions.push(trx);
        }

        tp.setTransaction(trx);
      }
    });

    it('returns valid transactions', () => {
      expect(tp.validTransactions()).toEqual(validTransactions);
    });

    it('logs errors for invalid transactions', () => {
      tp.validTransactions();
      expect(errorMock).toHaveBeenCalled();
    })

  });

  describe('clear()', () => {
    it('clears the transactions', () => {
      tp.clear();
      expect(tp.transactionMap).toEqual({});
    });
  });

  describe('clearBlockchainTransactions()', () => {
    it('clears the pool of any blockchain transactions', () => {
      const bc = new Blockchain();
      const expectedTransactionMap = {};

      for (let i=0; i < 6; i++) {
        const trx = new Wallet().createTransaction({
          recipient: 'foo',
          amount: 50
        });
        tp.setTransaction(trx);

        if(i%2===0) {
          bc.addBlock({ extraData: [ trx ] });
        } else {
          expectedTransactionMap[trx.id] = trx;
        }
      }
      tp.clearBlockchainTransactions({ chain: bc.chain });

      expect(tp.transactionMap).toEqual(expectedTransactionMap);

    });
  });
});