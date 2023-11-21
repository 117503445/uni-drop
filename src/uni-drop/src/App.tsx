import "./global.css";
import settingIcon from "./assets/setting.svg";
import githubIcon from "./assets/github.svg";

import addIcon from "./assets/add.svg";
import Chat from "./Chat";
import AddFriend from "./AddFriend";
import { createHashRouter, RouterProvider } from "react-router-dom";

import { useState, useEffect, useRef } from "react";
import {
  UniPeersManager,
  UniPeersMockManager,
  UniPeersService,
} from "./peer.js";
import { Message, MessageContent, MessageType } from "./model";

function App() {
  const [currentUrl, setCurrentUrl] = useState(window.location.href);
  useEffect(() => {
    const handleUrlChange = () => {
      setCurrentUrl(window.location.href);
    };
    window.addEventListener("popstate", handleUrlChange);
    return () => {
      window.removeEventListener("popstate", handleUrlChange);
    };
  }, []);

  // useEffect(() => {
  //   console.log('URL changed:', currentUrl.split("#")[1]);
  // }, [currentUrl]);

  const [selectedPeerID, setSelectedPeerID] = useState<string | null>(null);
  const [peerID, setpeerID] = useState("");
  const [peersID, setpeersID] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const managerRef = useRef<UniPeersService | null>(null);

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

  const chat = (
    <Chat
      peerID={peerID}
      selectedPeerID={selectedPeerID}
      messages={messages.filter(
        (msg) => msg.from == selectedPeerID || msg.to == selectedPeerID,
      )}
      sendMessages={sendMessages}
    ></Chat>
  );

  const router = createHashRouter([
    {
      path: "/",
      element: chat,
    },
    {
      path: "/chat",
      element: chat,
    },
    {
      path: "/chat/:id",
      element: chat,
    },
    {
      path: "/test",
      element: <div>test</div>,
    },
    {
      path: "/add-friend",
      element: <AddFriend />,
    },
  ]);

  return (
    <div>
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex h-full w-full max-w-[75rem] overflow-hidden rounded-[1rem] sm:h-[calc(100%-5rem)] sm:w-[calc(100%-5rem)] sm:border-2 sm:shadow-md">
          {/* left side */}
          <div
            className={`flex h-full min-w-full ${
              // "!sm:hidden"
              currentUrl.split("#")[1] != "/" ? "hidden sm:flex" : ""
            } max-w-full flex-col border-r-2 bg-[#e7f8ff] p-[2rem] shadow-md sm:min-w-[18.75rem] sm:max-w-[18.75rem]`}
          >
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
                  className={`mx-auto my-1.5 flex h-[4rem] w-[100%] cursor-pointer rounded-xl bg-white py-2 shadow-md hover:bg-[#f3f3f3] ${
                    selectedPeerID == id ? "border-2 border-[#1d93ab]" : ""
                  } hover:shadow-lg`}
                  key={id}
                  onClick={() => {
                    setSelectedPeerID(id);
                    // jump to /chat/:id
                    window.location.hash = `/chat/${id}`;
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
                  window.location.hash = "/add-friend";
                }}
              >
                <img className="mx-2" src={addIcon}></img>
                <div className="mr-4 min-w-max">Add Friend</div>
              </button>
            </div>
          </div>

          {/* right side */}
          <div className="h-full w-full bg-white">
            <RouterProvider router={router} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
