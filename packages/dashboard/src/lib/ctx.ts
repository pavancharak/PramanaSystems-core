import { createContext, useContext } from "react";

export type Page = "health" | "execute" | "verify" | "runtime" | "audit";

export interface Settings {
  baseUrl: string;
  apiKey: string;
}

export interface AppContextValue {
  page: Page;
  setPage: (p: Page) => void;
  settings: Settings;
  setSettings: (s: Settings) => void;
  /** The last ExecutionAttestation JSON string produced by the Execute page */
  lastAttestation: string;
  setLastAttestation: (v: string) => void;
  settingsOpen: boolean;
  setSettingsOpen: (v: boolean) => void;
}

export const AppContext = createContext<AppContextValue>(null!);
export const useApp = () => useContext(AppContext);
