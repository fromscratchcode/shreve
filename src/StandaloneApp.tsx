import { lazy, Suspense, useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronDown,
  faChevronUp,
  faMoon,
  faSun,
} from "@fortawesome/free-solid-svg-icons";

import ScriptWorkspace from "./ScriptWorkspace";
import "./standalone.css";

const getInitialDarkMode = (): boolean =>
  window.matchMedia("(prefers-color-scheme: dark)").matches;

const getInitialReplOpen = (): boolean => false;

const LazyTupelo = lazy(async () => {
  await import("@fromscratchcode/tupelo/tupelo.css");
  const module = await import("@fromscratchcode/tupelo");

  return { default: module.Tupelo };
});

const StandaloneApp = () => {
  const [darkMode, setDarkMode] = useState(getInitialDarkMode);
  const [replOpen, setReplOpen] = useState(getInitialReplOpen);
  const [hasOpenedRepl, setHasOpenedRepl] = useState(getInitialReplOpen);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (event: MediaQueryListEvent) =>
      setDarkMode(event.matches);

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (replOpen) {
      setHasOpenedRepl(true);
    }
  }, [replOpen]);

  return (
    <div className={`standaloneShell ${darkMode ? "standaloneShellDark" : ""}`}>
      <div className="standaloneToolbar">
        <div className="standaloneBrand">
          <h1 className="standaloneTitle">Memphis Playground</h1>
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
        <div
          className={`standaloneWorkspaceShell ${
            replOpen ? "standaloneWorkspaceShellReplOpen" : ""
          }`}
        >
          <div className="standalonePrimaryWorkspace">
            <ScriptWorkspace darkMode={darkMode} />
          </div>
          <section
            className={`standaloneReplPane ${
              replOpen ? "standaloneReplPaneOpen" : "standaloneReplPaneClosed"
            }`}
            aria-label="Interactive Prompt"
          >
            <button
              type="button"
              className="standaloneReplToggle"
              onClick={() => setReplOpen((current) => !current)}
              aria-expanded={replOpen}
              aria-controls="standalone-repl-content"
            >
              <span className="standaloneReplTitle">Interactive Prompt</span>
              <span className="standaloneReplToggleLabel">
                {replOpen ? "Minimize" : "Open"}
              </span>
              <FontAwesomeIcon
                icon={replOpen ? faChevronDown : faChevronUp}
                className="standaloneReplToggleIcon"
                aria-hidden="true"
              />
            </button>
            <div
              id="standalone-repl-content"
              className="standaloneReplContent"
              hidden={!replOpen}
            >
              <div className="standaloneReplBody">
                {hasOpenedRepl ? (
                  <Suspense
                    fallback={
                      <div className="standaloneReplLoading">
                        Loading interactive prompt...
                      </div>
                    }
                  >
                    <LazyTupelo className="standaloneTupelo" />
                  </Suspense>
                ) : null}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default StandaloneApp;
