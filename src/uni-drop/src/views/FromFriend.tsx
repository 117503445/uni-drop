import "./global.css";

import { useEffect } from "react";
export default function FromFriend(props: {
  addPeer: (peerId: string) => void;
}) {
  useEffect(() => {

    // TODO: this is a hack, we should use a better way to pass peerID
    setTimeout(() => {
      const peerID = window.location.href.split("/").pop();
      console.log("FromFriend peerID", peerID);
      if (peerID) {
        props.addPeer(peerID);
      }
      window.location.hash = `/chat/${peerID}`;
    }, 1000);

  }, []);

  return <div>From friend</div>;
}
