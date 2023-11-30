export default function ToolButton(props: {
  id: string;
  onClick: () => void;
  icon: string;
  children?: React.ReactNode;
}) {
  return (
    <button
      id={props.id}
      className="border-#[dedede] flex h-[1.5rem] w-[2.5rem] items-center justify-center rounded-xl border-2 bg-white fill-none shadow-sm"
      onClick={props.onClick}
    >
      <img className="h-4 w-4" src={props.icon}></img>
      {props.children}
    </button>
  );
}
