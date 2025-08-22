import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerRegistration from "./pages/SellerRegistartion";
import ProductRegistration from "./pages/ProductRegistration";
import JewelMartProduct from "./pages/AddProduct";

// 🔒 Protected Route Wrapper
function ProtectedRoute({ children }) {
  const { user } = useAuth();
  console.log(user);
  return user ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/productregistration" element={<ProductRegistration />} />
          <Route path="/register" element={<Register />} />
          <Route path="/AddProduct" element={<JewelMartProduct />} />
          <Route
            path="/sellerregistration"
            element={
              <ProtectedRoute>
                <SellerRegistration />
              </ProtectedRoute>
            }
          />
          <Route
            path="/productregistration"
            element={
              <ProtectedRoute>
                <ProductRegistration />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
