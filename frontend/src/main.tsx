import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { AddJobModal } from "./components/AddJobModal";
import { Board } from "./components/Board";
import { Dashboard } from "./components/Dashboard";
import "./styles.css";

const client = new QueryClient();

type Tab = "kanban" | "dashboard";

function App() {
  const [showAdd, setShowAdd] = useState(false);
  const [tab, setTab] = useState<Tab>("kanban");

  return (
    <>
      <header className="app-header">
        <div className="header-brand">
          <img className="header-logo" src="/logo.png" alt="JobTrack" />
          <div>
            <h1>JobTrack</h1>
            <p className="header-sub">Your application pipeline</p>
          </div>
        </div>
        <div className="header-tabs">
          <button
            className={`tab-btn ${tab === "kanban" ? "active" : ""}`}
            onClick={() => setTab("kanban")}
          >
            Kanban
          </button>
          <button
            className={`tab-btn ${tab === "dashboard" ? "active" : ""}`}
            onClick={() => setTab("dashboard")}
          >
            Dashboard
          </button>
        </div>
        <button className="add-job-btn" onClick={() => setShowAdd(true)}>
          <span className="add-icon">+</span> Add Job
        </button>
      </header>
      <main>
        {tab === "kanban" ? <Board /> : <Dashboard />}
      </main>
      {showAdd && <AddJobModal onClose={() => setShowAdd(false)} />}
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={client}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
