import { useState, useEffect } from 'react'
import './Demo.css'
import { DataConnection, Peer } from "peerjs";
import { publicIpv4, publicIpv6 } from 'public-ip';
function Demo() {
  const [peer, setPeer] = useState<Peer | null>(null);
  const [peerID, setpeerID] = useState('');
  const [anotherPeerID, setAnotherPeerID] = useState('');
  const [DiscoveredPeerIDs, setDiscoveredPeerIDs] = useState<string[]>([]);

  const [connection, setConnection] = useState<DataConnection | any>(null);

  const [message, setMessage] = useState('');

  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    const ip_fetcher = async () => {
      // http://localhost:8080
      // const data = await fetch("http://4.ipw.cn").then((res) => res.text());
      // console.log(data);
      // console.log(await publicIpv4());
      // console.log(await publicIpv6());
      //=> 'fe80::200:f8ff:fe21:67cf'

    }
    ip_fetcher();
  });

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

      <button onClick={async () => {

        let ipv4 = "";
        let ipv6 = "";
        // TODO parallel
        try {
          ipv4 = await publicIpv4(
            {
              timeout: 1000,
            }
          );
        } catch (e) {
          console.log(e);
        }

        try {
          ipv6 = await publicIpv6(
            {
              timeout: 1000,
            }
          );
        } catch (e) {
          console.log(e);
        }

        console.log(ipv4, ipv6);

        const host = import.meta.env.VITE_BE_HOST;
        console.log("host", host);
        let res = await fetch(`${host}/api/heartbeat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            "ipv4": ipv4,
            "ipv6": ipv6,
            "peerID": peerID
          })
        });

        let data = await res.json();
        setDiscoveredPeerIDs(data["data"]["peerIDs"]);
      }} className='border-2 border-gray-500 rounded-md block' disabled={peerID == ""}>
        Discover Peers
      </button>

      <p className='border-2 border-gray-500 rounded-md max-w-[500px] min-h-[50px] mb-10'>
        {
          // DiscoveredPeerIDs
          DiscoveredPeerIDs.map((peerID, index) => {
            return (
              <span key={index}>
                {peerID}
                <br />
              </span>
            )
          })
        }
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

      <p className='border-2 border-gray-500 rounded-md max-w-[500px] min-h-[50px] mt-10'>
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

      {/* button to nagivate to App page, always in left bottom */}
      <button onClick={() => {
        window.location.hash = "/"
      }} className='border-2 border-gray-500 rounded-md fixed bottom-5 left-5'>
        App
      </button>
    </>
  )
}

export default Demo
