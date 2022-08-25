import React, { useState } from "react";
import algosdk from "algosdk";
import { Button, Typography } from "@mui/material";
import { KEYS } from "../../helpers/keys";
import { info } from "./data";

// My address: ONA6PUGFOSVDJ5ACVQNRP567S45HVBTEVLXTKV76QLRFTVAKHQI4VXRLSE

// My passphrase: reform electric gown ancient silver pepper people toy topic history
//                pelican ribbon frown rally keep animal crouch youth dove whale spell
//                goose acoustic about kangaroo
const First = () => {
  const [accAddress, setAccAddress] = useState("");
  const [accBalance, setAccBalance] = useState(0);
  const [assetId, setAssetId] = useState(null);
  const port = "";
  const baseServer = KEYS.purestake_api;
  const token = {
    "X-API-Key": KEYS.token,
  };
  const algodClient = new algosdk.Algodv2(token, baseServer, port);
  //   let accountInfo = await algodClient.accountInformation(myAccount.addr).do();
  // Function used to print created asset for account and assetid
  const printCreatedAsset = async function (algodclient, account, assetid) {
    // note: if you have an indexer instance available it is easier to just use this
    //     let accountInfo = await indexerClient.searchAccounts()
    //    .assetID(assetIndex).do();
    // and in the loop below use this to extract the asset for a particular account
    // accountInfo['accounts'][idx][account]);
    let accountInfo = await algodclient.accountInformation(account).do();
    for (let idx = 0; idx < accountInfo["created-assets"].length; idx++) {
      let scrutinizedAsset = accountInfo["created-assets"][idx];
      if (scrutinizedAsset["index"] === assetid) {
        console.log("AssetID = " + scrutinizedAsset["index"]);
        let myparms = JSON.stringify(scrutinizedAsset["params"], undefined, 2);
        console.log("parms = " + myparms);
        break;
      }
    }
  };

  // Function used to print asset holding for account and assetid
  const printAssetHolding = async function (algodclient, account, assetid) {
    // note: if you have an indexer instance available it is easier to just use this
    //     let accountInfo = await indexerClient.searchAccounts()
    //    .assetID(assetIndex).do();
    // and in the loop below use this to extract the asset for a particular account
    // accountInfo['accounts'][idx][account]);
    let accountInfo = await algodclient.accountInformation(account).do();
    for (let idx = 0; idx < accountInfo["assets"].length; idx++) {
      let scrutinizedAsset = accountInfo["assets"][idx];
      if (scrutinizedAsset["asset-id"] === assetid) {
        // let myassetholding = JSON.stringify(scrutinizedAsset, undefined, 2);
        // console.log("assetholdinginfo = " + myassetholding);
        console.log(scrutinizedAsset);
        break;
      }
    }
  };

  const createAccount = () => {
    const account = algosdk.generateAccount();
    const passphrase = algosdk.secretKeyToMnemonic(account.sk);
    console.log("My address: " + account.addr);
    console.log("My passphrase: " + passphrase);
  };
  const checkBalance = async () => {
    let passphrase;
    let address = prompt("Please enter account address");
    if (address === info.address1) {
      passphrase = info.passphrase1;
    } else if (address === info.address2) {
      passphrase = info.passphrase2;
    } else {
      alert("address does not exist");
    }
    console.log(passphrase);
    const myAccount = algosdk.mnemonicToSecretKey(passphrase);
    setAccAddress(myAccount.addr);
    console.log("My address: %s", myAccount.addr);
    console.log(myAccount);
    const accountInfo = await algodClient
      .accountInformation(myAccount.addr)
      .do();
    setAccBalance(accountInfo.amount);
    console.log(
      "Account balance: %d Algos",
      algosdk.microalgosToAlgos(accountInfo.amount)
    );
    console.log(accountInfo);
  };

  const createAsset = async () => {
    let params = await algodClient.getTransactionParams().do();
    // comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    let note = undefined; // arbitrary data to be stored in the transaction; here, none is stored
    // Asset creation specific parameters
    // The following parameters are asset specific
    // Throughout the example these will be re-used.
    // We will also change the manager later in the example
    let addr = algosdk.mnemonicToSecretKey(info.passphrase1).addr;
    // Whether user accounts will need to be unfrozen before transacting
    let defaultFrozen = false;
    // integer number of decimals for asset unit calculation
    let decimals = 0;
    // total number of this asset available for circulation
    let totalIssuance = 10000000;
    // Used to display asset units to user
    let unitName = "Altruist";
    // Friendly name of the asset
    let assetName = "ALT";
    // Optional string pointing to a URL relating to the asset
    let assetURL = "";
    // Optional hash commitment of some sort relating to the asset. 32 character length.
    let assetMetadataHash = "";
    // The following parameters are the only ones
    // that can be changed, and they have to be changed
    // by the current manager
    // Specified address can change reserve, freeze, clawback, and manager
    let manager = algosdk.mnemonicToSecretKey(info.passphrase2).addr;
    // Specified address is considered the asset reserve
    // (it has no special privileges, this is only informational)
    let reserve = algosdk.mnemonicToSecretKey(info.passphrase2).addr;
    // Specified address can freeze or unfreeze user asset holdings
    let freeze = algosdk.mnemonicToSecretKey(info.passphrase2).addr;
    // Specified address can revoke user asset holdings and send
    // them to other addresses
    let clawback = algosdk.mnemonicToSecretKey(info.passphrase2).addr;

    // signing and sending "txn" allows "addr" to create an asset
    let txn = algosdk.makeAssetCreateTxnWithSuggestedParams(
      addr,
      note,
      totalIssuance,
      decimals,
      defaultFrozen,
      manager,
      reserve,
      freeze,
      clawback,
      unitName,
      assetName,
      assetURL,
      assetMetadataHash,
      params
    );

    let rawSignedTxn = txn.signTxn(
      algosdk.mnemonicToSecretKey(info.passphrase1).sk
    );
    let tx = await algodClient.sendRawTransaction(rawSignedTxn).do();

    let assetID = null;
    // wait for transaction to be confirmed
    const ptx = await algosdk.waitForConfirmation(algodClient, tx.txId, 4);
    // Get the new asset's information from the creator account
    assetID = ptx["asset-index"];
    setAssetId(assetID);
    console.log(assetID);
    //Get the completed Transaction
    console.log(
      "Transaction " + tx.txId + " confirmed in round " + ptx["confirmed-round"]
    );
    await printCreatedAsset(
      algodClient,
      algosdk.mnemonicToSecretKey(info.passphrase1).addr,
      assetID
    );
    await printAssetHolding(
      algodClient,
      algosdk.mnemonicToSecretKey(info.passphrase1).addr,
      assetID
    );
  };

  const optInToAsset = async () => {
    let assetId = 95944269;
    // First update changing transaction parameters
    // We will account for changing transaction parameters
    // before every transaction in this example
    let params = await algodClient.getTransactionParams().do();
    //comment out the next two lines to use suggested fee
    params.fee = 1000;
    params.flatFee = true;
    let note = undefined;
    let sender = algosdk.mnemonicToSecretKey(info.passphrase3).addr;
    let recipient = sender;
    // We set revocationTarget to undefined as
    // This is not a clawback operation
    let revocationTarget = undefined;
    // CloseReaminerTo is set to undefined as
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
      assetId,
      params
    );

    // Must be signed by the account wishing to opt in to the asset
    let rawSignedTxn = opttxn.signTxn(
      algosdk.mnemonicToSecretKey(info.passphrase3).sk
    );
    let opttx = await algodClient.sendRawTransaction(rawSignedTxn).do();
    console.log("Transaction : " + opttx.txId);
    // Wait for confirmation
    let confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      opttx.txId,
      4
    );
    //Get the completed Transaction
    console.log(
      "Transaction " +
        opttx.txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );

    //You should now see the new asset listed in the account information
    console.log(
      "Account 3 = " + algosdk.mnemonicToSecretKey(info.passphrase3).addr
    );
    await printAssetHolding(
      algodClient,
      algosdk.mnemonicToSecretKey(info.passphrase3).addr,
      assetId
    );
  };

  const destroy = async () => {
    let assetID = prompt("Enter Asset ID");
    // Destroy an Asset:
    // All of the created assets should now be back in the creators
    // Account so we can delete the asset.
    // If this is not the case the asset deletion will fail

    // First update changing transaction parameters
    // We will account for changing transaction parameters
    // before every transaction in this example

    let params = await algodClient.getTransactionParams().do();
    //comment out the next two lines to use suggested fee
    // params.fee = 1000;
    // params.flatFee = true;

    // The address for the from field must be the manager account
    // Which is currently the creator addr1
    let addr = algosdk.mnemonicToSecretKey(info.passphrase1).addr;
    let note = undefined;
    // if all assets are held by the asset creator,
    // the asset creator can sign and issue "txn" to remove the asset from the ledger.
    let dtxn = algosdk.makeAssetDestroyTxnWithSuggestedParams(
      addr,
      note,
      assetID,
      params
    );
    // The transaction must be signed by the manager which
    // is currently set to account1
    let rawSignedTxn = dtxn.signTxn(
      algosdk.mnemonicToSecretKey(info.passphrase1).sk
    );
    let dtx = await algodClient.sendRawTransaction(rawSignedTxn).do();

    // Wait for confirmation
    let confirmedTxn = await algosdk.waitForConfirmation(
      algodClient,
      dtx.txId,
      4
    );
    //Get the completed Transaction
    console.log(
      "Transaction " +
        dtx.txId +
        " confirmed in round " +
        confirmedTxn["confirmed-round"]
    );

    // The account3 and account1 should no longer contain the asset as it has been destroyed
    console.log("Asset ID: " + assetID);
    console.log(
      "Account 1 = " + algosdk.mnemonicToSecretKey(info.passphrase1).addr
    );
    await printCreatedAsset(
      algodClient,
      algosdk.mnemonicToSecretKey(info.passphrase1).addr,
      assetID
    );
    await printAssetHolding(
      algodClient,
      algosdk.mnemonicToSecretKey(info.passphrase1).addr,
      assetID
    );
    console.log(
      "Account 3 = " + algosdk.mnemonicToSecretKey(info.passphrase3).addr
    );
    await printAssetHolding(
      algodClient,
      algosdk.mnemonicToSecretKey(info.passphrase3).addr,
      assetID
    );
  };

  const test = () => {
    let user = algosdk.mnemonicToSecretKey(info.passphrase1);
    console.log(user);
  };
  return (
    <div>
      <Typography variant="h5">Create Account</Typography>
      <Typography>Account Address: {accAddress}</Typography>
      <Typography>
        Account Balance: {algosdk.microalgosToAlgos(accBalance)}
      </Typography>
      <Typography>Asset ID: {assetId}</Typography>
      <Button variant="contained" color="primary" onClick={createAccount}>
        Create Account
      </Button>
      <Button variant="contained" color="primary" onClick={checkBalance}>
        Check Balance
      </Button>
      <Button variant="contained" color="primary" onClick={createAsset}>
        Create Asset
      </Button>
      <Button variant="contained" color="primary" onClick={optInToAsset}>
        Opt In
      </Button>
      <Button variant="contained" color="primary" onClick={destroy}>
        Destroy
      </Button>
      <Button variant="contained" color="secondary" onClick={test}>
        Test
      </Button>
    </div>
  );
};

export default First;
