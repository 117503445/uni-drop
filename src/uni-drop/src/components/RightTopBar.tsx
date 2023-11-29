import returnIcon from "@/assets/return.svg";

interface Props {
  children?: React.ReactNode;
}

export default function RightTopBar(props: Props) {
  return (
    <div className="flex h-[3.75rem] w-full flex-row items-center justify-between border-b-2 px-5">
      {/* <span>{idToName(props.selectedPeerID)}</span> */}
      {props.children}
      <button
        className="flex h-[1.5rem] w-[2.25rem] items-center justify-center rounded-xl bg-white fill-none shadow-md sm:hidden"
        onClick={() => {
          window.location.hash = "/";
        }}
      >
        <img className="mx-2" src={returnIcon}></img>
      </button>
    </div>
  );
}
