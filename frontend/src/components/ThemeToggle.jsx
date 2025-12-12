import React from "react";
import { useAppContext } from "../App";

const GLOBAL_FONT = 'Poppins, sans-serif';

const toogleThemeStyle = {
  padding: "8px 15px",
  borderRadius: "20px",
  border: "1px solid var(--border-color)",
  background: "var(--toggle-botton-bg)",
  color: "var(--accent-text)",
  cursor: "pointer",
  fontFamily: GLOBAL_FONT,
};

function ThemeToggle() {
  const { theme, toggleTheme } = useAppContext();

  return (
    <button onClick={toggleTheme} style={toogleThemeStyle}>
      {theme === "light" ? "🌙 Dark" : "☀️ Light"}
    </button>
  );
}

export default ThemeToggle;
