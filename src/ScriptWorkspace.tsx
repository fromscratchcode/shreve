import { useState } from "react";

import "./App.css";
import CodeEditor from "./CodeEditor";
import Console from "./Console";

const DEFAULT_CODE = `def greet(name):
    print(f"hello, {name}")

greet("memphis")
`;

interface ScriptWorkspaceProps {
  darkMode: boolean;
}

const ScriptWorkspace = ({ darkMode }: ScriptWorkspaceProps) => {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [consoleOutput, setConsoleOutput] = useState(
    "Console output will appear here.",
  );

  const handleRun = () => {
    setConsoleOutput(
      [
        "Run requested.",
        "Wasm execution hook not connected yet.",
        "",
        "Current source:",
        code,
      ].join("\n"),
    );
  };

  return (
    <div className="workspace">
      <section className="column">
        <div className={`editorPanel ${darkMode ? "editorPanelDark" : ""}`}>
          <div className="editorToolbar">
            <h2 className="panelTitle">Script</h2>
            <button type="button" className="runButton" onClick={handleRun}>
              Run
            </button>
          </div>
          <div className="editorSurface">
            <CodeEditor code={code} setCode={setCode} darkMode={darkMode} />
          </div>
        </div>
      </section>
      <section className="column">
        <div className="consolePanel">
          <h2 className="consoleHeader">Console</h2>
          <Console error={consoleOutput} darkMode={darkMode} />
        </div>
      </section>
    </div>
  );
};

export default ScriptWorkspace;
