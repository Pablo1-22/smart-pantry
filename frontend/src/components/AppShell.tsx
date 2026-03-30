import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import { SyncProvider } from "../context/SyncContext";

export default function AppShell() {
  return (
    <SyncProvider>
      <div className="app-shell">
        <Topbar />
        <div className="app-content">
          <Outlet />
        </div>
      </div>
    </SyncProvider>
  );
}
