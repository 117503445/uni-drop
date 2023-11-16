import { Message, MessageType } from "./model";

function MessageBubble(props: { message: Message }) {
  const msg = props.message;

  switch (msg.content.type) {
    case MessageType.TEXT:
      return (
        <p className="rounded-md bg-white px-3 py-2 shadow-md">
          {msg.content.data}
        </p>
      );
    case MessageType.FILE:
      return (
        <div className="flex flex-col">
          {/* <p className="rounded-md bg-white px-3 py-2 shadow-md">
            {msg.content.filename}
          </p> */}
          <a
            className="rounded-md bg-yellow-200 px-3 py-2 shadow-md"
            href={msg.content.data}
            download={msg.content.filename}
          >
            {msg.content.filename}
          </a>
        </div>
      );
    case MessageType.IMAGE:
      return (
        <div className="flex flex-col">
          <p className="rounded-md bg-white px-3 py-2 shadow-md">
            {msg.content.filename}
          </p>
          <img
            className="rounded-md bg-white px-3 py-2 shadow-md"
            src={msg.content.data}
          />
        </div>
      );
    default:
      // error
      return <p>Unknown message type</p>;
  }
}

export default MessageBubble;
