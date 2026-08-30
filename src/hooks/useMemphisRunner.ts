import { useEffect, useState, useRef } from "react";

import MemphisWorker from "../workers/memphis.worker?worker";

interface UseMemphisRunnerOptions {
  initialCode: string;
  initialConsoleOutput?: string;
}

interface UseMemphisRunnerResult {
  code: string;
  setCode: (code: string) => void;
  consoleOutput: string;
  run: () => void;
}

export const useMemphisRunner = ({
  initialCode,
  initialConsoleOutput = "Console output will appear here.",
}: UseMemphisRunnerOptions): UseMemphisRunnerResult => {
  const [code, setCode] = useState(initialCode);
  const [consoleOutput, setConsoleOutput] = useState(initialConsoleOutput);
  const workerRef = useRef<Worker | null>(null);
  const latestRunIdRef = useRef(0);

  useEffect(() => {
    const worker = new MemphisWorker();
    workerRef.current = worker;

    worker.onmessage = (event) => {
      const message = event.data;

      if (message.runId !== latestRunIdRef.current) return;

      if (message.type === "stdout" || message.type === "stderr") {
        setConsoleOutput((current) => current + message.chunk);
        return;
      }

      if (message.type === "complete" && !message.hadOutput) {
        setConsoleOutput("Program completed with no output.");
        return;
      }

      if (message.type === "error") {
        setConsoleOutput((current) => current + message.message);
        return;
      }
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const run = () => {
    const worker = workerRef.current;

    if (!worker) {
      throw new Error("Memphis worker is unavailable.");
    }

    const runId = ++latestRunIdRef.current;
    setConsoleOutput("");

    worker.postMessage({
      type: "run",
      runId,
      code,
    });
  };

  return {
    code,
    setCode,
    consoleOutput,
    run,
  };
};
