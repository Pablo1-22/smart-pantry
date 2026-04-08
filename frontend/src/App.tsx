import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DashboardPage from "./pages/DashboardPage";
import PantryPage from "./pages/PantryPage";
import AddProductPage from "./pages/AddProductPage";
import ShoppingListPage from "./pages/ShoppingListPage";

export default function App() {
  return (
    <ErrorBoundary>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public — auth pages (full screen) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected — app shell with topbar */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<DashboardPage />} />
            <Route path="/pantries/:pantryId" element={<PantryPage />} />
            <Route
              path="/pantries/:pantryId/products/new"
              element={<AddProductPage />}
            />
            <Route
              path="/pantries/:pantryId/shopping-list"
              element={<ShoppingListPage />}
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
    </ErrorBoundary>
  );
}
