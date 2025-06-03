import { createRoot } from "react-dom/client";
import TestAuth from "./TestAuth";
import "./index.css";
import { StrictMode } from "react";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <TestAuth />
  </StrictMode>
);
