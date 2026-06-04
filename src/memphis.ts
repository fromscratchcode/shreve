import init, { compile, lex, parse, run } from "../pkg/memphis.js";

export interface Memphis {
  compile(code: string): unknown;
  lex(code: string): unknown;
  parse(code: string): unknown;
  run(code: string): string;
}

let memphisPromise: Promise<Memphis> | null = null;
let memphis: Memphis | null = null;

const createMemphis = async (): Promise<Memphis> => {
  try {
    await init();
  } catch {
    throw new Error("Failed to initialize Memphis.");
  }

  return {
    compile,
    lex,
    parse,
    run,
  };
};

export const hasMemphis = (): boolean => memphis !== null;

export const getMemphis = (): Promise<Memphis> => {
  if (memphis) {
    return Promise.resolve(memphis);
  }

  if (!memphisPromise) {
    memphisPromise = createMemphis()
      .then((instance) => {
        memphis = instance;
        return instance;
      })
      .catch((error: unknown) => {
        memphisPromise = null;
        throw error;
      });
  }

  return memphisPromise;
};
