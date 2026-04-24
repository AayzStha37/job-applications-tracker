import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Board } from "./components/Board";
import "./styles.css";

const client = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <header className="app-header">
        <h1>Job Applications</h1>
      </header>
      <main>
        <Board />
      </main>
    </QueryClientProvider>
  </StrictMode>,
);
