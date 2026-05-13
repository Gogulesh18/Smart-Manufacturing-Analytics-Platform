import React from "react";
import ReactDOM from "react-dom/client";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#4f8cff" },
    secondary: { main: "#00c2a8" },
    background: { default: "#0b1020", paper: "#131a2f" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "Inter, Segoe UI, Roboto, Arial, sans-serif",
    h4: { fontWeight: 700 },
  },
});

ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <App />
    </ThemeProvider>
  </React.StrictMode>
);

