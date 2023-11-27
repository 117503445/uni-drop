import "./global.css";

import { setPageSpy, setVConsole } from "../store/settingStore";

import type { RootState } from "../store/store";
import { useSelector, useDispatch } from "react-redux";

export default function Setting() {
  const enableVConsole = useSelector(
    (state: RootState) => state.settings.enableVConsole,
  );
  const enablePageSpy = useSelector(
    (state: RootState) => state.settings.enablePageSpy,
  );

  const dispatch = useDispatch();

  return (
    <div>
      <div>
        <label>vconsole</label>
        <input
          type="checkbox"
          name="vconsole"
          checked={enableVConsole}
          onChange={(e) => {
            dispatch(setVConsole(e.target.checked));
          }}
        ></input>
      </div>
      <div>
        <label>pagesky</label>
        <input
          type="checkbox"
          name="pagesky"
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
