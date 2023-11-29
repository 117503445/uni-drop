import React from "react";
import ReactDOM from "react-dom/client";
import App from "./views/App.tsx";

import { store } from "./store/store.tsx";
import { Provider } from "react-redux";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("root element not found");
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);
