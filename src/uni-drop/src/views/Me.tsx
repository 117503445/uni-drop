import "./global.css";
import { useState, useEffect, useRef, useMemo } from "react";
import QRCode from "qrcode";
import RightTopBar from "../components/RightTopBar";
import CopyButton from "../components/CopyButton";
export default function Me(props: { peerID: string }) {
  const [pin, setPin] = useState("");
  const timer = useRef<NodeJS.Timeout | null>(null);

  const url = useMemo(() => {
    const u = new URL(window.location.href);
    u.hash = `/from-friend/${props.peerID}`;
    return u;
  }, [props.peerID]);

  const [qrcode, setQrcode] = useState("");
  useEffect(() => {
    if (!props.peerID) {
      return;
    }

    QRCode.toDataURL(url.toString())
      .then((dataURL) => {
        setQrcode(dataURL);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [url, props.peerID]);

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
      const response = (await res.json()) as { data: { pinCode: string } };
      setPin(response.data.pinCode);
    };
    call().catch((err) => {
      console.error(err);
    });

    timer.current = setInterval(() => {
      call().catch((err) => {
        console.error(err);
      });
    }, 10 * 1000);
    return () => {
      if (timer.current) {
        clearInterval(timer.current);
      }
    };
  }, [props.peerID]);

  return (
    <div
      id="me-meta"
      data-test-meta={JSON.stringify({
        peerID: props.peerID,
        pin,
        url,
      })}
    >
      <RightTopBar>
        <span className="m-auto text-xl">My Information</span>
      </RightTopBar>

      <div className="p-[1rem]">
        <div className=" my-[2rem] text-lg">
          There are many ways you can be connected to another device...
        </div>

        <hr className="m-[auto] w-11/12"></hr>

        <div className="mb-[1rem]">
          <div className="mb-[0.5rem] mt-[1rem] text-lg">1. Pin</div>
          <span>pin: {pin} </span>
          <CopyButton text={pin}></CopyButton>
        </div>

        <div className="mb-[1rem]">
          <hr className="m-[auto] w-11/12"></hr>
          <div className="mb-[0.5rem] mt-[1rem] text-lg">2. PeerID</div>
          <span>peerid: {props.peerID} </span>
          <CopyButton text={props.peerID}></CopyButton>
        </div>

        <div>
          <hr className="m-[auto] w-11/12"></hr>
          <div className="mt-[1rem] text-lg">3. QRCode</div>
          <img className="mb-[0.5rem]" src={qrcode} />
        </div>

        <hr className="m-[auto] w-11/12"></hr>
        <div className="mb-[0.5rem] mt-[1rem] text-lg">4. URL Link</div>
        <span>{url.toString()} </span>
        <CopyButton text={url.toString()}></CopyButton>
      </div>
    </div>
  );
}
