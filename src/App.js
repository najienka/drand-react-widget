import React, { useState, useEffect, useRef } from 'react';
import { watch, FastestNodeClient } from 'drand-client';

// BigInt issues and solutions: https://github.com/eslint/eslint/issues/11524
/* global BigInt */

function App() {
  const [latestRandomness, setLatestRandomness] = useState(null);
  const [eta, setETA] = useState(null);
  const [round, setRound] = useState(null);
  const [network, setNetwork] = useState('default'); // default to 'default' network
  const clientRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    const fetchLatestRandomness = async () => {
      try {
        let chainHash, publicKey;
        let updateInterval = 30 * 1000; // default update interval in milliseconds

        // Determine chainHash, publicKey, and updateInterval based on selected network
        if (network === 'default') {
          chainHash = '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce'; // mainnet default
          publicKey = '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31';
        } else if (network === 'quicknet') {
          chainHash = '52db9ba70e0cc0f6eaf7803dd07447a1f5477735fd3f661792ba94600c84e971'; // mainnet quicknet
          publicKey = '83cf0f2896adee7eb8b5f01fcad3912212c437e0073e911fb90022d3e760183c8c4b450b6a0a6c3ac6a5776a2d1064510d1fec758c921cc22b0e17e63aaf4bcb5ed66304de9cf809bd274ca73bab4af5a6e9c76a4bc09e76eae8991ef5ece45a';
          updateInterval = 3 * 1000; // quicknet update interval in milliseconds (3 seconds)
        }

        const options = {
          disableBeaconVerification: false,
          noCache: false,
          chainVerificationParams: { chainHash, publicKey }
        };

        let urls = [
          'https://api.drand.sh',
          'https://api2.drand.sh',
          'https://api3.drand.sh',
          'https://drand.cloudflare.com'
        ];

        // Append chainHash to each URL if quicknet is selected
        if (network === 'quicknet') {
          urls = urls.map(url => `${url}/${chainHash}`);
        }

        const headers = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Credentials': 'true' };
        const client = new FastestNodeClient(urls, options, { headers });

        // Stop the previous client if it exists
        if (clientRef.current) {
          clientRef.current.stop();
        }
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        clientRef.current = client;
        client.start();

        const abortController = new AbortController();
        abortControllerRef.current = abortController;

        for await (const beacon of watch(client, abortController)) {
          const currentTime = new Date().getTime();
          const nextETA = new Date(currentTime + updateInterval);
          setETA(nextETA.toLocaleTimeString());
          setRound(beacon.round);
          setLatestRandomness(BigInt(`0x${beacon.randomness}`).toString());
        }
      } catch (error) {
        console.error('Error fetching randomness:', error);
      }
    };

    fetchLatestRandomness();

    return () => {
      // Clean up the client and abort controller when the component unmounts or network changes
      if (clientRef.current) {
        clientRef.current.stop();
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [network]);

  const handleNetworkChange = (event) => {
    setNetwork(event.target.value);
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Latest Randomness from drand Beacon</h1>

        <div>
          Select Beacon Chain:
          <select value={network} onChange={handleNetworkChange} style={{ marginLeft: '10px' }}>
            <option value="default">Default</option>
            <option value="quicknet">Quicknet</option>
          </select>
        </div>

        <br />

        Next Randomness ETA: {eta ? (
          <p>{eta}</p>
        ) : (
          <p>Loading...</p>
        )}

        Latest Round: {round ? (
          <p>{round}</p>
        ) : (
          <p>Loading...</p>
        )}

        Latest Randomness: {latestRandomness ? (
          <p>{latestRandomness}</p>
        ) : (
          <p>Loading...</p>
        )}
      </header>
    </div>
  );
}

export default App;
