import React, { useState, useEffect } from 'react';
import WalletConnect from '@walletconnect/client';
import QRCodeModal from 'algorand-walletconnect-qrcode-modal';
import algosdk from 'algosdk';
import { KEYS } from '../../helpers/keys';
import { Box, Button, Typography } from '@mui/material';
import { formatJsonRpcRequest } from '@json-rpc-tools/utils';
import axios from 'axios';
// import { Buffer } from 'buffer';

// const reach = loadStdlib("ALGO")

const WalletConnectComp = () => {
  const [connector, setConnector] = useState(null);
  const [loading, setLoading] = useState(false);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [amount, setAmount] = useState(0);

  const port = '';
  const baseServer = KEYS.purestake_api;
  const token = {
    'X-API-Key': KEYS.token,
  };
  const algodClient = new algosdk.Algodv2(token, baseServer, port);
  // Function used to print asset holding for account and assetid
  useEffect(() => {
    const onConnect = async (chainId, connectedAccount) => {
      // handle connect event
      setAccount(connectedAccount);
      setChainId(chainId);
    };

    const refreshData = async () => {
      const { chainId, accounts, amount } = connector;
      await onConnect(chainId, accounts[0], amount);
      setLoading(false);
    };

    // add logic with side effect
    if (connector) {
      connector.on('connect', async (error, payload) => {
        if (error) {
          console.log(error);
          return;
        }

        const { chainId, accounts } = payload.params[0];
        await onConnect(chainId, accounts[0]);
        setLoading(false);
        console.log(amount);
      });

      //disconnect
      connector.on('disconnect', async (error, payload) => {
        if (error) {
          console.log(error);
        }
        //handle disconnect event
        resetApp();
      });
      // check state variables here & if needed refresh the app
      // If any of these variables do not exist and the connector is connected, refresh the data
      if ((!chainId || !account || !amount) && connector.connected) {
        refreshData();
      }
    }
  }, [connector, chainId, account, amount, algodClient]);

  // A function that connects users
  const connect = async () => {
    setLoading(true);
    //Create connector

    // 1. Create connector
    const connector = new WalletConnect({
      bridge: 'https://bridge.walletconnect.org',
      qrcodeModal: QRCodeModal,
    });

    // 2. Update the connector state
    setConnector(connector);

    // 3. If not connected, create a new session
    if (!connector.connected) {
      await connector.createSession();
    }

    // add connection logic
  };

  // A function that resets users connection state
  const resetApp = () => {
    setConnector(null);
    setLoading(false);
    setAccount(null);
    setChainId(null);
    setAmount(0);
  };

  //A function that checks user's wallet balance
  const walletBalance = async () => {
    let params = await algodClient.accountInformation(account).do();
    setAmount(params.amount);
    console.log(params);
    // const assetId = 95944269;
    let csaToken;
    for (let i = 0; i < params.assets.length; i++) {
      if (params.assets[i]['asset-id'] === 55131493) {
        csaToken = params.assets[i].amount;
        break;
      } else {
        alert('Token is not found!');
      }
    }
    console.log(csaToken);
  };

  //A function that sends transaction
  const claimAirdrop = async () => {
    try {
      //Construct the transaction
      let params = await algodClient.getTransactionParams().do();
      // comment out the next two lines to use suggested fee
      params.fee = 1000;
      params.flatFee = true;
      const receiver = account;
      const enc = new TextEncoder();
      let note = enc.encode('Congratulations!');
      let txn = algosdk.makePaymentTxnWithSuggestedParams(
        KEYS.sender,
        receiver,
        1000000,
        undefined,
        note,
        params
      );

      //Sign the transaction
      const passphrase = KEYS.passphrase;
      const myAccount = algosdk.mnemonicToSecretKey(passphrase);
      let signedTxn = txn.signTxn(myAccount.sk);
      console.log('SignedTxn', signedTxn);
      let txId = txn.txID().toString();
      console.log('Signed transaction with txID: %s', txId);
      console.log(txn);

      //Submit the transaction
      const submit = await algodClient.sendRawTransaction(signedTxn).do();
      console.log('submit', submit);

      // Wait for confirmation
      let confirmedTxn = await algosdk.waitForConfirmation(
        algodClient,
        txId,
        4
      );
      //Get the completed Transaction
      console.log(
        'Transaction ' +
          txId +
          ' confirmed in round ' +
          confirmedTxn['confirmed-round']
      );
      let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
      console.log('Transaction information: %o', mytxinfo);
      let string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
      alert(`${string}! You've successfully claimed an airdrop of 1 algo`);
      console.log('Note field: ', string);
    } catch (error) {
      console.log(error);
    }
  };

  const optInToAsset = async () => {
    let assetID = 95944269;
    // First update changing transaction parameters
    // We will account for changing transaction parameters
    // before every transaction in this example
    let params = await algodClient.getTransactionParams().do();
    //comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    let note = new Uint8Array(Buffer.from('example note value'));
    // const passphrase = KEYS.passphrase;
    // const myAccount = algosdk.mnemonicToSecretKey(passphrase);
    let sender = account;
    let recipient = sender;
    // We set revocationTarget to undefined as
    // This is not a clawback operation
    let revocationTarget = undefined;
    // CloseRemainderTo is set to undefined as
    // we are not closing out an as
    let closeRemainderTo = undefined;
    // We are sending 0 assets
    let amount = 0;
    // signing and sending "txn" allows sender to begin accepting asset specified by creator and index
    let opttxn = algosdk.makeAssetTransferTxnWithSuggestedParams(
      sender,
      recipient,
      closeRemainderTo,
      revocationTarget,
      amount,
      note,
      assetID,
      params
    );

    const txnsToSign = [
      {
        opttxn,
        message:
          'This transaction opts you into asset token if you have not already opted in.',
      },
    ];

    if (txnsToSign) {
      console.log('It works!');
      console.log(txnsToSign);
    } else {
      console.log('It did not work!');
    }
    return [txnsToSign];
  };

  // A funcxtion that disconnects users
  const disconnect = () => {
    // Make sure the connector exists before trying to kill the session
    if (connector) {
      connector.killSession();
    }
    resetApp();
  };

  const singleAssetOptInTxInteraction = async () => {
    const suggestedParams = await algodClient.getTransactionParams().do();
    const assetIndex = 10458941;

    const txn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: KEYS.sender,
      to: account,
      amount: 0,
      assetIndex,
      note: new Uint8Array(Buffer.from('example note value')),
      suggestedParams,
    });

    const txnsToSign = [
      {
        txn,
        message:
          'This transaction opts you into the USDC asset if you have not already opted in.',
      },
    ];
    if (txnsToSign) {
      console.log('Working: ', txnsToSign);
    } else {
      console.log('OptIn is not working');
    }
    return [txnsToSign];
  };
  return (
    // <>
    <div>
      <Typography variant='h5' component={'h5'}>
        WalletConnect
      </Typography>
      <div style={{ marginTop: '1rem' }}>
        {connector && !loading ? (
          <div>
            <Box component={'div'}>
              <strong>Connected Account: {account}</strong>
              <br />
              <strong>Chain ID: {chainId}</strong>
              <br />
              {/* <strong>Amount: {reach.formatCurrency(amount, 4)}</strong> */}
              <strong>Amount: {algosdk.microalgosToAlgos(amount)}</strong>
            </Box>
            <Box component={'div'} sx={{ mt: 2 }}>
              <Button
                variant='outlined'
                color='error'
                sx={{ textTransform: 'inherit', mr: 3 }}
                onClick={disconnect}
              >
                Disconnect
              </Button>
              {/* <Button
                variant='contained'
                color='primary'
                sx={{ textTransform: 'inherit' }}
                onClick={walletBalance}
              >
                Get Balance
              </Button> */}
              <Button
                variant='contained'
                color='info'
                sx={{ textTransform: 'inherit' }}
                onClick={claimAirdrop}
              >
                Claim airdrop
              </Button>
              <Button
                variant='contained'
                color='info'
                sx={{ textTransform: 'inherit' }}
                onClick={singleAssetOptInTxInteraction}
              >
                Opt In
              </Button>
            </Box>
          </div>
        ) : (
          <Button
            variant='contained'
            color='primary'
            sx={{ textTransform: 'inherit' }}
            onClick={connect}
          >
            Connect Wallet
          </Button>
        )}
      </div>
    </div>
    // </>
  );
};

export default WalletConnectComp;
