import React, { useState, useEffect } from 'react'
import WalletConnect from "@walletconnect/client";
import QRCodeModal from "algorand-walletconnect-qrcode-modal";
import algosdk from "algosdk";
import { KEYS } from '../../helpers/keys';
import { Box, Button, Typography } from '@mui/material';
import { formatJsonRpcRequest } from "@json-rpc-tools/utils";
// import { Buffer } from 'buffer';


// const reach = loadStdlib("ALGO")

const WalletConnectComp = () => {

  const [connector, setConnector] = useState(null)
  const [loading, setLoading] = useState(false)
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [amount, setAmount] = useState(0)


  const port = '';
  const baseServer = KEYS.purestake_api;
  const token = {
    'X-API-Key': KEYS.token
  }
  const algodClient = new algosdk.Algodv2(token, baseServer, port)
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
    }

    // add logic with side effect
    if (connector) {
      connector.on("connect", async (error, payload) => {
        if (error) {
          console.log(error);
          return;
        }

        const { chainId, accounts } = payload.params[0];
        await onConnect(chainId, accounts[0]);
        setLoading(false)
        console.log(amount)
      });

      //disconnect
      connector.on("disconnect", async (error, payload) => {
        if (error) {
          console.log(error)
        }
        //handle disconnect event
        resetApp();
      })
      // check state variables here & if needed refresh the app
      // If any of these variables do not exist and the connector is connected, refresh the data
      if ((!chainId || !account || !amount) && connector.connected) {
        refreshData();
      }
    }
  }, [connector, chainId, account, amount, algodClient])


  // A function that connects users
  const connect = async () => {
    setLoading(true);
    //Create connector

    // 1. Create connector
    const connector = new WalletConnect({
      bridge: "https://bridge.walletconnect.org",
      qrcodeModal: QRCodeModal
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
    setAccount(null)
    setChainId(null)
    setAmount(0)
  };

  //A function that checks user's wallet balance
  const walletBalance = async () => {
    let params = await algodClient.accountInformation(account).do();
    setAmount(params.amount)
    // console.log(reach.formatCurrency(amount, 4))
    console.log(params)

  }

  //A function that sends transaction
  const sendTransaction = async () => {
    try {

      const suggestedParams = await algodClient.getTransactionParams().do()
      const amountInAlgos = algosdk.algosToMicroalgos(1)
      // Draft transaction
      const unsignedTxn = algosdk.makePaymentTxnWithSuggestedParamsFromObject({
        from: KEYS.sender,
        to: account,
        amount: amountInAlgos,
        suggestedParams,
      })

      console.log(unsignedTxn)


      // Sign transaction
      // txns is an array of algosdk.Transaction like below
      // i.e txns = [txn, ...someotherTxns], but we've only built one transaction in our case
      const txns = [unsignedTxn]
      console.log(txns)
      const txnsToSign = txns.map(txn => {
        const encodedTxn = Buffer.from(algosdk.encodeUnsignedTransaction(txn)).toString("base64");

        return {
          txn: encodedTxn,
          message: 'Description of transaction being signed',
          // Note: if the transaction does not need to be signed (because it's part of an atomic group
          // that will be signed by another party), specify an empty singers array like so:
          // signers: [],
        };
      });
      console.log(txnsToSign[0].txn)
      // console.log(txnsToSign)

      // // Wait for confirmation
      // let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txnsToSign[0].txn, 4);
      // //Get the completed Transaction
      // console.log("Transaction " + txnsToSign[0].txn + " confirmed in round " + confirmedTxn["confirmed-round"]);
      // let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
      // console.log("Transaction information: %o", mytxinfo);
      // let string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
      // console.log("Note field: ", string);

      const requestParams = [txnsToSign[0].txn];
      console.log(requestParams)
      const request = formatJsonRpcRequest("algo_signTxn", requestParams);
      console.log(request)
      const result = await connector.sendCustomRequest(request);
      console.log('result', result)
      const decodedResult = result.map(element => {
        return element ? new Uint8Array(Buffer.from(element, "base64")) : null;
      });
      if (decodedResult) {
        alert('It worked!')
      }

      //Method 2
      //Sign the transaction
      // const passphrase = KEYS.passphrase;
      // const myAccount = algosdk.mnemonicToSecretKey(passphrase)
      // let signedTxn = unsignedTxn.signTxn(myAccount.sk);
      // console.log('SignedTxn', signedTxn)
      // let txId = unsignedTxn.txID().toString();
      // console.log("Signed transaction with txID: %s", txId);
      // console.log(unsignedTxn)
      // //Submit the transaction
      // const submit = await algodClient.sendRawTransaction(signedTxn).do();
      // console.log('submit', submit)

      // // Wait for confirmation
      // let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
      // //Get the completed Transaction
      // console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
      // let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
      // console.log("Transaction information: %o", mytxinfo);
      // let string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
      // console.log("Note field: ", string);

    } catch (error) {
      console.log(error)
    }
  }

  const newTransaction = async () => {
    try {

      //Construct the transaction
      let params = await algodClient.getTransactionParams().do();
      // comment out the next two lines to use suggested fee
      params.fee = 1000;
      params.flatFee = true;
      const receiver = account;
      const enc = new TextEncoder();
      let note = enc.encode("Congratulations!");
      let txn = algosdk.makePaymentTxnWithSuggestedParams(KEYS.sender, receiver, 1000000, undefined, note, params);

      //Sign the transaction
      const passphrase = KEYS.passphrase;
      const myAccount = algosdk.mnemonicToSecretKey(passphrase)
      let signedTxn = txn.signTxn(myAccount.sk);
      console.log('SignedTxn', signedTxn)
      let txId = txn.txID().toString();
      console.log("Signed transaction with txID: %s", txId);
      console.log(txn)

      //Submit the transaction
      const submit = await algodClient.sendRawTransaction(signedTxn).do();
      console.log('submit', submit)

      // Wait for confirmation
      let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
      //Get the completed Transaction
      console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
      let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
      console.log("Transaction information: %o", mytxinfo);
      let string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
      alert(`${string}! You've successfully claimed an airdrop of 1 algo`)
      console.log("Note field: ", string);
    } catch (error) {
      console.log(error)
    }
  }
  // A funcxtion that disconnects users
  const disconnect = () => {
    // Make sure the connector exists before trying to kill the session
    if (connector) {
      connector.killSession();
    }
    resetApp();
  };
  return (
    // <>
    <div>
      <Typography variant='h5' component={'h5'}>WalletConnect</Typography>
      <div style={{ marginTop: '1rem' }}>
        {connector && !loading
          ? <div>
            <Box component={'div'}>
              <strong>Connected Account: {account}</strong><br />
              <strong>Chain ID: {chainId}</strong><br />
              {/* <strong>Amount: {reach.formatCurrency(amount, 4)}</strong> */}
              <strong>Amount: {algosdk.microalgosToAlgos(amount)}</strong>
            </Box>
            <Box component={'div'} sx={{ mt: 2 }}>
              <Button variant='outlined' color='error' sx={{ textTransform: "inherit", mr: 3 }} onClick={disconnect}>Disconnect</Button>
              <Button variant='contained' color='primary' sx={{ textTransform: "inherit" }} onClick={walletBalance}>Get Balance</Button>
              <Button variant='text' color='info' sx={{ textTransform: "inherit" }} onClick={newTransaction}>Claim airdrop Working</Button>
              <Button variant='text' color='info' sx={{ textTransform: "inherit" }} onClick={sendTransaction}>Claim airdrop Testing</Button>
            </Box>
          </div>
          : <Button variant='contained' color='primary' sx={{ textTransform: "inherit" }} onClick={connect}>Connect Wallet</Button>
        }
      </div>
    </div>
    // </>
  )
}

export default WalletConnectComp