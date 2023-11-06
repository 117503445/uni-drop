import React from 'react'
import ReactDOM from 'react-dom/client'
import Demo from './Demo.tsx'
import { HashRouter, createHashRouter, RouterProvider } from 'react-router-dom'
import App from './App.tsx';

const router = createHashRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/demo",
    element: <Demo />,
  },
]);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* <HashRouter>
      <Demo />
    </HashRouter> */}

    <RouterProvider router={router} />

  </React.StrictMode>,
)
