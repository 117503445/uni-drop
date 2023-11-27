import "./global.css";
import { useState } from "react";
import RightTopBar from "../components/RightTopBar";

export default function AddFriend(props: {
  addPeer: (peerId: string) => void;
}) {
  const [idContent, setIdContent] = useState("");
  const [pinContent, setPinContent] = useState("");

  return (
    <div>
      <RightTopBar>
        <span className="m-auto text-xl">Add Friend</span>
      </RightTopBar>

      <div className="p-[1rem]">
        <div className=" my-[2rem] text-lg">
          There are many ways you can connect to other devices...
        </div>

        <hr className="m-[auto] w-11/12"></hr>

        <div className="mb-[0.5rem] mt-[1rem] text-lg">1. Pin</div>
        <input
          className="mb-[1rem] w-[16rem] rounded-md border-2 border-gray-300 p-[0.5rem]"
          placeholder="Press Enter to submit Pin"
          value={pinContent}
          onChange={(e) => setPinContent(e.target.value)}
          onKeyUp={async (e) => {
            if (e.key == "Enter") {
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
                alert("peerID not found");
                return;
              }
              console.log("peerID found", peerID);
              props.addPeer(data.data.peerID);
            }
          }}
        ></input>

        <hr className="m-[auto] w-11/12"></hr>
        <div className="mb-[0.5rem] mt-[1rem] text-lg">2. Peer ID</div>
        <input
          className="mb-[1rem] w-[16rem] rounded-md border-2 border-gray-300 p-[0.5rem]"
          placeholder="Press Enter to submit PeerID"
          value={idContent}
          onChange={(e) => setIdContent(e.target.value)}
          onKeyUp={async (e) => {
            if (e.key == "Enter") {
              props.addPeer(idContent);
            }
          }}
        ></input>
      </div>
    </div>
  );
}
