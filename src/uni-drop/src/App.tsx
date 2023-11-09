import "./App.css";
import settingImg from "./assets/setting.svg";
import { useState, useEffect, useRef } from "react";
import { UniPeersManager } from "./peer.js";

function App() {
  const [peerID, setpeerID] = useState("");

  const [peersID, setpeersID] = useState<string[]>([]);
  // console.log("render peersID", peersID);
  let peerCards = peersID.map((id) => {
    return (
      <div
        className="mx-auto my-1.5 flex h-[4rem] w-[16rem] rounded-md bg-white py-2 shadow-md"
        key={id}
      >
        <span className="mx-auto">{id}</span>
      </div>
    );
  });

  const [postContent, setPostContent] = useState("");

  const managerRef = useRef<UniPeersManager | null>(null);
  useEffect(() => {
    const manager = new UniPeersManager(setpeerID, setpeersID);
    managerRef.current = manager;
    console.log("useEffect");
    return function cleanup() {
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
          window.location.hash = "/demo";
        }}
        className="fixed bottom-5 left-5 rounded-md border-2 border-gray-500"
      >
        Demo
      </button>

      <div className="flex h-screen w-screen items-center justify-center">
        <div className="flex h-[calc(100%-5rem)] w-[calc(100%-5rem)] max-w-[75rem] overflow-hidden rounded-[1rem] border-2 shadow-md">
          {/* left side */}
          <div className="flex h-full w-[25rem] flex-col border-r-2 bg-[#e7f8ff] shadow-md">
            <span className="text-xl font-bold">UniDrop</span>
            <span className="text-xl">
              <span className="font-bold">Uni</span> versal Air
              <span className="font-bold">Drop</span>.
            </span>
            <span className="text-xl font-bold">{peerID}</span>

            <div className="flex flex-col">
              {/* <div className="mx-auto my-1.5 flex h-[4rem] w-[16rem] rounded-md bg-white py-2 shadow-md text-center"></div>
              <div className="mx-auto my-1.5 flex h-[4rem] w-[16rem] rounded-md bg-white py-2 shadow-md"></div> */}
              {peerCards}
            </div>

            <div className="mt-auto flex max-h-[5rem] flex-1">
              <button className="flex h-[2rem] w-[2rem] items-center justify-center rounded-md bg-white shadow-md">
                <img src={settingImg}></img>
              </button>
            </div>
          </div>

          {/* right side */}
          <div className="flex h-full w-full flex-col">
            <div className="flex h-[3.75rem] w-full items-center justify-between border-b-2 px-5"></div>
            <div className="flex w-full flex-1 items-center justify-center"></div>
            <div className="flex h-[8rem] w-full flex-col items-center justify-between border-t-2 px-5">
              <div className="flex h-[2.5rem] w-full items-center justify-between"></div>

              <div className="flex h-full w-full items-center justify-center ">
                <textarea
                  className="m-auto h-[calc(100%-2rem)] w-[calc(100%-2rem)] resize-none rounded-md border-2 px-3 py-2 text-sm outline-none hover:border-[#1d93ab] focus:border-[#1d93ab] focus-visible:border-[#1d93ab]"
                  placeholder="Type message here"
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  onKeyUp={(e) => {
                    if (e.key === "Enter") {
                      if (managerRef.current != null) {
                        let id = managerRef.current.getPeersId()[0];
                        console.log("send to", id);

                        managerRef.current.send(id, postContent);
                      } else {
                        console.log("manager is null");
                      }
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
