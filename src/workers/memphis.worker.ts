import { getMemphis } from "@fromscratchcode/memphis-js";

type RunRequest = { type: "run"; runId: number; code: string };

type WorkerResponse =
  | { type: "stdout"; runId: number; chunk: string }
  | { type: "stderr"; runId: number; chunk: string }
  | { type: "complete"; runId: number; hadOutput: boolean }
  | { type: "error"; runId: number; message: string };

// Do an eager load, to hide the Wasm init time that we'd otherwise incur on the first run.
const memphisPromise = getMemphis();

self.onmessage = async (event: MessageEvent<RunRequest>) => {
  const { type, runId, code } = event.data;

  if (type !== "run") return;

  try {
    const memphis = await memphisPromise;
    let hadOutput = false;

    memphis.run(code, {
      onStdout: (chunk: string) => {
        hadOutput ||= chunk.length > 0;
        self.postMessage({
          type: "stdout",
          runId,
          chunk,
        } satisfies WorkerResponse);
      },
      onStderr: (chunk: string) => {
        hadOutput ||= chunk.length > 0;
        self.postMessage({
          type: "stderr",
          runId,
          chunk,
        } satisfies WorkerResponse);
      },
    });

    self.postMessage({
      type: "complete",
      runId,
      hadOutput,
    } satisfies WorkerResponse);
  } catch (error) {
    console.error(error);
    self.postMessage({
      type: "error",
      runId,
      message:
        error instanceof Error ? error.message : "Failed to run Memphis.",
    } satisfies WorkerResponse);
  }
};
