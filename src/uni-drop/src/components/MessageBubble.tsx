import { JSX } from "react";
import {
  Message,
  TextMessageContent,
  FileMessageContent,
} from "../utils/model";
import download from "js-file-download";

function MessageBubble(props: { peerID: string; message: Message }) {
  const msg = props.message;
  let color: string;
  if (msg.from == props.peerID) {
    color = "bg-[#e7f8ff]";
  } else if (msg.to == props.peerID) {
    color = "bg-[#f2f2f2]";
  } else {
    color = "bg-[#f2f2f2]";
    console.error("peerID != msg.from && peerID != msg.to");
    console.log(`peerID: ${props.peerID}, msg: ${msg.toString()}`);
  }

  let inner: JSX.Element;
  const content = msg.content;

  if (content instanceof TextMessageContent) {
    inner = (
      <p className="msg-bubble-text max-w-[30rem] break-all">{content.text}</p>
    );
  } else if (content instanceof FileMessageContent) {
    if (content.isPriview) {
      // const blob = new Blob([content.file], { type: "image/png" });
      inner = (
        <div className="msg-bubble-image">
          {" "}
          <p className="rounded-md ">{content.filename}</p>
          <img
            className="rounded-md "
            src={URL.createObjectURL(content.file)}
          />
        </div>
      );
    } else {
      inner = (
        <button
          className="msg-bubble-file"
          onClick={() => {
            if (!(content instanceof FileMessageContent)) {
              throw new Error("content is not FileMessageContent");
            }
            download(content.file, content.filename);
          }}
        >
          Download {content.filename}
        </button>
      );
    }
  } else {
    inner = <p>Unknown message type</p>;
  }

  return (
    <div
      className={`flex flex-col rounded-lg border-2 border-[#dedede] p-2 ${color} `}
    >
      {inner}
    </div>
  );
}

export default MessageBubble;
