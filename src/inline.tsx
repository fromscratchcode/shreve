import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";
import "./index.css";
import "./standalone.css";
import MemphisEmbed from "./MemphisEmbed";

const DEFAULT_CODE = `def greet(name):
    print(f"hello, {name}")

greet("memphis")`;

const getInitialDarkMode = (): boolean =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const InlineApp = () => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) =>
      setDarkMode(event.matches);

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "1.5rem",
        background: darkMode ? "#141c24" : "#f4f7fb",
        color: darkMode ? "#f3f6fa" : "#102a43",
      }}
    >
      <div
        style={{
          width: "min(100%, 56rem)",
          margin: "0 auto",
          display: "grid",
          gap: "1rem",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
          }}
        >
          <button
            type="button"
            className="themeToggle"
            onClick={() => setDarkMode((current) => !current)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            <FontAwesomeIcon
              icon={darkMode ? faSun : faMoon}
              className="themeToggleIcon"
              aria-hidden="true"
            />
          </button>
        </div>
        <MemphisEmbed initialCode={DEFAULT_CODE} darkMode={darkMode} />
      </div>
    </main>
  );
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <InlineApp />
  </StrictMode>,
);
