import "./global.css";
import { useState } from "react";

export default function AddFriend(props: {
  addPeer: (peerId: string) => void;
}) {
  const [idContent, setIdContent] = useState("");
  const [pinContent, setPinContent] = useState("");

  return (
    <div>
      <textarea
        placeholder="Add friend by peer id"
        className="flex-1"
        value={idContent}
        onChange={(e) => setIdContent(e.target.value)}
      />
      <button
        className="flex-1 bg-blue-50"
        onClick={() => {
          props.addPeer(idContent);
        }}
      >
        AddFriend
      </button>

      <br />

      <textarea
        placeholder="Add friend by pin"
        className="flex-1"
        value={pinContent}
        onChange={(e) => setPinContent(e.target.value)}
      />
      <button
        className="flex-1 bg-blue-50"
        onClick={async () => {
          // pinContent should be a string of 4 digits
          if (!/^\d{4}$/.test(pinContent)) {
            alert("pin should be a string of 4 digits");
            return;
          }

          const host = import.meta.env.VITE_BE_HOST;
          const res = await fetch(`${host}/api/pin/${pinContent}`, {
            headers: {
              "Content-Type": "application/json",
            },
          });
          const data = await res.json();
          const peerID = data.data.peerID;
          if (peerID == null) {
            alert("pin not found");
            return;
          }
          console.log("pin found", peerID);
          props.addPeer(data.data.peerID);
        }}
      >
        AddFriend
      </button>
    </div>
  );
}
