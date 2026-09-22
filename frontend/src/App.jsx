import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// ============================================================
// PUBLIC PAGES
// ============================================================
import Home from "./pages/Home";
import Markets from "./pages/Markets";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Info from "./pages/Info";

import MarketDetail from "./pages/MarketDetail";

// ============================================================
// PROTECTED PAGES
// ============================================================
import Dashboard from "./pages/Dashboard";
import Trades from "./pages/Trades";
import TradeDetails from "./pages/TradeDetails";
import AI from "./pages/AI";
import Wallet from "./pages/Wallet";
import Deposit from "./pages/Deposit";
import Transactions from "./pages/Transactions";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// ============================================================
// ADMIN
// ============================================================
import AdminDashboard from "./pages/admin/AdminDashboard";

// ============================================================
// ROUTE GUARDS / LAYOUT
// ============================================================
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import AppLayout from "./components/layout/AppLayout";


function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ====================================================
            PUBLIC ROUTES
           ==================================================== */}

        <Route path="/" element={<Home />} />

        <Route path="/markets" element={<Markets />} />
      
        <Route
  path="/markets/:symbol"
  element={<MarketDetail />}
/>

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/info" element={<Info />} />


        {/* ====================================================
            PROTECTED USER ROUTES
           ==================================================== */}

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/trades" element={<Trades />} />

          <Route path="/trades/:id" element={<TradeDetails />} />

          <Route path="/ai" element={<AI />} />

          <Route path="/wallet" element={<Wallet />} />

          <Route
            path="/wallet/deposit"
            element={<Deposit />}
          />

          <Route
            path="/wallet/transactions"
            element={<Transactions />}
          />

          <Route path="/profile" element={<Profile />} />
      
          <Route path="/settings" element={<Settings />} />
        </Route>


        {/* ====================================================
            ADMIN ROUTE
           ==================================================== */}

        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />


        {/* ====================================================
            UNKNOWN ROUTES
           ==================================================== */}

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;