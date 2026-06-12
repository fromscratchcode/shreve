import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlay } from "@fortawesome/free-solid-svg-icons";
import { useState, type CSSProperties } from "react";

import CodeEditor from "./CodeEditor";
import Console from "./Console";
import { useMemphisRunner } from "./hooks/useMemphisRunner";
import { encodeCode } from "./urlState";
import styles from "./MemphisEmbed.module.css";

export interface MemphisEmbedProps {
  initialCode: string;
  className?: string;
  style?: CSSProperties;
}

const MemphisEmbed = ({ initialCode, className, style }: MemphisEmbedProps) => {
  const { code, setCode, consoleOutput, run } = useMemphisRunner({
    initialCode,
  });
  const [hasRun, setHasRun] = useState(false);
  const playgroundURL = `https://memphis.fromscratchcode.com?code=${encodeCode(code)}`;

  const handleRun = async () => {
    setHasRun(true);
    await run();
  };

  return (
    <section
      className={[styles.inlineRunner, className].filter(Boolean).join(" ")}
      style={style}
    >
      <div className={styles.editorPanel}>
        <button
          type="button"
          className={styles.runButton}
          onClick={() => void handleRun()}
        >
          <FontAwesomeIcon
            icon={faPlay}
            className={styles.buttonIcon}
            aria-hidden="true"
          />
          Run
        </button>
        <div className={styles.editorSurface}>
          <CodeEditor
            code={code}
            setCode={setCode}
            darkMode={false}
            autoHeight
          />
        </div>
      </div>
      {hasRun && (
        <div className={styles.consolePanel}>
          <Console output={consoleOutput} darkMode={false} />
        </div>
      )}
      <div className={styles.footer}>
        <a className={styles.playgroundLink} href={playgroundURL}>
          Open in Memphis Playground
        </a>
      </div>
    </section>
  );
};

export default MemphisEmbed;
