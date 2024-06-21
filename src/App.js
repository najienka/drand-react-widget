import React, { useState, useLayoutEffect } from 'react';
import { 
  // fetchBeacon, 
  // fetchBeaconByTime, 
  // HttpChainClient, 
  watch, 
  // HttpCachingChain, 
  FastestNodeClient, 
  // MultiBeaconNode 
} from 'drand-client'

// BigInt isues and solutions: https://github.com/eslint/eslint/issues/11524
/* global BigInt */

function App() {
  const [latestRandomness, setLatestRandomness] = useState(null);
  const [eta, setETA] = useState(null)
  const [round, setRound] = useState(null)

  useLayoutEffect(() => {
    const fetchLatestRandomness = async () => {
      
      try {
        const chainHash = '8990e7a9aaed2ffed73dbd7092123d6f289930540d7651336225dc172e51b2ce' // (hex encoded)
        const publicKey = '868f005eb8e6e4ca0a47c8a77ceaa5309a47978a7c71bc5cce96366b5d7a569937c529eeda66c7293784a9402801af31' // (hex encoded)

        const options = {
          disableBeaconVerification: false, // `true` disables checking of signatures on beacons - faster but insecure!!!
          noCache: false, // `true` disables caching when retrieving beacons for some providers
          chainVerificationParams: { chainHash, publicKey }  // these are optional, but recommended! They are compared for parity against the `/info` output of a given node
        }

        
        // fetching randomness from multiple APIs and automatically use the fastest
        const urls = [
          'https://api.drand.sh',
          'https://api2.drand.sh',
          'https://api3.drand.sh',
          'https://drand.cloudflare.com'
        ]
        const client = new FastestNodeClient(urls, options)

        // start the client, so that it periodically optimises for the fastest node!
        client.start()

        // const info = await client.info()

        // todo: we could automate fetching of eta
        // const nextRoundETA = () => {
        //   const now = Date.now()
        //   const round = // current beacon round
        //   const time = info.genesis_time * 1000 + round * info.period * 1000
        //   return Math.round((time - now) / 1000)
        // }

        // client.stop()

        const abortController = new AbortController()
        for await (const beacon of watch(client, abortController)) {
            const updateInterval = 30 * 1000; // 30 seconds in milliseconds
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
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Latest Randomness from dRAND Beacon</h1>
        
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
