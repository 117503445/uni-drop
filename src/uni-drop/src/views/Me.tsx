import "./global.css";
import { useState } from "react";

export default function Me(props: { peerID: string }) {
  return (
    <div>
      <span>peerid: ${props.peerID}</span>
    </div>
  );
}
