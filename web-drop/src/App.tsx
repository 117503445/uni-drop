import { useState, useEffect } from 'react'

import { DataConnection, Peer } from "peerjs";

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerID, setpeerID] = useState('');
  const [anotherPeerID, setAnotherPeerID] = useState('');

  const [connection, setConnection] = useState<DataConnection | any>(null);

  // let peer: Peer;
  useEffect(() => {
    console.log("useEffect");
    const peerInstance = new Peer();
    peerInstance.on("connection", (conn) => {
      conn.on("data", (data) => {
        // Will print 'hi!'
        console.log(data);
      });
      conn.on("open", () => {
        // conn.send("hello!");
        setConnection(conn);
      });
    });;
    peerInstance.on("open", (id) => {
      setpeerID(id);
    });

    setPeer(peerInstance);
    return () => { peerInstance.destroy(); };
  }, []);


  return (
    <>
      {/* <h1 className="text-3xl font-bold">
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
      </button> */}

      <p>
        peer ID {peerID}
      </p>

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
            setConnection(conn);
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
