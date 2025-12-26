// src/App.jsx
import React from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { CustomerProvider } from "./contexts/CustomerContext";
import MenuScreen from "./screens/MenuScreen";
import CustomerLoginScreen from "./screens/CustomerLoginScreen";

function AppRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<CustomerLoginScreen />} />
        <Route path="/menu" element={<MenuScreen />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <BrowserRouter>
      <CustomerProvider>
        <div className="h-screen w-screen">
          <AppRoutes />
        </div>
      </CustomerProvider>
    </BrowserRouter>
  );
}

export default App;
