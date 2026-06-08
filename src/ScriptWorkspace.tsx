import { useEffect, useState } from "react";

import "./App.css";
import CodeEditor from "./CodeEditor";
import Console from "./Console";
import { getMemphis, hasMemphis } from "./memphis";

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

  useEffect(() => {
    void getMemphis();
  }, []);

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

  return (
    <div className="workspace">
      <section className="column editorColumn">
        <div className={`editorPanel ${darkMode ? "editorPanelDark" : ""}`}>
          <div className="editorToolbar">
            <h2 className="panelTitle">main.py</h2>
            <button
              type="button"
              className="runButton"
              onClick={() => void handleRun()}
            >
              Run
            </button>
          </div>
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
