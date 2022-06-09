import React, { useState, useRef } from 'react'
import { loadStdlib } from '@reach-sh/stdlib'
import { KEYS } from '../../helpers/keys';
import { ALGO_WalletConnect } from '@reach-sh/stdlib';
import { Button, Typography } from '@mui/material';

const reach = loadStdlib("ALGO")

reach.setWalletFallback(reach.walletFallback({
    providerEnv: 'TestNet', ALGO_WalletConnect
}));


const AlgoWallet = () => {


    const transferAmount = useRef()
    // const receiverAddress = useRef()
    // const [isLoading, setLoading] = useState(false)
    const account = useRef()
    const balance = useRef()

    const [accBalance, setAccBalance] = useState(0)
    const [accAddress, setAccAddress] = useState('');

    const connectWallet = async () => {
        try {

            await getAccount()
            await getBalance()

        } catch (error) {
            console.log(error)
        }
    }

    const getAccount = async () => {
        try {
            account.current = await reach.getDefaultAccount()
            setAccAddress(account.current.networkAccount.addr)
            console.log(`Address: ${account.current.networkAccount.addr}`)
        } catch (error) {
            console.log(error)
        }
    }
    const getBalance = async () => {
        try {
            let rawBalance = await reach.balanceOf(account.current)
            balance.current = reach.formatCurrency(rawBalance) // reads account balance
            balance.current >= 6 ? alert('Sufficient Balance') : alert('Insufficient Balance')
            setAccBalance(balance.current)
            console.log(`Account Balance: ${balance.current}`)
        } catch (error) {
            console.log(error)
        }
    }

    const transferFund = async () => {
        try {
            // setLoading(true)
            const receiver = await reach.connectAccount({
                addr: KEYS.receiver
            })
            console.log(accAddress)
            console.log(receiver)
            console.log(receiver.networkAccount.addr)

            const user = await reach.transfer(account.current, receiver, reach.parseCurrency(1))
            if (user) {
                alert('It worked!')
            }
            // if (user) {
            //     alert('It worked!')
            // }
            // await getBalance()
            // setLoading(false)
        } catch (error) {
            console.log(error)
            // setLoading(false)
        }
    }
    return (
        <div>
            <Typography variant='h5' component={'h5'}>Reach Example</Typography>
            <Button variant='contained' color='primary' onClick={connectWallet}>Connect Wallet</Button>
            <p>Account Address: {accAddress}</p>
            <p>Account Balance: {accBalance}</p>
            {/* {isLoading ? <p>Loading...</p> : <p>An amount of {transferAmount.current} sent to {receiverAddress.current}</p>} */}
            <Button variant='contained' color='primary' onClick={transferFund}>Transfer Fund</Button>
            <input onChange={e => transferAmount.current = e.target.value} />
        </div>
    )
}

export default AlgoWallet