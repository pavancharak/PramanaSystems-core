import { useState } from "react";
import { NavBar } from "./components/NavBar.tsx";
import { SettingsPanel } from "./components/SettingsPanel.tsx";
import { HealthPage }   from "./pages/HealthPage.tsx";
import { ExecutePage }  from "./pages/ExecutePage.tsx";
import { VerifyPage }   from "./pages/VerifyPage.tsx";
import { RuntimePage }  from "./pages/RuntimePage.tsx";
import { AuditPage }    from "./pages/AuditPage.tsx";
import { AppContext }   from "./lib/ctx.ts";
import type { Page, Settings } from "./lib/ctx.ts";
import { getBaseUrl, getApiKey } from "./lib/storage.ts";

export default function App() {
  const [page, setPage]             = useState<Page>("health");
  const [settings, setSettings]     = useState<Settings>({
    baseUrl: getBaseUrl(),
    apiKey:  getApiKey(),
  });
  const [lastAttestation, setLastAttestation] = useState("");
  const [settingsOpen, setSettingsOpen]       = useState(false);

  const PAGES: Record<Page, JSX.Element> = {
    health:  <HealthPage />,
    execute: <ExecutePage />,
    verify:  <VerifyPage />,
    runtime: <RuntimePage />,
    audit:   <AuditPage />,
  };

  return (
    <AppContext.Provider value={{
      page, setPage,
      settings, setSettings,
      lastAttestation, setLastAttestation,
      settingsOpen, setSettingsOpen,
    }}>
      <div className="min-h-screen bg-slate-950">
        <NavBar />
        <SettingsPanel />

        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          {PAGES[page]}
        </main>
      </div>
    </AppContext.Provider>
  );
}
