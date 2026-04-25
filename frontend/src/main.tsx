import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { AddJobModal } from "./components/AddJobModal";
import { Board } from "./components/Board";
import "./styles.css";

const client = new QueryClient();

function App() {
  const [showAdd, setShowAdd] = useState(false);

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
        <button className="add-job-btn" onClick={() => setShowAdd(true)}>
          <span className="add-icon">+</span> Add Job
        </button>
      </header>
      <main>
        <Board />
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
