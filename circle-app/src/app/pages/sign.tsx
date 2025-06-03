'use client'

import { W3SSdk } from '@circle-fin/w3s-pw-web-sdk'
import useTokenApproval from '../../../src/app/pages/hooks/useTokenApproval'

function generateUUID() {
  // Simple UUID v4 generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export const CircleButton = () => {
  const USDC_ADDRESS = "0x1c7d4b196cb0c7b01d743fbc6116a902379c7238";
  // Move the hook to the top level
  const { approve } = useTokenApproval(USDC_ADDRESS, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

  const handleClick = async () => {
    console.log('Button clicked, calling endpoints...');
    const userId = generateUUID();
    try {
      // CREATE A USER IN THE CIRCLE
      const response = await fetch('http://localhost:3030/api/circle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }
      const userData = await response.json();
      console.log('Response from /api/circle:', userData);

      // CREATE A SESSION TOKEN
      const tokenResponse = await fetch('http://localhost:3030/api/circle/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        throw new Error(`Token server error: ${tokenResponse.status} - ${errorText}`);
      }
      const tokenData = await tokenResponse.json();
      console.log('Response from /api/circle/token:', tokenData);

      // Get userToken from the nested data object
      const userToken = tokenData?.data?.userToken;
      console.log('userToken:', userToken);

      // INITIALIZE USER
      const idempotencyKey = generateUUID();
      const blockchains = ['ETH-SEPOLIA']; // Example blockchain, adjust as needed

      const initializeResponse = await fetch('http://localhost:3030/api/circle/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ idempotencyKey, blockchains, userToken }),
      });
      if (!initializeResponse.ok) {
        const errorText = await initializeResponse.text();
        throw new Error(`Initialize server error: ${initializeResponse.status} - ${errorText}`);
      }
      const initializeData = await initializeResponse.json();
      console.log('Response from /api/circle/initialize:', initializeData);

      // PERFORMING 2FA
      console.log('checking 2fa:');
      const challengeId = initializeData?.data?.challengeId;
      const encryptionKey = tokenData?.data?.encryptionKey;
      console.log('running 2fa:');
      if (!challengeId || !userToken || !encryptionKey) {
        console.error('Missing challengeId, userToken, or encryptionKey for 2FA.');
        return;
      }

      console.log('starting challengeId:', challengeId);
      const appId = process.env.NEXT_PUBLIC_CIRCLE_APP_ID!;

      // Approve tokens
      const amountToApprove = 10000000000000000; // Example amount in wei (1 ETH)
      try {
        const response = await approve(amountToApprove);
        if (!response) return;
        const { hash } = response.response;
        console.log('Transaction hash:', hash);
        console.log(response);
      } catch (err) {
        console.error(err);
      }

      // 2FA SDK
      const sdk = new W3SSdk({
        appSettings: {
          appId
        },
      });

      sdk.setAuthentication({
        userToken,
        encryptionKey,
      });

      // Await challenge and get signature
      let signature: string | undefined;
      await new Promise<void>((resolve, reject) => {
        sdk.execute(challengeId, (error, result) => {
          console.log('Challenge execution result:');
          if (error) {
            console.log(
              `${error?.code?.toString() || 'Unknown code'}: ${error?.message ?? 'Error!'}`
            );
            reject(error);
            return;
          }

          console.log(`Challenge: ${result.type}`);
          console.log(`status: ${result.status}`);

          if (result.data && result.data.signature) {
            console.log(`signature: ${result.data.signature}`);
            signature = result.data.signature;
          }
          resolve();
        });
      });
    } catch (error) {
      console.error('Error calling endpoints:', error);
    }
  };

  return (
    <button onClick={handleClick}>
      Call
    </button>
  );
};
