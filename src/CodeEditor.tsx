import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { indentWithTab } from "@codemirror/commands";
import { python } from "@codemirror/lang-python";
import {
  defaultHighlightStyle,
  syntaxHighlighting,
} from "@codemirror/language";
import { Compartment, EditorSelection, EditorState } from "@codemirror/state";
import { oneDarkHighlightStyle } from "@codemirror/theme-one-dark";
import {
  drawSelection,
  EditorView,
  highlightActiveLine,
  keymap,
  lineNumbers,
  placeholder,
} from "@codemirror/view";

import styles from "./EditorSurface.module.css";

interface CodeEditorProps {
  code: string;
  setCode: (code: string) => void;
  darkMode: boolean;
  autoHeight?: boolean;
}

const themeCompartment = new Compartment();
const highlightCompartment = new Compartment();
const wrappingCompartment = new Compartment();
const mobileViewportQuery = "(max-width: 768px)";

// Some consumers render this component during SSR/SSG before hydrating on the
// client. CodeMirror still needs to attach before the first client paint, but
// calling `useLayoutEffect` on the server triggers warnings and has no effect.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const createHighlightExtension = (darkMode: boolean) =>
  syntaxHighlighting(darkMode ? oneDarkHighlightStyle : defaultHighlightStyle);

const getInitialLineWrapping = (): boolean =>
  typeof window === "undefined"
    ? true
    : !window.matchMedia(mobileViewportQuery).matches;

const createWrappingExtension = (lineWrapping: boolean) =>
  lineWrapping ? EditorView.lineWrapping : [];

// Mobile virtual keyboards emit Enter through `beforeinput`, but they do not
// consistently use the same input type at line boundaries. Normalizing both
// paths here keeps Enter to a single newline on mobile.
const singleParagraphBreak = EditorView.domEventHandlers({
  beforeinput(event, view) {
    if (
      !(event instanceof InputEvent) ||
      (event.inputType !== "insertParagraph" &&
        event.inputType !== "insertLineBreak")
    ) {
      return false;
    }

    event.preventDefault();

    const change = view.state.changeByRange((range) => ({
      changes: { from: range.from, to: range.to, insert: "\n" },
      range: EditorSelection.cursor(range.from + 1),
    }));

    view.dispatch(change, {
      userEvent: "input",
    });

    return true;
  },
});

const createTheme = (darkMode: boolean, autoHeight: boolean) =>
  EditorView.theme(
    {
      "&": {
        height: autoHeight ? "auto" : "100%",
        background: "transparent",
        color: darkMode ? "#0184a6" : "#000",
      },
      ".cm-scroller": {
        overflow: "auto",
        fontFamily:
          '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace',
        lineHeight: "1.5",
      },
      ".cm-gutters": {
        minWidth: "3.5rem",
        borderRight: darkMode
          ? "1px solid rgba(1, 132, 166, 0.22)"
          : "1px solid rgba(4, 96, 189, 0.14)",
        background: darkMode
          ? "rgba(17, 24, 39, 0.5)"
          : "rgba(239, 246, 255, 0.72)",
        color: darkMode ? "#557c89" : "#6a7c90",
      },
      ".cm-gutter": {
        minWidth: "inherit",
      },
      ".cm-lineNumbers .cm-gutterElement": {
        padding: darkMode ? "0 0.5rem 0 0.75rem" : "0 0.625rem 0 0.75rem",
      },
      ".cm-content": {
        padding: "0.75rem 1rem",
        caretColor: darkMode ? "#8be9fd" : "var(--theme-dark-blue)",
      },
      ".cm-line": {
        padding: 0,
      },
      ".cm-cursor, .cm-dropCursor": {
        borderLeftColor: darkMode ? "#8be9fd" : "var(--theme-dark-blue)",
      },
      ".cm-selectionBackground, ::selection": {
        backgroundColor: darkMode
          ? "rgba(1, 132, 166, 0.28)"
          : "rgba(4, 96, 189, 0.18)",
      },
      ".cm-activeLine": {
        backgroundColor: darkMode
          ? "rgba(1, 132, 166, 0.08)"
          : "rgba(4, 96, 189, 0.05)",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "transparent",
      },
      ".cm-placeholder": {
        color: darkMode ? "#5f99a8" : "#666",
      },
      ".cm-focused": {
        outline: "none",
      },
    },
    { dark: darkMode },
  );

const CodeEditor = ({
  code,
  setCode,
  darkMode,
  autoHeight = false,
}: CodeEditorProps) => {
  const editorRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const initialThemeRef = useRef(createTheme(darkMode, autoHeight));
  const [lineWrapping, setLineWrapping] = useState(getInitialLineWrapping);

  useEffect(() => {
    const mediaQuery = window.matchMedia(mobileViewportQuery);
    const syncLineWrapping = (matches: boolean) => setLineWrapping(!matches);

    syncLineWrapping(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) =>
      syncLineWrapping(event.matches);

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!editorRef.current) {
      return undefined;
    }

    const startState = EditorState.create({
      doc: code,
      extensions: [
        lineNumbers(),
        drawSelection(),
        highlightActiveLine(),
        keymap.of([indentWithTab]),
        python(),
        wrappingCompartment.of(createWrappingExtension(lineWrapping)),
        singleParagraphBreak,
        placeholder("Enter Python code here"),
        themeCompartment.of(initialThemeRef.current),
        highlightCompartment.of(createHighlightExtension(darkMode)),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) {
            setCode(update.state.doc.toString());
          }
        }),
      ],
    });

    const view = new EditorView({
      state: startState,
      parent: editorRef.current,
    });

    viewRef.current = view;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
  }, [setCode]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    view.dispatch({
      effects: [
        themeCompartment.reconfigure(createTheme(darkMode, autoHeight)),
        highlightCompartment.reconfigure(createHighlightExtension(darkMode)),
        wrappingCompartment.reconfigure(createWrappingExtension(lineWrapping)),
      ],
    });
  }, [autoHeight, darkMode, lineWrapping]);

  useEffect(() => {
    const view = viewRef.current;

    if (!view) {
      return;
    }

    const currentCode = view.state.doc.toString();

    if (code === currentCode) {
      return;
    }

    view.dispatch({
      changes: {
        from: 0,
        to: currentCode.length,
        insert: code,
      },
    });
  }, [code]);

  return (
    <div
      ref={editorRef}
      className={`${styles.editor} ${autoHeight ? styles.autoHeight : ""}`}
    />
  );
};

export default CodeEditor;
