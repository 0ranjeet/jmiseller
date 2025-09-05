// src/App.js
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation, // Import useLocation
} from "react-router-dom";
import { useSeller } from "./contexts/SellerContext"; // Import the hook to access context
import { AuthProvider } from "./contexts/AuthContext";
import { SellerProvider } from "./contexts/SellerContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerRegistration from "./pages/SellerRegistartion"; // Note: Typo in filename?
import ProductRegistration from "./pages/ProductRegistration";
import UploadProduct from "./pages/UploadProduct";
import Dashboard from "./components/Dashboard";
import SegmentRegistration from "./pages/SegmentRegistration";
import MyRegisteredProducts from "./pages/MyregisteredProducts";
import QCApprovalPage from "./pages/QCApprovalPage";
import MyCatalogue from "./pages/MyCatalogue";

// 🔒 Protected Route Wrapper - Updated to check SellerContext
// This component must be rendered inside the Router and SellerProvider
function ProtectedRoute({ children }) {
  const { seller } = useSeller(); // Access the seller object from context
  const location = useLocation(); // Get current location for redirect

  // Check if sellerId exists in the context
  // Optionally, you might also want to check if seller?.registrationStatus is true
  // depending on your specific requirements for "fully registered" users.
  const isAuthenticated = !!seller?.sellerId;

  // If not authenticated, redirect to login.
  // The `state: { from: location }` part is useful if you want to redirect the user
  // back to the page they were trying to access after they log in.
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the protected children components
  return children;
}

function App() {
  return (
    // Wrap everything that needs access to Auth/Seller context inside the providers
    // The Router must be inside the providers if components inside Routes need to use useSeller/useAuth
    <AuthProvider>
      <SellerProvider>
        <Router>
          <Routes>
            {/* Redirect root path to login */}
            <Route path="/" element={<Navigate to="/login" replace />} />

            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/UploadProduct" element={<UploadProduct />} />
            <Route path="/MyCatalogue" element={<MyCatalogue />} />

            {/* Protected Routes */}
            {/* Each protected route now uses the ProtectedRoute wrapper */}
            <Route
              path="/segmentregistration"
              element={
                <ProtectedRoute>
                  <SegmentRegistration />
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
            <Route
              path="/myregisteredproducts"
              element={
                <ProtectedRoute>
                  <MyRegisteredProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
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
            <Route
              path="/QCApprovalPage"
              element={
                <ProtectedRoute>
                  <QCApprovalPage />
                </ProtectedRoute>
              }
            />

            {/* Add a catch-all route for undefined paths if needed */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </SellerProvider>
    </AuthProvider>
  );
}

export default App;