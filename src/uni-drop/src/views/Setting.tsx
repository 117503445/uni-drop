import "./global.css";

import { setPageSpy, setVConsole } from "../store/settingStore";
import RightTopBar from "../components/RightTopBar";

import type { RootState } from "../store/store";
import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";

export default function Setting() {
  const enableVConsole = useSelector(
    (state: RootState) => state.settings.enableVConsole,
  );

  useEffect(() => {
    if (enableVConsole) {
      const importScript = document.createElement("script");
      importScript.src =
        "https://unpkg.com/vconsole@latest/dist/vconsole.min.js";
      document.head.appendChild(importScript);

      importScript.onload = () => {
        const newScript = document.createElement("script");
        newScript.text = `var vConsole = new window.VConsole();`;
        document.head.appendChild(newScript);
      };
    }
  }, [enableVConsole]);

  const enablePageSpy = useSelector(
    (state: RootState) => state.settings.enablePageSpy,
  );

  useEffect(() => {
    if (enablePageSpy) {
      const importScript = document.createElement("script");
      importScript.src =
        "https://page-spy-web.be.wizzstudio.com:30000/page-spy/index.min.js";
      importScript.crossOrigin = "anonymous";
      document.head.appendChild(importScript);

      importScript.onload = () => {
        const newScript = document.createElement("script");
        newScript.text = `window.$pageSpy = new PageSpy({project: "uni-drop"});`;
        document.head.appendChild(newScript);
      };
    }
  }, [enablePageSpy]);

  const dispatch = useDispatch();

  return (
    <div>
      <RightTopBar>
        <span className="m-auto text-xl">Settings</span>
      </RightTopBar>
      <div>
        <label>vconsole</label>
        <input
          type="checkbox"
          name="vconsole"
          disabled={enableVConsole}
          checked={enableVConsole}
          onChange={(e) => {
            dispatch(setVConsole(e.target.checked));
          }}
        ></input>
      </div>
      <div>
        <label>pagespy</label>
        <input
          type="checkbox"
          name="pagespy"
          checked={enablePageSpy}
          disabled={enablePageSpy}
          onChange={(e) => {
            dispatch(setPageSpy(e.target.checked));
          }}
        ></input>
      </div>
    </div>
  );
}
