import styles from "./Console.module.css";

interface ConsoleProps {
  error: string;
  darkMode?: boolean;
}

const Console = ({ error, darkMode = false }: ConsoleProps) => {
  return (
    <div className={`${styles.consoleBox} ${darkMode ? styles.darkMode : ""}`}>
      <pre className={styles.consoleOutput}>{error || "Success!"}</pre>
    </div>
  );
};

export default Console;
