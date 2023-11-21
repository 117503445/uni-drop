import "./global.css";
import { useState } from "react";

export default function AddFriend() {
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
          alert(postContent);
        }}
      >
        Add
      </button>
    </div>
  );
}
