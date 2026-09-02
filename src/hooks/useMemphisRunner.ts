import { useEffect, useState, useRef } from "react";

import MemphisWorker from "../workers/memphis.worker?worker";
import type { WorkerResponse } from "../workers/memphis.worker";
import { createInputResponder } from "../workers/input-channel";

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

const MAX_INPUT_BYTES = 16 * 1024;

export const useMemphisRunner = ({
  initialCode,
  initialConsoleOutput = "Console output will appear here.",
}: UseMemphisRunnerOptions): UseMemphisRunnerResult => {
  const [code, setCode] = useState(initialCode);
  const [consoleOutput, setConsoleOutput] = useState(initialConsoleOutput);
  const workerRef = useRef<Worker | null>(null);
  const workerFailureRef = useRef<string | null>(null);
  const latestRunIdRef = useRef(0);

  useEffect(() => {
    const worker = new MemphisWorker();
    workerRef.current = worker;

    const input = createInputResponder(MAX_INPUT_BYTES);
    worker.postMessage({
      type: "init",
      inputBuffer: input.buffer,
    });

    worker.onerror = (event) => {
      console.error("Memphis worker failed.", event);

      workerFailureRef.current = event.message
        ? `Memphis worker failed: ${event.message}`
        : "Memphis worker failed to load or execute.";
    };

    worker.onmessage = (event) => {
      const message: WorkerResponse = event.data;

      if (message.runId !== latestRunIdRef.current) return;

      if (message.type === "stdout" || message.type === "stderr") {
        setConsoleOutput((current) => current + message.chunk);
        return;
      }

      if (message.type === "input_request") {
        const value = window.prompt(message.prompt);
        input.respond(value);
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
      // This can only happen due to a developer error, `worker` should always be available here.
      throw new Error("Memphis worker is unavailable.");
    }

    // This can happen if the worker fails to load (invalid URL, etc).
    const failure = workerFailureRef.current;
    if (failure) {
      setConsoleOutput(failure);
      return;
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
