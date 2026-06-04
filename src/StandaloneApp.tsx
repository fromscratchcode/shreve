import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMoon, faSun } from "@fortawesome/free-solid-svg-icons";

import ScriptWorkspace from "./ScriptWorkspace";
import "./standalone.css";

const getInitialDarkMode = (): boolean =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const StandaloneApp = () => {
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
    <div className={`standaloneShell ${darkMode ? "standaloneShellDark" : ""}`}>
      <div className="standaloneToolbar">
        <div className="standaloneBrand">
          <h1 className="standaloneTitle">Shreve</h1>
          <a
            className="standaloneLearnMore"
            href="https://fromscratchcode.com/memphis/"
          >
            Learn more
          </a>
        </div>
        <button
          type="button"
          className="themeToggle"
          onClick={() => setDarkMode((current) => !current)}
        >
          <FontAwesomeIcon
            icon={darkMode ? faSun : faMoon}
            className="themeToggleIcon"
            aria-hidden="true"
          />
        </button>
      </div>
      <div className="standaloneAppFrame">
        <ScriptWorkspace darkMode={darkMode} />
      </div>
    </div>
  );
};

export default StandaloneApp;
