import React, { createContext, useContext, useState, useEffect } from 'react';

// Theme definitions
const themeDark = {
  name: "dark",
  GOLD: "#C9A84C",
  GOLD_BRIGHT: "#FFD700",
  GOLD_24K: "#FFD700",   // Real 24 carat gold — RGB(255, 215, 0)
  GOLD_18K: "#E6BE8A",   // Real 18 carat gold — RGB(230, 190, 138)
  GOLD_DARK: "#8B6914",
  GOLD_PALE: "#F5E9C8",
  BG: "#0B0D11",
  SURFACE: "#13161D",
  SURFACE2: "#1A1E28",
  BORDER: "#2A2D3A",
  TEXT: "#E8E0D0",
  TEXT_DIM: "#8A8070",
  // Core Functional Colors - Dark Theme
  SUCCESS: "#4ECDC4",
  SUCCESS_BG: "rgba(78,205,196,0.12)",
  WARNING: "#F5A623",
  WARNING_BG: "rgba(245,166,35,0.12)",
  DANGER: "#FF4444",
  DANGER_BG: "rgba(255,68,68,0.12)",
  INFO: "#4A9EFF",
  INFO_BG: "rgba(74,158,255,0.12)",
};

const themeLight = {
  name: "light",
  GOLD: "#B68B35",
  GOLD_BRIGHT: "#D4AF37",
  GOLD_24K: "#DAA520",   // Deeper 24K for white background contrast
  GOLD_18K: "#C4975C",   // Deeper 18K for white background contrast
  GOLD_DARK: "#795B12",
  GOLD_PALE: "#F5E9C8",
  BG: "#FAFAFA",
  SURFACE: "#FFFFFF",
  SURFACE2: "#F0F0F0",
  BORDER: "#E0E0E0",
  TEXT: "#111111",
  TEXT_DIM: "#666666",
  // Core Functional Colors - Light Theme
  SUCCESS: "#2B9890", // Darker teal for accessible contrast against white
  SUCCESS_BG: "rgba(43,152,144,0.1)",
  WARNING: "#D97706", // Darker amber for contrast
  WARNING_BG: "rgba(217,119,6,0.1)",
  DANGER: "#DC2626", // Deeper red for contrast
  DANGER_BG: "rgba(220,38,38,0.1)",
  INFO: "#2563EB", // Deeper blue for contrast
  INFO_BG: "rgba(37,99,235,0.1)",
};

const ThemeContext = createContext({
  ...themeDark,
  toggleTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [themeName, setThemeName] = useState("dark"); // Default to black and gold

  useEffect(() => {
    // Add class to body for global CSS targeting
    document.body.className = `theme-${themeName}`;
  }, [themeName]);

  const toggleTheme = () => {
    setThemeName(prev => (prev === "dark" ? "light" : "dark"));
  };

  const currentTheme = themeName === "dark" ? themeDark : themeLight;

  return (
    <ThemeContext.Provider value={{ ...currentTheme, toggleTheme, themeName }}>
      {children}
    </ThemeContext.Provider>
  );
};
