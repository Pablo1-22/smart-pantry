import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";

export default function AppShell() {
  return (
    <div className="app-shell">
      <Topbar />
      <div className="app-content">
        <Outlet />
      </div>
    </div>
  );
}
