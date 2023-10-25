import { useState, useEffect } from 'react'

import { DataConnection, Peer } from "peerjs";

function App() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerID, setpeerID] = useState('');
  const [anotherPeerID, setAnotherPeerID] = useState('');

  const [connection, setConnection] = useState<DataConnection | any>(null);

  const [message, setMessage] = useState('');

  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    console.log("useEffect");
    const peerInstance = new Peer();
    peerInstance.on("connection", (conn) => {
      conn.on("open", () => {
        console.log("conn open with", conn.peer)
        setConnection(conn);
      });
      conn.on("data", (data) => {
        if (typeof data === 'string') {
          setMessages((m) => [...m, data])
        } else {
          alert("data is not string")
        }
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
      <p>
        peer ID {peerID}
      </p>

      <input
        value={anotherPeerID}
        onChange={e => setAnotherPeerID(e.target.value)}
        className='border-2 border-gray-500 rounded-md'
      />

      <button onClick={() => {
        if (peer != null) {
          const conn = peer.connect(anotherPeerID);
          conn.on("open", () => {
            console.log("conn open with", conn.peer)
            setConnection(conn);
          });
          conn.on("data", (data) => {
            if (typeof data === 'string') {
              setMessages((m) => [...m, data])
            } else {
              alert("data is not string")
            }
          });
        }
      }} className='border-2 border-gray-500 rounded-md'>
        Connect
      </button>
      <br />

      <p>
        connect status: {connection?.open ? "open" : "close"}
      </p>

      <input value={message} onChange={e => setMessage(e.target.value)} className='border-2 border-gray-500 rounded-md'></input>

      <button onClick={() => {
        if (connection != null) {
          connection.send(message);
          setMessages((m) => [...m, `> ${message}`])
          setMessage('');
        }
      }} className='border-2 border-gray-500 rounded-md' disabled={connection == null}>
        Send
      </button>

      <p>
        {
          // messages
          messages.map((message, index) => {
            return (
              <span key={index}>
                {message}
                <br />
              </span>
            )
          })
        }
      </p>
    </>
  )
}

export default App
