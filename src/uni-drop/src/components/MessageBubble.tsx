import { Message, MessageType } from "../utils/model";

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
    console.log(`peerID: ${props.peerID}, msg: ${msg}`);
  }

  let inner: JSX.Element;

  switch (msg.content.type) {
    case MessageType.TEXT:
      inner = <p className="msg-bubble-text max-w-[30rem] break-all">{msg.content.data}</p>;
      break;

    case MessageType.FILE:
      inner = (
        <a
          // className="rounded-md bg-yellow-200 "
          className="msg-bubble-file"
          href={msg.content.data}
          download={msg.content.filename}
        >
          {msg.content.filename}
        </a>
      );
      break;
    case MessageType.IMAGE:
      inner = (
        <div className="msg-bubble-img">
          {" "}
          <p className="rounded-md ">{msg.content.filename}</p>
          <img className="rounded-md " src={msg.content.data} />
        </div>
      );
      break;
    default:
      inner = <p>Unknown message type</p>;
      break;
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
