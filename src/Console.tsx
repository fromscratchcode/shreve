import { useEffect, useRef } from "react";

import styles from "./Console.module.css";

interface ConsoleProps {
  output: string;
  darkMode?: boolean;
}

const Console = ({ output, darkMode = false }: ConsoleProps) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    container.scrollTop = container.scrollHeight;
  }, [output]);

  return (
    <div
      ref={containerRef}
      className={`${styles.consoleBox} ${darkMode ? styles.darkMode : ""}`}
    >
      <pre className={styles.consoleOutput}>{output || "Success!"}</pre>
    </div>
  );
};

export default Console;
