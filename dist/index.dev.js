"use strict";

var express = require('express');

var request = require('request');

var cors = require('cors');

var path = require('path');

var Blockchain = require('./blockchain');

var PubSub = require('./app/pubsub');

var TransactionPool = require('./wallet/transaction-pool');

var Wallet = require('./wallet');

var TransactionMiner = require('./app/transaction-miner');

var isDevelopment = process.env.ENV === 'development';
var DEFAULT_PORT = 3000;
var ROOT_NODE_ADDRESS = "http://localhost:".concat(DEFAULT_PORT);
var app = express();
var blockchain = new Blockchain();
var transactionPool = new TransactionPool();
var wallet = new Wallet();
var pubsub = new PubSub({
  blockchain: blockchain,
  transactionPool: transactionPool
});
var transactionMiner = new TransactionMiner({
  blockchain: blockchain,
  transactionPool: transactionPool,
  wallet: wallet,
  pubsub: pubsub
}); // Middlewares

app.use(express.json());
app.use(express["static"](path.join(__dirname, 'client/dist')));
app.use(cors());
app.get('/api/blocks', function (req, res) {
  res.json(blockchain.chain);
});
app.post('/api/mine', function (req, res) {
  var extraData = req.body.extraData;
  blockchain.addBlock({
    extraData: extraData
  });
  pubsub.broadcastChain();
  res.redirect('/api/blocks');
});
app.post('/api/transact', function (req, res) {
  var _req$body = req.body,
      amount = _req$body.amount,
      recipient = _req$body.recipient;
  var transaction = transactionPool.existingTransaction({
    inputAddress: wallet.publicKey
  });

  try {
    if (transaction) {
      transaction.update({
        senderWallet: wallet,
        recipient: recipient,
        amount: amount
      });
    } else {
      transaction = wallet.createTransaction({
        recipient: recipient,
        amount: amount,
        chain: blockchain.chain
      });
    }
  } catch (error) {
    return res.status(400).json({
      type: 'error',
      message: error.message
    });
  }

  transactionPool.setTransaction(transaction);
  pubsub.broadcastTransaction(transaction);
  res.json({
    type: 'success',
    transaction: transaction
  });
});
app.get('/api/transaction-pool-map', function (req, res) {
  res.json(transactionPool.transactionMap);
});
app.get('/api/mine-transactions', function (req, res) {
  transactionMiner.mineTransactions();
  res.redirect('/api/blocks');
});
app.get('/api/wallet-info', function (req, res) {
  var address = wallet.publicKey;
  res.status(200).json({
    address: address,
    balance: Wallet.calcBalance({
      chain: blockchain.chain,
      address: address
    })
  });
});
app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'client/dist/index.html'));
});

var syncWithRootState = function syncWithRootState() {
  request({
    url: "".concat(ROOT_NODE_ADDRESS, "/api/blocks")
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var rootChain = JSON.parse(body);
      console.log('replace chain on a sync with', rootChain);
      blockchain.replaceChain(rootChain);
    }
  });
  request({
    url: "".concat(ROOT_NODE_ADDRESS, "/api/transaction-pool-map")
  }, function (error, response, body) {
    if (!error && response.statusCode === 200) {
      var rootTransactionPoolMap = JSON.parse(body);
      console.log('replace transaction pool map on a sync with', rootTransactionPoolMap);
      transactionPool.setMap(rootTransactionPoolMap);
    }
  });
}; // if (isDevelopment) {


var walletFoo = new Wallet();
var walletBar = new Wallet();

var generateWalletTransaction = function generateWalletTransaction(_ref) {
  var wallet = _ref.wallet,
      recipient = _ref.recipient,
      amount = _ref.amount;
  var transaction = wallet.createTransaction({
    recipient: recipient,
    amount: amount,
    chain: blockchain.chain
  });
  transactionPool.setTransaction(transaction);
};

var walletAction = function walletAction() {
  return generateWalletTransaction({
    wallet: wallet,
    recipient: walletFoo.publicKey,
    amount: 5
  });
};

var walletFooAction = function walletFooAction() {
  return generateWalletTransaction({
    wallet: walletFoo,
    recipient: walletBar.publicKey,
    amount: 10
  });
};

var walletBarAction = function walletBarAction() {
  return generateWalletTransaction({
    wallet: walletBar,
    recipient: wallet.publicKey,
    amount: 15
  });
};

for (var i = 0; i < 20; i++) {
  if (i % 3 === 0) {
    walletAction();
    walletFooAction();
  } else if (i % 3 === 1) {
    walletAction();
    walletBarAction();
  } else {
    walletFooAction();
    walletBarAction();
  }

  transactionMiner.mineTransactions();
} // }


var PEER_PORT;

if (process.env.GENERATE_PEER_PORT === 'true') {
  PEER_PORT = DEFAULT_PORT + Math.ceil(Math.random() * 1000);
}

var PORT = process.env.PORT || PEER_PORT || DEFAULT_PORT;
app.listen(PORT, function () {
  console.log("listening at localhost:".concat(PORT));

  if (PORT !== DEFAULT_PORT) {
    syncWithRootState();
  }
});