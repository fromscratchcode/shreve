import { useEffect, useState } from "react";

import { getMemphis, hasMemphis } from "../memphis";

interface UseMemphisRunnerOptions {
  initialCode: string;
  initialConsoleOutput?: string;
}

interface UseMemphisRunnerResult {
  code: string;
  setCode: (code: string) => void;
  consoleOutput: string;
  run: () => Promise<void>;
}

export const useMemphisRunner = ({
  initialCode,
  initialConsoleOutput = "Console output will appear here.",
}: UseMemphisRunnerOptions): UseMemphisRunnerResult => {
  const [code, setCode] = useState(initialCode);
  const [consoleOutput, setConsoleOutput] = useState(initialConsoleOutput);

  useEffect(() => {
    void getMemphis();
  }, []);

  const run = async () => {
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

  return {
    code,
    setCode,
    consoleOutput,
    run,
  };
};
