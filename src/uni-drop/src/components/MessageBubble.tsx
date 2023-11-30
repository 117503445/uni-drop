import { useState } from "react";
import {
  Message,
  TextMessageContent,
  FileMessageContent,
} from "../utils/model";
import download from "js-file-download";
import ToolButton from "./ToolButton";
import copyIcon from "@/assets/copy.svg";
import downloadIcon from "@/assets/download.svg";
import {filesize} from "filesize";

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
  let toolbar: JSX.Element | null = null;

  const [copyBtnClicked, setCopyBtnClicked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const content = msg.content;

  if (content instanceof TextMessageContent) {
    inner = (
      <p className="msg-bubble-text max-w-[30rem] break-all">{content.text}</p>
    );

    toolbar = (
      <div
        className={`mt-[0.5rem] flex flex-row ${
          !isHovered ? "sm:invisible" : ""
        }`}
      >
        <ToolButton
          onClick={() => {
            navigator.clipboard.writeText(content.text).then(
              () => {
                console.log("copy success");
                setCopyBtnClicked(true);
                setTimeout(() => {
                  setCopyBtnClicked(false);
                }, 3000);
              },
              () => {
                alert("copy failed");
              },
            );
          }}
          icon={copyIcon}
          disabled={copyBtnClicked}
        >
          <div className={`${!copyBtnClicked ? "hidden" : ""}`}>OK</div>
        </ToolButton>
      </div>
    );
  } else if (content instanceof FileMessageContent) {
    const downloadFunc = () => {
      if (!(content instanceof FileMessageContent)) {
        throw new Error("content is not FileMessageContent");
      }
      download(content.file, content.filename);
    };

    if (content.isPriview) {
      // const blob = new Blob([content.file], { type: "image/png" });
      inner = (
        <div className="msg-bubble-image">
          {" "}
          <p className="rounded-md ">{content.filename} | {filesize(content.file.size)}</p>
          <img
            className="rounded-md "
            src={URL.createObjectURL(content.file)}
          />
        </div>
      );
    } else {
      inner = (
        <button className="msg-bubble-file" onClick={downloadFunc}>
          [File] {content.filename} | {filesize(content.file.size)}
        </button>
      );
    }
    toolbar = (
      <div
        className={`mt-[0.5rem] flex flex-row ${
          !isHovered ? "sm:invisible" : ""
        }`}
      >
        <ToolButton onClick={downloadFunc} icon={downloadIcon}></ToolButton>
      </div>
    );
  } else {
    inner = <p>Unknown message type</p>;
  }

  return (
    <div
      className={`flex flex-col ${
        msg.from == props.peerID ? "items-end" : "items-start"
      } w-full pb-[0.5rem] pt-[1rem]`}
      onMouseEnter={() => {
        setIsHovered(true);
      }}
      onMouseLeave={() => {
        setIsHovered(false);
      }}
    >
      <div
        className={`flex flex-col rounded-lg border-2 border-[#dedede] p-2 ${color} `}
      >
        {inner}
      </div>
      <div>{msg.to == props.peerID ? toolbar : null}</div>
    </div>
  );
}

export default MessageBubble;
