import "./global.css";
import { useState } from "react";

export default function AddFriend(props: {
  addPeer: (peerId: string) => void;
}) {
  const [postContent, setPostContent] = useState("");

  return (
    <div>
      <textarea
        placeholder="Add friend by peer id"
        className="flex-1"
        value={postContent}
        onChange={(e) => setPostContent(e.target.value)}
      />
      <button
        className="flex-1 bg-red-50"
        onClick={() => {
          props.addPeer(postContent);
        }}
      >
        Add
      </button>
    </div>
  );
}
