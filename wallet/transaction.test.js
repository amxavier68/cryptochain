const Transaction = require('./transaction');
const Wallet = require('./index');
const { verifySignature } = require('../util');
const { REWARD_INPUT, MINING_REWARD } = require('../config');

describe('Transaction', () => {

  let trx, senderWallet, recipient, amount;

  beforeEach(() => {
    senderWallet = new Wallet();
    recipient = 'r3c1p13nt-publicKey';
    amount = 50.00;

    trx = new Transaction({ senderWallet, recipient, amount });
  });

  it('has an `id`', () => {
    expect(trx).toHaveProperty('id');
  });

  describe('outputMap', () => {
    it('has an `outputMap`', () => {
      expect(trx).toHaveProperty('outputMap');
    });

    it('outputs the amount to the recipient', () => {
      expect(trx.outputMap[recipient]).toEqual(amount);
    });

    it('outputs the remaining balance to the `senderWallet`', () => {
      expect(trx.outputMap[senderWallet.publicKey]).toEqual(senderWallet.balance-amount);
    });
  });

  describe('input', () => {
    it('has an `input`', () => {
      expect(trx).toHaveProperty('input');
    });

    it('has a `timestamp` in the input', () => {
      expect(trx.input).toHaveProperty('timestamp');
    });

    it('sets the `amount` to the `senderWallet` balance', () => {
      expect(trx.input.amount).toEqual(senderWallet.balance);
    });

    it('sets the `address` to the `senderWallet`s publicKey', () => {
      expect(trx.input.address).toEqual(senderWallet.publicKey);
    });

    it('signs the input', () => {
      expect(verifySignature({
        publicKey: senderWallet.publicKey,
        extraData: trx.outputMap,
        signature: trx.input.signature
      })).toBe(true);
    });
  });

  describe('validTransaction()', () => {

    let errorMock;

    beforeEach(() => {
      errorMock = jest.fn();
      global.console.error = errorMock;
    });

    describe('when the transaction is valid', () => {
      it('returns true', () => {
        expect(Transaction.validTransaction(trx)).toBe(true);
      });
    });

    describe('when the transaction is invalid', () => {
      describe('and a transaction outputMap value  is invalid', () => {
        it('returns false and logs an error', () => {
          trx.outputMap[senderWallet.publicKey] = 999999;
          expect(Transaction.validTransaction(trx)).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });

      describe('and the transaction input signature is invalid', () => {
        it('returns false and logs an error', () => {
          trx.input.signature = new Wallet().sign('extraData');
          expect(Transaction.validTransaction(trx)).toBe(false);
          expect(errorMock).toHaveBeenCalled();
        });
      });
    });
  });

  describe('update()', () => {

    let originalSignature, originalSenderOutput, nextRecipient, nextAmount;

    describe('and the amount is invalid', () => {
      it('throws an error', () => {
        expect(() => {
          trx.update({
            senderWallet, 
            recipient: 'foo-recipient',
            amount: 999999.99
          })
        }).toThrow('Amount exceeds balance');
      });
    });

    describe('and the amount is valid', () => {

      beforeEach(() => {
        originalSignature = trx.input.signature;
        originalSenderOutput = trx.outputMap[senderWallet.publicKey];
        nextRecipient = 'next-recipient';
        nextAmount = 49.95;
  
        trx.update({ senderWallet, recipient: nextRecipient, amount: nextAmount });
      });
  
      it('outputs the amount to the next recipient', () => {
        expect(trx.outputMap[nextRecipient]).toEqual(nextAmount);
      });
  
      it('subtracts the amount from the original sender output amount', () => {
        expect(trx.outputMap[senderWallet.publicKey]).toEqual(originalSenderOutput - nextAmount);
      });
  
      it('maintains a total output that matches the input amount', () => {
        expect(
          Object.values(trx.outputMap).reduce((total, outputAmount) => total + outputAmount)
        ).toEqual(trx.input.amount);
        
      });
  
      it('re-signs the transaction', () => {
        expect(trx.input.signature).not.toEqual(originalSignature);
      });

      describe('and another update for the same recipient', () => {
        let addedAmount;

        beforeEach(() => {
          addedAmount = 80;
          trx.update({
            senderWallet, recipient: nextRecipient, amount: addedAmount
          });
        });

        it('adds to the recipient amount', () => {
          expect(trx.outputMap[nextRecipient])
            .toEqual(nextAmount + addedAmount);
        });

        it('subtracts the amount from the original sender output amount', () => {
          expect(trx.outputMap[senderWallet.publicKey])
            .toEqual(originalSenderOutput - nextAmount - addedAmount);
        });
      });
    });
  });

  describe('rewardTransaction()', () => {
    let rt, minerWallet;

    beforeEach(() => {
      minerWallet = new Wallet();
      rt = Transaction.rewardTransaction({ minerWallet });
    });

    it('creates a transaction with the reward input', () => {
      expect(rt.input).toEqual(REWARD_INPUT);
    });

    it('creates one transaction for the miner with the `MINING_REWARD`', () => {
      expect(rt.outputMap[minerWallet.publicKey]).toEqual(MINING_REWARD);
    });
  });
});