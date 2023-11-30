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
import ToolButton from "../components/ToolButton";

export default function Chat(props: {
  peerID: string;
  selectedPeerID: string | null;
  connState: boolean;
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
      if (!postContent.startsWith("\n")) {
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
        <div
          className={`m-auto flex flex-row items-center justify-center ${
            props.selectedPeerID == null ? "hidden" : ""
          }`}
        >
          <span className={`mr-[1rem] text-xl sm:hidden`}>
            {" "}
            {idToName(props.peerID)} (me) -{">"}{" "}
          </span>
          <div
            className={`h-2 w-2 rounded-full ${
              props.connState ? "bg-green-300" : "bg-red-300"
            } mr-[1rem]`}
          ></div>
          <span className="text-xl">{idToName(props.selectedPeerID)}</span>
        </div>
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
                    <MessageBubble message={msg} peerID={props.peerID} />
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
        <div className="my-[0.5rem] flex h-[2.5rem] w-full items-center space-x-3">
          <ToolButton
            id="btn-file"
            icon={fileIcon}
            onClick={() => {
              if (fileInputRef.current != null) {
                fileInputRef.current.click();
              }
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              // TODO: multiple
              style={{ display: "none" }}
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
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
          </ToolButton>

          <ToolButton
            id="btn-image"
            icon={imageIcon}
            onClick={() => {
              if (imageInputRef.current != null) {
                imageInputRef.current.click();
              }
            }}
          >
            <input
              type="file"
              ref={imageInputRef}
              // TODO: multiple
              style={{ display: "none" }}
              accept="image/*"
              onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
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
          </ToolButton>
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
            onChange={(e) => {
              setPostContent(e.target.value);
            }}
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
