import "./global.css";

import fileIcon from "@/assets/file.svg";
import imageIcon from "@/assets/image.svg";
import { useState, useRef, useEffect } from "react";
import {
  FileMessageContent,
  Message,
  MessageContent,
  TextMessageContent,
} from "../utils/model";
import MessageBubble from "../components/MessageBubble";
import { idToName } from "../utils/common";
import RightTopBar from "../components/RightTopBar";

export default function Chat(props: {
  peerID: string;
  selectedPeerID: string | null;
  messages: Message[];
  sendMessages: (content: MessageContent) => void;
}) {
  const [postContent, setPostContent] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const submitText = () => {
    if (postContent.length == 0) {
      // console.warn("postContent.length == 0");
      return;
    } else if (postContent.length == 1) {
      if (postContent[0] != "\n") {
        console.warn("postContent.length == 1 && postContent[0] != '\\n'");
      }
      // type 'enter' when textarea is empty
      setPostContent("");
      return;
    }

    // let data;
    // pressdown 'w', pressdown 'enter', pressup 'w', pressup 'enter' still will cause '\n' in textarea
    // if (postContent[postContent.length - 1] == "\n") {
    //   data = postContent.slice(0, -1);
    // } else {
    //   data = postContent;
    //   console.warn(
    //     "postContent[postContent.length - 1] != '\\n'",
    //     postContent,
    //   );
    // }

    const content = new TextMessageContent(postContent);
    // await content.setData(data);
    props.sendMessages(content);
    setPostContent("");
  };

  const selectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    return file;
  };

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }),
    [props.messages];

  return (
    <div className="flex h-full w-full flex-col">
      {/* top */}
      <RightTopBar>
        <span className="m-auto text-xl">{idToName(props.selectedPeerID)}</span>
      </RightTopBar>

      {/* middle */}
      <div className="flex w-full flex-1 items-center justify-center overflow-clip">
        {(() => {
          if (props.selectedPeerID == null) {
            return <p>No Peer selected</p>;
          }
          if (props.messages.length == 0) {
            return <p>No message with peer {idToName(props.selectedPeerID)}</p>;
          }
          return (
            <div className="flex h-full w-full flex-col overflow-y-auto px-[1.25rem]">
              {props.messages.map((msg) => {
                return (
                  <div
                    className={`flex flex-col ${
                      msg.from == props.peerID ? "items-end" : "items-start"
                    }`}
                    key={msg.id}
                  >
                    {/* <p className="text-xs text-gray-500">{msg.from}</p> */}
                    <div
                      className={`flex flex-col ${
                        msg.from == props.peerID ? "items-end" : "items-start"
                      } mb-[0.5rem] mt-[1rem]`}
                    >
                      <MessageBubble message={msg} peerID={props.peerID} />
                    </div>
                  </div>
                );
              })}
              <div
                style={{ clear: "both", height: "1px", width: "100%" }}
                ref={endRef}
              ></div>
            </div>
          );
        })()}
      </div>

      {/* bottom */}
      <div className="flex h-[8rem] w-full flex-col items-center justify-between border-t-2 px-5">
        {/* toolbox */}
        <div className="my-[0.5rem] flex h-[2.5rem] w-full items-center">
          <button
            id="btn-file"
            className="border-#[dedede] mr-[0.5rem] flex h-[1.5rem] w-[2.5rem] items-center justify-center rounded-xl border-2 bg-white fill-none shadow-sm"
            onClick={() => {
              if (fileInputRef.current != null) {
                fileInputRef.current.click();
              }
            }}
          >
            <img className="h-4 w-4" src={fileIcon}></img>
            <input
              type="file"
              ref={fileInputRef}
              // TODO: multiple
              style={{ display: "none" }}
              onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
                const file = selectFile(event);
                if (!file) {
                  return;
                }
                const blob = new Blob([file], { type: file.type });
                const content = new FileMessageContent(blob, file.name, false);
                console.log("select file");

                props.sendMessages(content);
              }}
            />
          </button>

          <button
            id="btn-image"
            className="border-#[dedede] flex h-[1.5rem] w-[2.5rem] items-center justify-center rounded-xl border-2 bg-white fill-none shadow-sm"
            onClick={() => {
              if (imageInputRef.current != null) {
                imageInputRef.current.click();
              }
            }}
          >
            <img className="h-4 w-4" src={imageIcon}></img>
            <input
              type="file"
              ref={imageInputRef}
              // TODO: multiple
              style={{ display: "none" }}
              accept="image/*"
              onChange={async (event: React.ChangeEvent<HTMLInputElement>) => {
                const file = selectFile(event);
                if (!file) {
                  return;
                }
                const blob = new Blob([file], { type: file.type });
                const content = new FileMessageContent(blob, file.name, true);
                console.log("select image");

                props.sendMessages(content);
              }}
            />
          </button>
        </div>
        {/* input area */}
        <div
          tabIndex={0}
          className="mb-[1.25rem] mt-1 flex h-full w-full flex-row items-center justify-center rounded-md border-2 px-3  outline-none hover:border-[#1d93ab] focus:border-[#1d93ab] focus-visible:border-[#1d93ab]"
        >
          <textarea
            className="h-full w-full resize-none py-2 text-sm  outline-none "
            placeholder="Type message here"
            value={postContent}
            onChange={(e) => setPostContent(e.target.value)}
            disabled={props.selectedPeerID == null}
            onKeyDown={(e) => {
              if (e.key === "Enter" && postContent.length == 0) {
                e.preventDefault();
              }
            }}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                submitText();
              }
            }}
          ></textarea>
          <button
            className="h-[2rem] w-[4.5rem] rounded-md bg-[#1d93ab] text-white hover:brightness-90"
            onClick={submitText}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
