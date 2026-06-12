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
        </div>
        <div className="standaloneUtilityActions">
          <button
            type="button"
            className={`standalonePromptButton ${
              replOpen ? "standalonePromptButtonActive" : ""
            }`}
            onClick={() => setReplOpen((current) => !current)}
            aria-expanded={replOpen}
            aria-controls="standalone-repl-content"
          >
            <span className="standalonePromptButtonText">Prompt</span>
            <FontAwesomeIcon
              icon={replOpen ? faChevronUp : faChevronDown}
              className="standalonePromptButtonIcon"
              aria-hidden="true"
            />
          </button>
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
      </div>
      <div className="standaloneAppFrame">
        <div className="standaloneWorkspaceShell">
          <div className="standalonePrimaryWorkspace">
            <ScriptWorkspace darkMode={darkMode} />
          </div>
        </div>
        <section
          className={`standaloneReplPane ${
            replOpen ? "standaloneReplPaneOpen" : "standaloneReplPaneClosed"
          }`}
          aria-label="Interactive Prompt"
          aria-hidden={!replOpen}
        >
          <div id="standalone-repl-content" className="standaloneReplContent">
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
      <footer className="standaloneFooter">
        <a className="standaloneBuiltBy" href="https://fromscratchcode.com/">
          Built by From Scratch Code
        </a>
        <a
          className="standaloneSupportLink"
          href="https://github.com/fromscratchcode/memphis/blob/main/docs/SUPPORTED.md"
        >
          What is supported?
        </a>
      </footer>
    </div>
  );
};

export default StandaloneApp;
