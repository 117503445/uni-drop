import "./App.css";
import settingIcon from "./assets/setting.svg";
import githubIcon from "./assets/github.svg";
import fileIcon from "./assets/file.svg";
import imageIcon from "./assets/image.svg";
import addIcon from "./assets/add.svg";

import MessageBubble from "./MessageBubble";

import { useState, useEffect, useRef } from "react";
import {
  UniPeersManager,
  UniPeersMockManager,
  UniPeersService,
} from "./peer.js";
import { Message, MessageContent, MessageType } from "./model";

function App() {
  const [selectedPeerID, setSelectedPeerID] = useState<string | null>(null);
  const [peerID, setpeerID] = useState("");
  const [peersID, setpeersID] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [postContent, setPostContent] = useState("");
  const managerRef = useRef<UniPeersService | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessages = (content: MessageContent) => {
    if (selectedPeerID == null) {
      console.warn("no peer selected");
      return;
    }
    if (managerRef.current == null) {
      console.warn("manager is null");
      return;
    }
    console.log("send to", selectedPeerID);
    managerRef.current.send(selectedPeerID, content);
  };

  const peerMessages = (selectedPeerID: string | null) => {
    if (selectedPeerID == null) {
      return <p>No Peer selected</p>;
    }

    // selectedPeerID is `from` or `to`
    const peerMessages = messages.filter(
      (msg) => msg.from == selectedPeerID || msg.to == selectedPeerID,
    );

    if (peerMessages.length == 0) {
      return <p>No message with peer {selectedPeerID}</p>;
    }

    return (
      <div className="flex h-full w-full flex-col overflow-y-auto">
        {peerMessages.map((msg) => {
          return (
            <div
              className={`flex flex-col ${
                msg.from == peerID ? "items-end" : "items-start"
              }`}
              key={msg.id}
            >
              <p className="text-xs text-gray-500">{msg.from}</p>
              <div
                className={`flex flex-col ${
                  msg.from == peerID ? "items-end" : "items-start"
                }`}
              >
                <MessageBubble message={msg} />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  useEffect(() => {
    let manager: UniPeersService;
    if (import.meta.env.VITE_MOCK_API != "true") {
      manager = new UniPeersManager(setpeerID, setpeersID, setMessages);
    } else {
      manager = new UniPeersMockManager(setpeerID, setpeersID, setMessages);

      manager.send("peer1", new MessageContent(MessageType.TEXT, "hello"));
      setSelectedPeerID("peer1");
    }

    managerRef.current = manager;
    return function cleanup() {
      setpeerID("");
      setpeersID([]);
      setMessages([]);
      if (manager != null) {
        manager.close();
      }
    };
  }, []);

  return (
    <div>
      {/* button to nagivate to demo page, always in left bottom */}
      <button
        onClick={() => {
          // window.location.hash = "/demo";
          window.location.hash = "/demopeer";
        }}
        className="fixed bottom-5 left-5 rounded-md border-2 border-gray-500"
      >
        Demo
      </button>

      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex h-[calc(100%-5rem)] w-[calc(100%-5rem)] max-w-[75rem] overflow-hidden rounded-[1rem] border-2 shadow-md">
          {/* left side */}
          <div className="flex h-full w-[25rem] flex-col border-r-2 bg-[#e7f8ff] p-5 shadow-md">
            <span className="text-xl font-bold">UniDrop</span>
            <span className="text-xl">
              <span className="font-bold">Uni</span>versal Air
              <span className="font-bold">Drop</span>.
            </span>
            <span className="text-xl font-bold" id="peerID">
              {peerID}
            </span>

            <div className="flex flex-col">
              {peersID.map((id) => (
                <div
                  className={`mx-auto my-1.5 flex h-[4rem] w-[16rem] cursor-pointer rounded-xl bg-white py-2 shadow-md hover:bg-[#f3f3f3] ${
                    selectedPeerID == id ? "border-2 border-[#1d93ab]" : ""
                  } hover:shadow-lg`}
                  key={id}
                  onClick={() => {
                    setSelectedPeerID(id);
                  }}
                >
                  <span className="mx-auto">{id}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex max-h-[2.25rem] flex-1">
              {/* setting button */}
              <button
                className="mr-[1.25rem] flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-md bg-white shadow-md"
                onClick={() => {
                  alert("unimplemented");
                }}
              >
                <img src={settingIcon}></img>
              </button>

              {/* github button */}
              <button
                className="mr-[3rem] flex h-[2.25rem] w-[2.25rem] items-center justify-center rounded-md bg-white fill-none shadow-md"
                onClick={() => {
                  window.open("https://github.com/117503445/uni-drop");
                }}
              >
                <img src={githubIcon}></img>
              </button>

              {/* add button */}
              <button
                className="flex h-[2.25rem] w-[auto] items-center rounded-md bg-white fill-none shadow-md"
                onClick={() => {
                  alert("unimplemented");
                }}
              >
                <img className="mx-2" src={addIcon}></img>
                <div className="mr-4 min-w-max">Add Friend</div>
              </button>
            </div>
          </div>

          {/* right*/}
          <div className="flex h-full w-full flex-col">
            {/* right top */}
            <div className="flex h-[3.75rem] w-full items-center justify-between border-b-2 px-5">
              {selectedPeerID}
            </div>

            {/* right middle */}
            <div className="flex w-full flex-1 items-center justify-center">
              {peerMessages(selectedPeerID)}
            </div>

            {/* right bottom */}
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
                  onChange={async (
                    event: React.ChangeEvent<HTMLInputElement>,
                  ) => {
                    const target: HTMLInputElement = event.target;
                    const files = target.files;
                    if (files == null || files.length == 0) {
                      console.info("no file selected");
                      return;
                    }
                    if (files.length > 1) {
                      console.warn(
                        "multiple files selected, only use the first one",
                      );
                    }
                    const file = files[0];

                    const content = new MessageContent(MessageType.FILE);
                    console.log("select file");
                    await content.setData(file);
                    console.log("select file setData done");

                    sendMessages(content);
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
                  disabled={selectedPeerID == null}
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
                      sendMessages(content);
                      setPostContent("");
                    }
                  }}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
