import "./Demo.css";
import { useState, useEffect, useRef } from "react";

import { UniPeersManager } from "./peer.js";
import { Message } from "./model.js";

function DemoPeer() {
  const [peerID, setpeerID] = useState("");

  const [peersID, setpeersID] = useState<string[]>([]);

  // const [postContent, setPostContent] = useState("");

  const managerRef = useRef<UniPeersManager | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const manager = new UniPeersManager(setpeerID, setpeersID, setMessages);
    managerRef.current = manager;
    return function cleanup() {
      if (manager != null) {
        manager.close();
      }
    };
  }, []);

  return (
    <>
      <p>peer ID {peerID}</p>

      <button
        onClick={async () => {
          if (managerRef.current != null) {
            await managerRef.current.heartbeat();
          }
        }}
        className="block rounded-md border-2 border-gray-500"
        // disabled={peerID == ""}
        disabled={false}
      >
        Discover Peers
      </button>

      <p className="mb-10 min-h-[50px] max-w-[500px] rounded-md border-2 border-gray-500">
        {peersID.map((peerID, index) => {
          return (
            <span key={index}>
              {peerID}
              <br />
            </span>
          );
        })}
      </p>

      {/* <input
        value={anotherPeerID}
        onChange={(e) => setAnotherPeerID(e.target.value)}
        className="rounded-md border-2 border-gray-500"
      /> */}

      <button
        onClick={() => {}}
        className="rounded-md border-2 border-gray-500"
      >
        Connect
      </button>
      <br />

      {/* <p>connect status: {connection?.open ? "open" : "close"}</p> */}

      {/* <input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="rounded-md border-2 border-gray-500"
      ></input> */}

      {/* <button
        onClick={() => {
          if (connection != null) {
            connection.send(message);
            setMessages((m) => [...m, `> ${message}`]);
            setMessage("");
          }
        }}
        className="rounded-md border-2 border-gray-500"
        disabled={connection == null}
      >
        Send
      </button> */}

      <p className="mt-10 min-h-[50px] max-w-[500px] rounded-md border-2 border-gray-500">
        {
          // messages
          messages.map((message, index) => {
            return (
              <span key={index}>
                {message.content.data}
                <br />
              </span>
            );
          })
        }
      </p>

      {/* button to nagivate to App page, always in left bottom */}
      <button
        onClick={() => {
          window.location.hash = "/";
        }}
        className="fixed bottom-5 left-5 rounded-md border-2 border-gray-500"
      >
        App
      </button>
    </>
  );
}

export default DemoPeer;
