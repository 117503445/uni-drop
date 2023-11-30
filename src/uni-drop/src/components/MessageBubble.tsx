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
import { filesize } from "filesize";
import { DefaultExtensionType, FileIcon, defaultStyles } from "react-file-icon";

function MessageBubble(props: { peerID: string; message: Message }) {
  const msg = props.message;
  let color: string;
  if (msg.from == props.peerID) {
    color = "bg-[#e7f8ff]";
  } else if (msg.to == props.peerID) {
    if (msg.content instanceof FileMessageContent && !msg.content.isPriview) {
      color = "bg-white";
    } else {
      color = "bg-[#f2f2f2]";
    }
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

  const getFileTypeByExtension = (filename: string) => {
    const splits = filename.split(".");
    if (splits.length <= 1) {
      return "file";
    }
    return splits.pop() ?? "file";
  };

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
      inner = (
        <div
          className="msg-bubble-image cursor-pointer"
          onClick={() => {
            // open image in new tab
            window.open(URL.createObjectURL(content.file));
          }}
        >
          {" "}
          <p className="rounded-md ">
            {content.filename} | {filesize(content.file.size)}
          </p>
          <img
            className="rounded-md "
            src={URL.createObjectURL(content.file)}
          />
        </div>
      );
    } else {
      inner = (
        <div
          className="msg-bubble-file flex cursor-pointer flex-row"
          onClick={downloadFunc}
        >
          <div className="mr-2 flex flex-col justify-center ">
            <span>{content.filename}</span>
            <span>{filesize(content.file.size)}</span>
          </div>
          <div className="mb-2 h-[3rem] w-[3rem]">
            <FileIcon
              extension={(() => {
                return getFileTypeByExtension(content.filename);
              })()}
              {...(() => {
                const fileType = getFileTypeByExtension(content.filename);
                if (fileType in defaultStyles) {
                  const fileIconProps =
                    defaultStyles[fileType as DefaultExtensionType];
                  return fileIconProps;
                } else {
                  return "";
                }
              })()}
            ></FileIcon>
          </div>
        </div>
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
