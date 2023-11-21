import React from "react";
import ReactDOM from "react-dom/client";
// import Demo from "./Demo.tsx";
// import DemoPeer from "./DemoPeer.tsx";
// import { createHashRouter, RouterProvider } from "react-router-dom";
import App from "./App.tsx";

// const router = createHashRouter([
//   {
//     path: "/",
//     element: <App />,
//   },
//   {
//     path: "/demo",
//     element: <Demo />,
//   },
//   {
//     path: "/demopeer",
//     element: <DemoPeer />,
//   },
// ]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* <HashRouter>
      <Demo />
    </HashRouter> */}

    {/* <RouterProvider router={router} /> */}
    <App />
  </React.StrictMode>,
);
