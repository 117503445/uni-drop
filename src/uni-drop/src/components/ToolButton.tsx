export default function ToolButton(props: {
  id?: string;
  onClick: () => void;
  icon: string;
  children?: React.ReactNode;
  disabled?: boolean;
}) {


    
  return (
    <button
      id={props.id}
      className="border-#[dedede] flex h-[1.5rem] w-[2.5rem] items-center justify-center rounded-xl border-2 bg-white fill-none shadow-sm hover:bg-[#e5e5e5]"
      onClick={props.onClick} disabled={props.disabled}
    >
      <img className="h-4 w-4" src={props.icon}></img>
      {props.children}
    </button>
  );
}
