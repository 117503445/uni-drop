import copyIcon from "@/assets/copy.svg";

export default function CopyButton(props: { text: string }) {
  return (
    <button>
      <img
        className="max-h-[1rem] max-w-[1rem]"
        src={copyIcon}
        onClick={() => {
          navigator.clipboard.writeText(props.text);
          alert("copied successfully");
        }}
      ></img>
    </button>
  );
}
