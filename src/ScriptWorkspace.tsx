import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUpRightFromSquare,
  faCheck,
  faLink,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";

import "./App.css";
import CodeEditor from "./CodeEditor";
import Console from "./Console";
import { getMemphis, hasMemphis } from "./memphis";
import { encodeCode, getCodeFromURL, setCodeInURL } from "./urlState";

const DEFAULT_CODE = `def greet(name):
    print(f"hello, {name}")

greet("memphis")
`;

const getInitialCode = (): string =>
  typeof window === "undefined"
    ? DEFAULT_CODE
    : getCodeFromURL() || DEFAULT_CODE;

interface ScriptWorkspaceProps {
  darkMode: boolean;
}

type CopyState = "idle" | "copied" | "error";

const ScriptWorkspace = ({ darkMode }: ScriptWorkspaceProps) => {
  const [code, setCode] = useState(getInitialCode);
  const [consoleOutput, setConsoleOutput] = useState(
    "Console output will appear here.",
  );
  const [copyState, setCopyState] = useState<CopyState>("idle");

  useEffect(() => {
    void getMemphis();
  }, []);

  useEffect(() => {
    setCodeInURL(code);
  }, [code]);

  useEffect(() => {
    if (copyState !== "copied") {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      setCopyState("idle");
    }, 1800);

    return () => window.clearTimeout(timeoutId);
  }, [copyState]);

  const handleRun = async () => {
    if (!hasMemphis()) {
      setConsoleOutput("Initializing Memphis...");
    }

    try {
      const memphis = await getMemphis();
      const output = memphis.run(code);
      setConsoleOutput(output || "Program completed with no output.");
    } catch (error) {
      setConsoleOutput(
        error instanceof Error ? error.message : "Failed to run Memphis.",
      );
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyState("copied");
    } catch {
      setCopyState("error");
    }
  };

  const inspectURL = `https://fromscratchcode.com/ozark?code=${encodeCode(code)}`;

  return (
    <div className="workspace">
      <section className="column editorColumn">
        <div className={`editorPanel ${darkMode ? "editorPanelDark" : ""}`}>
          <div className="editorToolbar">
            <div className="toolbarIdentity">
              <h2 className="panelTitle">main.py</h2>
              <button
                type="button"
                className="utilityButton"
                onClick={() => void handleCopyLink()}
                aria-label={
                  copyState === "copied" ? "Link copied" : "Copy link"
                }
                title={copyState === "copied" ? "Link copied" : "Copy link"}
              >
                <FontAwesomeIcon
                  icon={copyState === "copied" ? faCheck : faLink}
                  className="buttonIcon"
                  aria-hidden="true"
                />
              </button>
            </div>
            <div className="toolbarActions">
              <a className="inspectButton" href={inspectURL}>
                <FontAwesomeIcon
                  icon={faArrowUpRightFromSquare}
                  className="buttonIcon"
                  aria-hidden="true"
                />
                Inspect
              </a>
              <button
                type="button"
                className="runButton"
                onClick={() => void handleRun()}
              >
                <FontAwesomeIcon
                  icon={faPlay}
                  className="buttonIcon"
                  aria-hidden="true"
                />
                Run
              </button>
            </div>
          </div>
          {copyState === "error" && (
            <div className="copyError">Unable to copy the share link.</div>
          )}
          <div className="editorSurface">
            <CodeEditor code={code} setCode={setCode} darkMode={darkMode} />
          </div>
        </div>
      </section>
      <section className="column consoleColumn">
        <div className="consolePanel">
          <h2 className="consoleHeader">Console</h2>
          <Console output={consoleOutput} darkMode={darkMode} />
        </div>
      </section>
    </div>
  );
};

export default ScriptWorkspace;
