import "./global.css";
import settingIcon from "@/assets/setting.svg";
import githubIcon from "@/assets/github.svg";
import addIcon from "@/assets/add.svg";
import qrcodeIcon from "@/assets/qrcode.svg";

import { createHashRouter, RouterProvider } from "react-router-dom";
import { useState, useEffect, useRef, lazy, Suspense } from "react";

const Chat = lazy(() => import("./Chat.js"));
const AddFriend = lazy(() => import("./AddFriend.js"));
const Setting = lazy(() => import("./Setting.js"));
const FromFriend = lazy(() => import("./FromFriend.js"));
const Me = lazy(() => import("./Me.js"));

import { idToName } from "../utils/common.js";

import {
  UniPeersManager,
  UniPeersMockManager,
  UniPeersService,
} from "../utils/peer.js";
import { Message, MessageContent, TextMessageContent } from "../utils/model.js";

function App() {
  const [selectedPeerID, setSelectedPeerID] = useState<string | null>(null);
  const [peerID, setpeerID] = useState("");
  const [peersID, setpeersID] = useState<string[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [peersConnState, setPeersConnState] = useState<Map<string, boolean>>(
    new Map(),
  );
  const managerRef = useRef<UniPeersService | null>(null);

  // TODO: combine peersID and peersConnState

  useEffect(() => {
    let manager: UniPeersService;
    if (import.meta.env.VITE_MOCK_API != "true") {
      manager = new UniPeersManager(
        setpeerID,
        setpeersID,
        setMessages,
        setPeersConnState,
      );
    } else {
      manager = new UniPeersMockManager(
        setpeerID,
        setpeersID,
        setMessages,
        setPeersConnState,
      );

      manager.send("peer1", new TextMessageContent("hello"));
      setSelectedPeerID("peer1");
    }

    managerRef.current = manager;
    return function cleanup() {
      setpeerID("");
      setpeersID([]);
      setMessages([]);
      manager.close();
    };
  }, []);

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

  const curHashURL = () => {
    const splits = currentUrl.split("#");
    switch (splits.length) {
      case 1:
        return "/";
      case 2:
        return splits[1];
      default:
        console.warn("invalid url", currentUrl);
        return currentUrl;
    }
  };

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

  const connState = (peerID: string | null) => {
    if (peerID == null) {
      return false;
    }

    const state = peersConnState.get(peerID);
    if (state == null) {
      return false;
    }
    return state;
  };

  const chat = (
    <Chat
      peerID={peerID}
      selectedPeerID={selectedPeerID}
      connState={connState(selectedPeerID)}
      messages={messages.filter(
        (msg) => msg.from == selectedPeerID || msg.to == selectedPeerID,
      )}
      sendMessages={sendMessages}
    ></Chat>
  );

  const addFriend = (
    <AddFriend
      addPeer={(peerId: string) => {
        if (managerRef.current == null) {
          console.warn("manager is null");
          return;
        }
        managerRef.current.addPeer(peerId);
      }}
    ></AddFriend>
  );

  const fromFriend = (
    <FromFriend
      addPeer={(peerId: string) => {
        if (managerRef.current == null) {
          console.warn("manager is null");
          return;
        }
        managerRef.current.addPeer(peerId);
      }}
    ></FromFriend>
  );

  const me = <Me peerID={peerID}></Me>;

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
      path: "/add-friend",
      element: addFriend,
    },
    {
      path: "/from-friend/:id",
      element: fromFriend,
    },
    {
      path: "/settings",
      element: <Setting />,
    },
    {
      path: "/me",
      element: me,
    },
  ]);

  return (
    <div className="h-full w-full">
      <div className="flex h-full w-full items-center justify-center">
        <div className="flex h-full w-full max-w-[75rem] overflow-hidden rounded-[1rem] sm:h-[calc(100%-5rem)] sm:w-[calc(100%-5rem)] sm:border-2 sm:shadow-md">
          {/* left side */}
          <div
            className={`flex h-full min-w-full ${
              curHashURL() != "/" ? "hidden sm:flex" : ""
            } max-w-full flex-col border-r-2 bg-[#e7f8ff] p-[2rem] shadow-md sm:min-w-[18.75rem] sm:max-w-[18.75rem]`}
          >
            {/* logo */}
            <span className="text-xl font-bold">UniDrop</span>
            <span className="text-sm">
              <span className="font-bold">Uni</span>
              <span>versal Air</span>
              <span className="font-bold">Drop</span>
              <span>.</span>
            </span>

            {/* me */}
            <div
              id="div-me"
              className="mx-auto my-[2rem] flex max-h-[5rem] min-h-[5rem] w-[100%] cursor-pointer items-center rounded-xl bg-white py-2 shadow-md"
              onClick={() => {
                window.location.hash = "/me";
              }}
            >
              <img className="ml-[1rem] max-w-[3rem]" src={qrcodeIcon}></img>
              <span className="mx-auto">
                {(() => {
                  if (peerID.length > 0) {
                    return idToName(peerID) + " (me)";
                  } else {
                    return "loading...";
                  }
                })()}
              </span>
              <span className="hidden" id="peerID">
                {peerID}
              </span>
              <span className="hidden" id="peerName">
                {idToName(peerID)}
              </span>
            </div>

            {/* peers */}
            <div className="mb-[2rem] flex flex-col overflow-clip overflow-y-auto">
              {peersID.length > 0 ? (
                peersID.map((id) => (
                  <div
                    className={`mx-auto my-1.5 max-h-[3.5rem] min-h-[3.5rem] w-[100%] cursor-pointer rounded-xl bg-white py-2 shadow-sm hover:bg-[#f3f3f3] ${
                      selectedPeerID == id
                        ? "border-[0.125rem] border-[#1d93ab]"
                        : ""
                    } items-center hover:shadow-lg`}
                    key={id}
                    onClick={() => {
                      setSelectedPeerID(id);
                      window.location.hash = `/chat/${id}`;
                    }}
                  >
                    <div className={`m-auto flex h-full flex-row items-center`}>
                      <div
                        className={`h-2 w-2 ${
                          selectedPeerID == id ? "ml-[4.875rem]" : "ml-[5rem]"
                        } mr-[1rem] rounded-full ${
                          connState(id) ? "bg-green-300" : "bg-red-300"
                        } `}
                      ></div>
                      <span>{idToName(id)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="m-auto">Looking for peers on same LAN ...</div>
              )}
            </div>

            {/* bottom toolbox */}
            <div className="mt-auto flex  max-h-[3rem] min-h-[3rem] flex-1 sm:max-h-[2.25rem] sm:min-h-[2.25rem]">
              {/* setting button */}
              <button
                className="mr-[1.25rem] flex min-h-full min-w-[3rem] items-center justify-center rounded-md bg-white shadow-md sm:min-w-[2.25rem]"
                onClick={() => {
                  window.location.hash = "/settings";
                }}
              >
                <img src={settingIcon}></img>
              </button>

              {/* github button */}
              <button
                className="flex min-h-full min-w-[3rem] items-center justify-center rounded-md bg-white fill-none shadow-md sm:min-w-[2.25rem]"
                onClick={() => {
                  window.open("https://github.com/117503445/uni-drop");
                }}
              >
                <img src={githubIcon}></img>
              </button>

              {/* add button */}
              <button
                id="btn-add"
                className="ml-auto flex min-h-full items-center rounded-md bg-white fill-none px-2 shadow-md sm:px-2"
                onClick={() => {
                  window.location.hash = "/add-friend";
                }}
              >
                <img className="mx-2" src={addIcon}></img>
                <div className="mr-2 min-w-max">Add</div>
              </button>
            </div>
          </div>

          {/* right side */}
          <div
            className={`h-full w-full bg-white ${
              curHashURL() == "/" ? "hidden sm:flex" : ""
            }`}
          >
            <Suspense fallback={<div>Loading...</div>}>
              <RouterProvider router={router} />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
