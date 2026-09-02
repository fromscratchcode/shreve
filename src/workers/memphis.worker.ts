import { getMemphis } from "@fromscratchcode/memphis-js";

type WorkerRequest =
  | { type: "init"; inputBuffer: SharedArrayBuffer }
  | { type: "run"; runId: number; code: string };

export type WorkerResponse =
  | { type: "stdout"; runId: number; chunk: string }
  | { type: "stderr"; runId: number; chunk: string }
  | { type: "input_request"; runId: number; prompt: string }
  | { type: "complete"; runId: number; hadOutput: boolean }
  | { type: "error"; runId: number; message: string };

export const INPUT_STATE_INDEX = 0;
export const INPUT_LENGTH_INDEX = 1;

export const InputState = {
  Waiting: 0,
  Ready: 1,
  Eof: 2,
} as const;

const INPUT_CONTROL_WORDS = 2;
const INPUT_CONTROL_BYTES = INPUT_CONTROL_WORDS * Int32Array.BYTES_PER_ELEMENT;

export function createInputViews(inputBuffer: SharedArrayBuffer) {
  return {
    control: new Int32Array(inputBuffer, 0, INPUT_CONTROL_WORDS),
    bytes: new Uint8Array(inputBuffer, INPUT_CONTROL_BYTES),
  };
}

let inputBuffer: SharedArrayBuffer | undefined;
let onInput: ((runId: number, prompt: string) => string | null) | undefined;
const decoder = new TextDecoder();

// Do an eager load, to hide the Wasm init time that we'd otherwise incur on the first run.
const memphisPromise = getMemphis();

self.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type === "init") {
    inputBuffer = event.data.inputBuffer;
    const { control, bytes } = createInputViews(inputBuffer);

    onInput = (runId: number, prompt: string): string | null => {
      // Set this before posting, so the main thread cannot reply too early.
      Atomics.store(control, INPUT_STATE_INDEX, InputState.Waiting);
      Atomics.store(control, INPUT_LENGTH_INDEX, 0);

      postMessage({
        type: "input_request",
        runId,
        prompt,
      } satisfies WorkerResponse);

      // Blocks the worker and wait for the render thread
      Atomics.wait(control, INPUT_STATE_INDEX, InputState.Waiting);

      const state = Atomics.load(control, INPUT_STATE_INDEX);

      if (state === InputState.Waiting) {
        return null;
      }

      const length = Atomics.load(control, INPUT_LENGTH_INDEX);
      const input = new Uint8Array(length);
      // copy the bytes into an ordary ArrayBuffer, keeping the SharedArrayBuffer for
      // worker synchronization only
      input.set(bytes.subarray(0, length));
      return decoder.decode(input);
    };

    return;
  }

  if (event.data.type !== "run") return;
  if (!inputBuffer || !onInput) {
    throw new Error("Worker was initialized without an input buffer.");
  }
  const requestInput = onInput;
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
      onInput: (prompt: string) => requestInput(runId, prompt),
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
