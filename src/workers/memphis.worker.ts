import { getMemphis } from "@fromscratchcode/memphis-js";
import { createInputWaiter } from "./input-channel";

type WorkerRequest =
  | { type: "init"; inputBuffer: SharedArrayBuffer }
  | { type: "run"; runId: number; code: string };

export type WorkerResponse =
  | { type: "stdout"; runId: number; chunk: string }
  | { type: "stderr"; runId: number; chunk: string }
  | { type: "input_request"; runId: number; prompt: string }
  | { type: "complete"; runId: number; hadOutput: boolean }
  | { type: "error"; runId: number; message: string };

let input: ReturnType<typeof createInputWaiter>;

// Do an eager load, to hide the Wasm init time that we'd otherwise incur on the first run.
const memphisPromise = getMemphis();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === "init") {
    input = createInputWaiter(event.data.inputBuffer);
    return;
  }

  if (event.data.type !== "run") return;
  if (!input) {
    throw new Error("Worker was initialized without an input channel.");
  }
  const { runId, code } = event.data;

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
      onInput: (prompt: string) => {
        input.beginRequest();
        postMessage({
          type: "input_request",
          runId,
          prompt,
        } satisfies WorkerResponse);
        return input.waitForResponse();
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
