const Wallet = require('./index');
const Transaction = require('./transaction');
const Blockchain = require('../blockchain');
const { verifySignature } = require('../util');
const { STARTING_BALANCE } = require('../config');

describe('Wallet', () => {
  let wallet;

  beforeEach(() => {
    wallet = new Wallet();
  });

  it('has a `balance`', () => {
    expect(wallet).toHaveProperty('balance');
  });

  it('has a `publicKey`', () => {
    expect(wallet).toHaveProperty('publicKey');
  });

  it('has a `privateKey`', () => {
    expect(wallet).toHaveProperty('privateKey');
  });

  describe('sign data', () => {

    const extraData = 'foo-bar';

    it('verifies a signature', () => {
      expect(verifySignature({
        publicKey: wallet.publicKey,
        extraData,
        signature: wallet.sign(extraData)
      })).toBe(true);
    });

    it('does not verify an invalid signature', () => {
      expect(verifySignature({
        publicKey: wallet.publicKey,
        extraData,
        signature: new Wallet().sign(extraData)
      })).toBe(false);
    });


  });

  describe('createTransaction()', () => {
    describe('and the amount exceeds the balance', () => {
      it('throws an error', () => {
        expect(() => wallet.createTransaction({ amount: 999999.99, recipient: 'foo-recipient' }))
          .toThrow('Amount exceeds balance');
      });
    });

    describe('and the amount is valid', () => {

      let trx, amount, recipient;

      beforeEach(() => {
        amount = 24.95;
        recipient = 'foo-recipient';

        trx = wallet.createTransaction({ amount, recipient });
      });

      it('creates an instance of the `Transaction`', () => {
        expect(trx instanceof Transaction).toBe(true);
      });

      it('matches the transaction input with the wallet', () => {
        expect(trx.input.address).toEqual(wallet.publicKey);
      });

      it('outputs the amount to the recipient', () => {
        expect(trx.outputMap[recipient]).toEqual(amount);
      });
    });

    describe('and a chain is passed', () => {
      it('calls a `Wallet.calcBalance()`', () => {
        const calcBalanceMock = jest.fn();

        const originalCalcBalance = Wallet.calcBalance;

        Wallet.calcBalance = calcBalanceMock;
        wallet.createTransaction({ recipient: 'foo', amount: 10, chain: new Blockchain().chain });

        expect(calcBalanceMock).toHaveBeenCalled();
        Wallet.calcBalance = originalCalcBalance;
      });

    });
  });

  describe('calcBalance()', () => {

    let bc;

    beforeEach(() => {
      bc = new Blockchain();
    });

    describe('and there are no outputs for the wallet', () => {
      it('returns the `STARTING_BALANCE`', () => {
        expect(
          Wallet.calcBalance({
            chain: bc.chain,
            address: wallet.publicKey
          })
        ).toEqual(STARTING_BALANCE);
        

      });
    });

    describe('and there are outputs for the wallet', () => {

      let trxOne, trxTwo;

      beforeEach(() => {
        trxOne = new Wallet().createTransaction({ recipient: wallet.publicKey, amount: 49.95 });
        trxTwo = new Wallet().createTransaction({ recipient: wallet.publicKey, amount: 24.95 });

        bc.addBlock({ extraData: [ trxOne, trxTwo ] });
      });

      it('adds the sum of ALL outputs to the wallet balance', () => {
        expect(Wallet.calcBalance({
          chain: bc.chain,
          address: wallet.publicKey
        })).toEqual(
          STARTING_BALANCE +
          trxOne.outputMap[wallet.publicKey] +
          trxTwo.outputMap[wallet.publicKey]
        );
        
      });

      describe('and the wallet has made a transaction', () => {
        let recentTrx;

        beforeEach(() => {
          recentTrx = wallet.createTransaction({
            recipient: 'foo-address',
            amount: 30
          });
          bc.addBlock({ extraData: [ recentTrx ] });
        });

        it('returns the output amount of the recent transaction', () => {
          expect(Wallet.calcBalance({
            chain: bc.chain,
            address: wallet.publicKey
          })).toEqual(recentTrx.outputMap[wallet.publicKey]);
        });

        describe('and there are outputs next to and after the recent transaction', () => {

          let sameBlockTrx, nextBlockTrx;

          beforeEach(() => {
            recentTrx = wallet.createTransaction({
              recipient: 'later-foo-address',
              amount: 59.95
            });
            sameBlockTrx = Transaction.rewardTransaction({ minerWallet: wallet });
            bc.addBlock({ extraData: [ recentTrx, sameBlockTrx ] });

            nextBlockTrx = new Wallet().createTransaction({ 
              recipient: wallet.publicKey,
              amount: 74.99
             });

            bc.addBlock({ extraData: [ nextBlockTrx ] });
          });

          it('includes the output amounts in the returned balance', () => {
            expect(
              Wallet.calcBalance({
                chain: bc.chain,
                address: wallet.publicKey
              })
            ).toEqual(
              recentTrx.outputMap[wallet.publicKey] +
              sameBlockTrx.outputMap[wallet.publicKey] +
              nextBlockTrx.outputMap[wallet.publicKey]
            );
          });
        });
      });
    });
  });
});