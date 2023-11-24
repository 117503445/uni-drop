import "./global.css";
import { useState, useEffect, useRef } from "react";

export default function Me(props: { peerID: string }) {
  const [pin, setPin] = useState("");
  const timer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const call = async () => {
      if (props.peerID.length == 0) {
        console.warn("peerID is empty");
        return;
      }
      const host = import.meta.env.VITE_BE_HOST;
      const res = await fetch(`${host}/api/pin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ peerID: props.peerID }),
      });
      const data = await res.json();
      setPin(data.data.pinCode);
    };
    call();

    timer.current = setInterval(async () => {
      await call();
    }, 10 * 1000);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [props.peerID]);

  return (
    <div>
      <span>peerid: {props.peerID}</span>
      <br />
      <span>pin: {pin}</span>
    </div>
  );
}
