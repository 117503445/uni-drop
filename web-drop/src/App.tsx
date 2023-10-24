import { useState, useEffect } from 'react'
import './App.css'

import { Peer } from "peerjs";

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerID, setpeerID] = useState('');
  const [anotherPeerID, setAnotherPeerID] = useState('');

  // let peer: Peer;
  useEffect(() => {
    const peerInstance = new Peer();
    peerInstance.on("connection", (conn) => {
      conn.on("data", (data) => {
        // Will print 'hi!'
        console.log(data);
      });
      conn.on("open", () => {
        conn.send("hello!");
      });
    });;
    
    setPeer(peerInstance);

    return () => { };
  }, []);


  return (
    <>
      <h1 className="text-3xl font-bold">
        Hello world!
      </h1>
      <input
        value={peerID}
        onChange={e => setpeerID(e.target.value)}
        className='border-2 border-gray-500 rounded-md'
      />

      <button onClick={() => {
        console.log("init")

      }} className='border-2 border-gray-500 rounded-md'>
        Init
      </button>

      <input
        value={anotherPeerID}
        onChange={e => setAnotherPeerID(e.target.value)}
        className='border-2 border-gray-500 rounded-md'
      />

      <button onClick={() => {
        console.log("Connect", peer)
        if (peer != null) {
          const conn = peer.connect(anotherPeerID);
          conn.on("open", () => {
            conn.send("hi!");
          });
        }
      }} className='border-2 border-gray-500 rounded-md'>
        Connect
      </button>
    </>
  )
}

export default App
