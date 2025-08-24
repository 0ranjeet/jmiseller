import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerRegistration from "./pages/SellerRegistartion";
import ProductRegistration from "./pages/ProductRegistration";
import JewelMartProduct from "./pages/AddProduct";
import Dashboard from "./components/Dashboard";
import SegmentRegistration from "./pages/SegmentRegistration";
import MyRegisteredProducts from "./pages/MyregisteredProducts";

// 🔒 Protected Route Wrapper - Updated to check localStorage
function ProtectedRoute({ children }) {
  const isAuthenticated = localStorage.getItem("sellerId") !== null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/AddProduct" element={<JewelMartProduct />} />
          <Route path="/segmentregistration" element={<SegmentRegistration />} />
          <Route path="/myregisteredproducts" element={<MyRegisteredProducts />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sellerregistration"
            element={
              <ProtectedRoute>
                <SellerRegistration />
              </ProtectedRoute>
            }
          />
          {/* <Route 
           path="/segmentregistration"
           element={
            <ProtectedRoute>
              <SegmentRegistration />
            </ProtectedRoute>
           }
          /> */}
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
