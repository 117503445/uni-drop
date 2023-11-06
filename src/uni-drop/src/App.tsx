import './App.css'


function App() {



    return (
        <div className="App">
            <h1>React Typescript</h1>

            {/* button to nagivate to demo page, always in left bottom */}
            <button onClick={() => {
                window.location.hash = "/demo"
            }} className='border-2 border-gray-500 rounded-md fixed bottom-5 left-5'>
                Demo
            </button>
        </div>
    )
}

export default App