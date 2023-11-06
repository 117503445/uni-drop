import "./App.css";

function App() {
  return (
    <div>
      {/* button to nagivate to demo page, always in left bottom */}
      <button
        onClick={() => {
          window.location.hash = "/demo";
        }}
        className="border-2 border-gray-500 rounded-md fixed bottom-5 left-5"
      >
        Demo
      </button>

      <div className="h-screen w-screen flex justify-center items-center">
        <div className="rounded-md w-[calc(100%-5rem)] max-w-[75] h-[calc(100%-5rem)] border-2 shadow-md flex">
          {/* left side */}
          <div className="w-[18.75rem] h-full bg-[#DCECF3] shadow-md flex flex-col">
            {/* header */}
            <div className="h-[3.75rem] w-full flex flex-col justify-between items-center px-5 border-b-2">
              <span className="text-xl font-bold">UniDrop</span>
              <span className="text-xl ">Universal AirDrop.</span>
            </div>
          </div>

          {/* right side */}
          <div className="w-[calc(100%-18.75rem)] h-full flex flex-col">
            {/* header */}
            <div className="h-[3.75rem] w-full flex justify-between items-center px-5 border-b-2"></div>

            {/* body */}
            <div className="flex-1 w-full flex justify-center items-center">
              {/* <div className='w-[calc(100%-10rem)] h-[calc(100%-10rem)] bg-white rounded-md shadow-md flex flex-col justify-center items-center'>
                                <div className='text-2xl font-bold'>Welcome</div>
                                <div className='text-xl'>to</div>
                                <div className='text-2xl font-bold'>React Tailwind</div>
                            </div> */}
            </div>

            {/* footer */}
            <div className="h-[8rem] w-full flex justify-between items-center px-5 border-t-2"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
