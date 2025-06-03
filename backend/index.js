const http = require("http");
const fetch = require('node-fetch');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
const TEST_API_KEY = process.env.TEST_API_KEY;

app.post('/api/circle', async (req, res) => {
  console.log('Received request:', req.body);
  const { userId } = req.body;
  const url = 'https://api.circle.com/v1/w3s/users';
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer TEST_API_KEY:${TEST_API_KEY}`
    },
    body: JSON.stringify({ userId })
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch from Circle API' });
  }
});

app.post('/api/circle/token', async (req, res) => {
  console.log('Received token request:', req.body);
  const { userId } = req.body;
  const url = 'https://api.circle.com/v1/w3s/users/token';
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer TEST_API_KEY:${TEST_API_KEY}`
    },
    body: JSON.stringify({ userId })
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch token from Circle API' });
  }
});

app.post('/api/circle/initialize', async (req, res) => {
  console.log('Received initialize request:', req.body);
  const { idempotencyKey, blockchains, userToken } = req.body;
  const url = 'https://api.circle.com/v1/w3s/user/initialize';
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer TEST_API_KEY:${TEST_API_KEY}`,
      'X-User-Token': userToken
    },
    body: JSON.stringify({ idempotencyKey, blockchains })
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to initialize user in Circle API' });
  }
});

app.post('/api/circle/contract-execution', async (req, res) => {
  // Expects all required fields in the request body
  const {
    abiFunctionSignature,
    abiParameters,
    idempotencyKey,
    contractAddress,
    feeLevel,
    walletId,
    entitySecretCiphertext
  } = req.body;

  const url = 'https://api.circle.com/v1/w3s/developer/transactions/contractExecution';
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer TEST_API_KEY:${TEST_API_KEY}`
    },
    body: JSON.stringify({
      abiFunctionSignature,
      abiParameters,
      idempotencyKey,
      contractAddress,
      feeLevel,
      walletId,
      entitySecretCiphertext
    })
  };

  try {
    const response = await fetch(url, options);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to execute contract via Circle API' });
  }
});

const PORT = 3030;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});