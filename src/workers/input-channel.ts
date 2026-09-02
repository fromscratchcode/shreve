const INPUT_STATE_INDEX = 0;
const INPUT_LENGTH_INDEX = 1;

const InputState = {
  Waiting: 0,
  Ready: 1,
  Eof: 2,
} as const;

const INPUT_CONTROL_WORDS = 2;
const INPUT_CONTROL_BYTES = INPUT_CONTROL_WORDS * Int32Array.BYTES_PER_ELEMENT;

function createInputViews(inputBuffer: SharedArrayBuffer) {
  return {
    control: new Int32Array(inputBuffer, 0, INPUT_CONTROL_WORDS),
    bytes: new Uint8Array(inputBuffer, INPUT_CONTROL_BYTES),
  };
}

export function createInputResponder(maxBytes: number) {
  // First 8 bytes: two Int32s. Remaining bytes: UTF-8 input.
  const buffer = new SharedArrayBuffer(INPUT_CONTROL_BYTES + maxBytes);
  const { control, bytes } = createInputViews(buffer);
  const encoder = new TextEncoder();

  return {
    buffer,
    respond(value: string | null) {
      if (value === null) {
        Atomics.store(control, INPUT_STATE_INDEX, InputState.Eof);
      } else {
        const encoded = encoder.encode(value);

        if (encoded.length > bytes.length) {
          throw new Error("Input line is too long");
        }

        bytes.set(encoded);
        Atomics.store(control, INPUT_LENGTH_INDEX, encoded.length);
        Atomics.store(control, INPUT_STATE_INDEX, InputState.Ready);
      }

      // Notify only 1 worker
      Atomics.notify(control, INPUT_STATE_INDEX, 1);
    },
  };
}

export function createInputWaiter(buffer: SharedArrayBuffer) {
  const { control, bytes } = createInputViews(buffer);
  const decoder = new TextDecoder();

  return {
    beginRequest() {
      // Set this before posting, so the main thread cannot reply too early.
      Atomics.store(control, INPUT_STATE_INDEX, InputState.Waiting);
      Atomics.store(control, INPUT_LENGTH_INDEX, 0);
    },
    waitForResponse(): string | null {
      // Blocks the worker and wait for the render thread
      Atomics.wait(control, INPUT_STATE_INDEX, InputState.Waiting);

      const state = Atomics.load(control, INPUT_STATE_INDEX);

      if (state === InputState.Eof) {
        return null;
      }

      if (state !== InputState.Ready) {
        throw new Error("Input channel entered an unexpected state.");
      }

      const length = Atomics.load(control, INPUT_LENGTH_INDEX);
      const input = new Uint8Array(length);
      // copy the bytes into an ordary ArrayBuffer, keeping the SharedArrayBuffer for
      // worker synchronization only
      input.set(bytes.subarray(0, length));
      return decoder.decode(input);
    },
  };
}
