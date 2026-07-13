import { useEffect, useState, useRef } from "react";

import { getMemphis } from "@fromscratchcode/memphis-js";

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
  const isMemphisReadyRef = useRef(false);

  useEffect(() => {
    void getMemphis()
      .then(() => {
        isMemphisReadyRef.current = true;
      })
      .catch(() => {
        // Leave ref false so run still retries
      });
  }, []);

  const run = async () => {
    if (!isMemphisReadyRef.current) {
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
