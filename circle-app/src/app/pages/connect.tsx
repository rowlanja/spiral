"use client";
import React, { useEffect, useRef, useState } from 'react';
import {
  http,
  type Address,
  type Hash,
  type TransactionReceipt,
  createPublicClient,
  createWalletClient,
  custom,
  stringify,
  encodeFunctionData,
} from 'viem';
import { sepolia } from 'viem/chains';

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(),
});

const EURC_CONTRACT_ADDRESS = '0x08210f9170f89ab7658f0b5e3ff39b0e03c594d4';
const EURC_ABI = [
  {
    constant: false,
    inputs: [
      { name: '_to', type: 'address' },
      { name: '_value', type: 'uint256' },
    ],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    type: 'function',
  },
];

function Connect() {
  const [account, setAccount] = useState<Address>();
  const [hash, setHash] = useState<Hash>();
  const [receipt, setReceipt] = useState<TransactionReceipt>();
  const [clientReady, setClientReady] = useState(false);

  const addressInput = useRef<HTMLInputElement>(null);
  const valueInput = useRef<HTMLInputElement>(null);
  const walletClientRef = useRef<ReturnType<typeof createWalletClient> | null>(null);
  useEffect(() => {
    // Only run on client
    if (typeof window !== 'undefined' && window.ethereum) {
      walletClientRef.current = createWalletClient({
        chain: sepolia,
        transport: custom(window.ethereum),
      });
      setClientReady(true);
    }
  }, []);
  const connect = async () => {
    const walletClient = walletClientRef.current;
    if (!walletClient) return;
    const [address] = await walletClient.requestAddresses();
    setAccount(address);
  };

  const sendTransaction = async () => {
    const walletClient = walletClientRef.current;
    if (!account || !walletClient) return;
    const to = addressInput.current!.value as Address;
    const value = valueInput.current!.value as `${number}`;
    const valueInWei = BigInt(value) * BigInt(10 ** 6);

    const data = encodeFunctionData({
      abi: EURC_ABI,
      functionName: 'transfer',
      args: [to, valueInWei],
    });

    const hash = await walletClient.sendTransaction({
      account,
      to: EURC_CONTRACT_ADDRESS,
      data,
    });
    setHash(hash);
  };

  useEffect(() => {
    (async () => {
      if (hash) {
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        setReceipt(receipt);
      }
    })();
  }, [hash]);

  if (!clientReady) {
    return <div>Loading...</div>;
  }

  if (account) {
    return (
      <>
        <div>Connected: {account}</div>
        <input ref={addressInput} placeholder="address" />
        <input ref={valueInput} placeholder="value (EURC)" />
        <button onClick={sendTransaction}>Send</button>
        {receipt && (
          <div>
            Receipt: <pre><code>{stringify(receipt, null, 2)}</code></pre>
          </div>
        )}
      </>
    );
  }
  return <button onClick={connect}>Connect Wallet</button>;
}

export default Connect;