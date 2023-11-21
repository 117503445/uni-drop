import "./global.css";

import fileIcon from "./assets/file.svg";
import imageIcon from "./assets/image.svg";
import returnIcon from "./assets/return.svg";
import { useState, useRef } from "react";
import { Message, MessageContent, MessageType } from "./model";
import MessageBubble from "./MessageBubble";

export default function Chat(props: {
  peerID: string;
  selectedPeerID: string | null;
  messages: Message[];
  sendMessages: (content: MessageContent) => void;
}) {
  const [postContent, setPostContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex h-full w-full flex-col">
      {/* top */}
      <div className="flex h-[3.75rem] w-full items-center justify-between border-b-2 px-5">
        <span>{props.selectedPeerID}</span>
        <button
          className="flex h-[1.5rem] w-[2.25rem] items-center justify-center rounded-xl bg-white fill-none shadow-md sm:hidden"
          onClick={() => {
            window.location.hash = "/";
          }}
        >
          <img className="mx-2" src={returnIcon}></img>
        </button>
      </div>

      {/* middle */}
      <div className="flex w-full flex-1 items-center justify-center overflow-clip ">
        {(() => {
          if (props.selectedPeerID == null) {
            return <p>No Peer selected</p>;
          }
          if (props.messages.length == 0) {
            return <p>No message with peer {props.selectedPeerID}</p>;
          }
          return (
            <div className="flex h-full w-full flex-col overflow-y-auto">
              {props.messages.map((msg) => {
                return (
                  <div
                    className={`flex flex-col ${
                      msg.from == props.peerID ? "items-end" : "items-start"
                    }`}
                    key={msg.id}
                  >
                    <p className="text-xs text-gray-500">{msg.from}</p>
                    <div
                      className={`flex flex-col ${
                        msg.from == props.peerID ? "items-end" : "items-start"
                      }`}
                    >
                      <MessageBubble message={msg} />
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      {/* bottom */}
      <div className="flex h-[8rem] w-full flex-col items-center justify-between border-t-2 px-5">
        {/* toolbox */}
        <div className="flex h-[2.5rem] w-full items-center justify-between">
          <button
            className="flex h-[1.5rem] w-[2.25rem]  items-center justify-center rounded-xl bg-white fill-none shadow-md"
            onClick={() => {
              if (fileInputRef.current != null) {
                fileInputRef.current.click();
              }
            }}
          >
            <img className="h-4 w-4" src={fileIcon}></img>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            // TODO: multiple
            style={{ display: "none" }}
            onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
              const target: HTMLInputElement = event.target;
              const files = target.files;
              if (files == null || files.length == 0) {
                console.info("no file selected");
                return;
              }
              if (files.length > 1) {
                console.warn("multiple files selected, only use the first one");
              }
              const file = files[0];

              const content = new MessageContent(MessageType.FILE);
              console.log("select file");
              await content.setData(file);
              console.log("select file setData done");

              props.sendMessages(content);
            }}
          />
          <button
            className="flex h-[1.5rem] w-[2.25rem]  items-center justify-center rounded-xl bg-white fill-none shadow-md"
            onClick={() => {
              alert("unimplemented");
            }}
          >
            <img className="h-4 w-4" src={imageIcon}></img>
          </button>
        </div>
        {/* input area */}
        <div className="flex h-full w-full flex-col items-center justify-center ">
          <textarea
            className="m-auto h-[calc(100%-2rem)] w-[calc(100%-2rem)] resize-none rounded-md border-2 px-3 py-2 text-sm outline-none hover:border-[#1d93ab] focus:border-[#1d93ab] focus-visible:border-[#1d93ab]"
            placeholder="Type message here"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={props.selectedPeerID == null}
            onKeyDown={(e) => {
              if (e.key === "Enter" && postContent.length == 0) {
                e.preventDefault();
              }
            }}
            onKeyUp={async (e) => {
              if (e.key === "Enter") {
                if (postContent.length == 0) {
                  // console.warn("postContent.length == 0");
                  return;
                } else if (postContent.length == 1) {
                  if (postContent[0] != "\n") {
                    console.warn(
                      "postContent.length == 1 && postContent[0] != '\\n'",
                    );
                  }
                  // type 'enter' when textarea is empty
                  setPostContent("");
                  return;
                }
                // remove the last '\n'
                if (postContent[postContent.length - 1] == "\n") {
                  setPostContent(postContent.slice(0, -1));
                } else {
                  console.warn(
                    "postContent[postContent.length - 1] != '\\n'",
                    postContent,
                  );
                }

                const content = new MessageContent(MessageType.TEXT);
                await content.setData(postContent);
                props.sendMessages(content);
                setPostContent("");
              }
            }}
          ></textarea>
        </div>
      </div>
    </div>
  );
}
