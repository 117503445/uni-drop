import "./global.css";

import { setVConsole } from "../store/settingStore";

import type { RootState } from "../store/store";
import { useSelector, useDispatch } from "react-redux";

export default function Setting() {
  const enableVConsole = useSelector(
    (state: RootState) => state.settings.enableVConsole,
  );
  const dispatch = useDispatch();

  return (
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
  );
}
