import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPin from "./pages/auth/Forgotpin";
import Dashboard from "./pages/Dashboard";
import Customers from "./pages/Customer";
import MilkEntry from "./pages/MilkEntry";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AdminLayout from "./layout/AdminLayout";
import SplashScreen from "./components/IntroScreen"; 
import { AppProvider } from "./context/AppContext";

function App() {
  const [loadingConfig, setLoadingConfig] = useState({ visible: true, message: "Loading Milk..." });
  const token = localStorage.getItem("token");

  // This function allows Navbar or any page to trigger the splash screen
  window.showSplash = (msg) => {
    setLoadingConfig({ visible: true, message: msg });
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingConfig({ ...loadingConfig, visible: false });
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProvider>
      <AnimatePresence mode="wait">
        {loadingConfig.visible ? (
          <SplashScreen key="splash" message={loadingConfig.message} />
        ) : (
          <BrowserRouter key="app">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-pin" element={<ForgotPin />} />

              <Route path="/" element={token ? <AdminLayout /> : <Navigate to="/login" />}>
                <Route index element={<Navigate to="/dashboard" />} />
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="customers" element={<Customers />} />
                <Route path="milk-entry" element={<MilkEntry />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </BrowserRouter>
        )}
      </AnimatePresence>
    </AppProvider>
  );
}

export default App;