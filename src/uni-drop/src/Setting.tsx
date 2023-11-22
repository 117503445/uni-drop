import "./global.css";
import VConsole from "vconsole";

import fileIcon from "./assets/file.svg";
import imageIcon from "./assets/image.svg";
import returnIcon from "./assets/return.svg";
import { useState, useRef, useEffect } from "react";
import { Message, MessageContent, MessageType } from "./model";
import MessageBubble from "./MessageBubble";

export default function Setting() {
  const [vconsoleChecked, setVconsoleChecked] = useState(false);

  useEffect(() => {
    let vConsole: VConsole | null = null;
    if (vconsoleChecked) {
      vConsole = new VConsole();
    }
    return () => {
      if (vConsole) {
        vConsole.destroy();
      }
    };
  }, [vconsoleChecked]);

  return (
    <div>
      <label>vconsole</label>
      <input
        type="checkbox"
        name="vconsole"
        checked={vconsoleChecked}
        onChange={(e) => {
          setVconsoleChecked(e.currentTarget.checked);
        }}
      ></input>
    </div>
  );
}
