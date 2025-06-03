'use client'

import { useWeb3React } from '@web3-react/core'
import { InjectedConnector } from '@web3-react/injected-connector'
import { useCallback } from 'react'

const injected = new InjectedConnector({
  supportedChainIds: [1, 5, 11155111], // Mainnet, Goerli, Sepolia
})

export default function ConnectWallet() {
  const { activate, deactivate, active, account } = useWeb3React()

  const handleConnect = useCallback(async () => {
    try {
      await activate(injected)
    } catch (err) {
      console.error('Wallet connection error:', err)
    }
  }, [activate])

  const handleDisconnect = useCallback(() => {
    deactivate()
  }, [deactivate])

  return (
    <div>
      {active ? (
        <div>
          <div>Connected: {account}</div>
          <button onClick={handleDisconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  )
}