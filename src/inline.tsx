import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import MemphisEmbed from "./MemphisEmbed";

const DEFAULT_CODE = `def greet(name):
    print(f"hello, {name}")

greet("memphis")`;

const InlineApp = () => (
  <main
    style={{
      minHeight: "100vh",
      padding: "1.5rem",
      background: "#f4f7fb",
      color: "#102a43",
      display: "grid",
      placeItems: "center",
    }}
  >
    <MemphisEmbed initialCode={DEFAULT_CODE} />
  </main>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InlineApp />
  </StrictMode>,
);
