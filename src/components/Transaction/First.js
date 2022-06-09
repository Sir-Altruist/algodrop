import React, { useState } from 'react'
import algosdk from 'algosdk'
import { Button, Typography } from '@mui/material';
import { KEYS } from '../../helpers/keys';
import { info } from './data';

// My address: ONA6PUGFOSVDJ5ACVQNRP567S45HVBTEVLXTKV76QLRFTVAKHQI4VXRLSE

// My passphrase: reform electric gown ancient silver pepper people toy topic history 
//                pelican ribbon frown rally keep animal crouch youth dove whale spell 
//                goose acoustic about kangaroo
const First = () => {

    const [accAddress, setAccAddress] = useState('')
    const [accBalance, setAccBalance] = useState(0)
    const port = '';
    const baseServer = KEYS.purestake_api;
    const token = {
        'X-API-Key': KEYS.token
    }
    const algodClient = new algosdk.Algodv2(token, baseServer, port)
    //   let accountInfo = await algodClient.accountInformation(myAccount.addr).do();
    const createAccount = () => {
        const account = algosdk.generateAccount();
        const passphrase = algosdk.secretKeyToMnemonic(account.sk);
        console.log("My address: " + account.addr);
        console.log("My passphrase: " + passphrase);
    }
    const checkBalance = async () => {
        const passphrase = info.passphrase;
        console.log(passphrase)
        const myAccount = algosdk.mnemonicToSecretKey(passphrase)
        setAccAddress(myAccount.addr)
        console.log("My address: %s", myAccount.addr)
        const accountInfo = await algodClient.accountInformation(myAccount.addr).do();
        setAccBalance(accountInfo.amount)
        console.log("Account balance: %d microAlgos", accountInfo.amount);
    }

    const sendTransaction = async () => {

        //Construct the transaction
        let params = await algodClient.getTransactionParams().do();
        // comment out the next two lines to use suggested fee
        params.fee = 1000;
        params.flatFee = true;
        const receiver = "BMUOANUT3NALW5TMETYXVYLCOP6X3RQ7ADFFEKUWW5CVG5CUWA77RIQZAE";
        const enc = new TextEncoder();
        let note = enc.encode("Hello World");
        let txn = algosdk.makePaymentTxnWithSuggestedParams(accAddress, receiver, 1000000, undefined, note, params);

        //Sign the transaction
        const passphrase = info.passphrase;
        const myAccount = algosdk.mnemonicToSecretKey(passphrase)
        console.log(myAccount)
        let signedTxn = txn.signTxn(myAccount.sk);
        console.log(signedTxn)
        let txId = txn.txID().toString();
        console.log("Signed transaction with txID: %s", txId);
        console.log(txn)

        //Submit the transaction
        const submit = await algodClient.sendRawTransaction(signedTxn).do();
        console.log(submit)

        // Wait for confirmation
        let confirmedTxn = await algosdk.waitForConfirmation(algodClient, txId, 4);
        //Get the completed Transaction
        console.log("Transaction " + txId + " confirmed in round " + confirmedTxn["confirmed-round"]);
        let mytxinfo = JSON.stringify(confirmedTxn.txn.txn, undefined, 2);
        console.log("Transaction information: %o", mytxinfo);
        let string = new TextDecoder().decode(confirmedTxn.txn.txn.note);
        console.log("Note field: ", string);
    }
    return (
        <div>
            <Typography variant='h5'>Create Account</Typography>
            <Typography>Account Address: {accAddress}</Typography>
            <Typography>Account Balance: {algosdk.microalgosToAlgos(accBalance)}</Typography>
            <Button variant='contained' color='primary' onClick={createAccount}>Create Account</Button>
            <Button variant='contained' color='primary' onClick={checkBalance}>Check Balance</Button>
            <Button variant='contained' color='primary' onClick={sendTransaction}>Send Transaction</Button>
        </div>
    )
}

export default First