// src/App.js
import React, { useContext, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import './App.css';
import './styles/AppLayout.css'
import { AuthProvider } from "./contexts/AuthContext";
import { SellerProvider, useSeller } from "./contexts/SellerContext";

// All your pages...
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerRegistration from "./pages/SellerRegistartion"; // ⚠️ Check typo: "Registartion"
import ProductRegistration from "./pages/ProductRegistration";
import UploadProduct from "./pages/UploadProduct";
import Dashboard from "./components/Dashboard";
import SegmentRegistration from "./pages/SegmentRegistration";
import MyRegisteredProducts from "./pages/MyregisteredProducts";
import QCApprovalPage from "./pages/QCApprovalPage";
import MyCatalogue from "./pages/MyCatalogue";
import ReadyStockServices from "./pages/ReadyStockServices";
import Catalogue from "./pages/Catalogue";
import BuyerRequest from "./pages/BuyerRequest";
import Assortment from "./pages/Assortment";
import FinalCorrection from "./pages/FinalCorrection";
import ReadyToDispatch from "./pages/ReadyToDispatch";
import OrderServe from "./pages/OrderServe";
import Pickup from "./pages/Pickup";
import LiveRatesPage from "./pages/LiveRatesPage";
import ForgotPassword from "./pages/ForgetPassword";
import ProductDetails from "./pages/ProductDetails";

// 🔒 Protected Route (must be inside Router & SellerProvider)
const ProtectedRoute = ({ children }) => {
  const { seller, loading } = useSeller();
  const location = useLocation();

  if (loading) return <div className="splash-screen">Loading...</div>;
  if (!seller?.sellerId) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
};

// 🚪 Public Route (redirects logged-in users away from login/register)
const PublicRoute = ({ children }) => {
  const { seller, loading } = useSeller();

  if (loading) return <div className="splash-screen">Loading...</div>;
  if (seller?.sellerId) return <Navigate to="/dashboard" replace />;

  return children;
};
const AppLayout = ({ children }) => {
  return (
    <div className="app-layout safe-area">
      <div className="app-content">
        {children}
      </div>
    </div>
  );
};
// 🧩 App Content (only renders after seller context is ready)
const AppContent = () => {
  const { seller, loading } = useSeller();

  // Optional: debug log
  useEffect(() => {
    console.log("[Seller App] Auth state:", { loading, sellerId: seller?.sellerId });
  }, [loading, seller]);

  if (loading) {
    return <div className="splash-screen">Loading...</div>;
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={seller?.sellerId ? "/dashboard" : "/login"} replace />} />

      {/* Public routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgetpassword" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Some public routes (if truly public) */}
      <Route path="/UploadProduct" element={<UploadProduct />} />
      <Route path="/MyCatalogue" element={<MyCatalogue />} />
      <Route path="/catalogue/:type" element={<Catalogue />} />
      <Route path="/buyerrequset" element={<BuyerRequest />} />
      <Route path="/assortment" element={<Assortment />} />
      <Route path="/finalcorrection" element={<FinalCorrection />} />
      <Route path="/rtd" element={<ReadyToDispatch />} />
      <Route path="/Assigned" element={<Pickup />} />

      {/* Protected routes */}
      <Route path="/segmentregistration" element={<ProtectedRoute><SegmentRegistration /></ProtectedRoute>} />
      <Route path="/sellerregistration" element={<ProtectedRoute><SellerRegistration /></ProtectedRoute>} />
      <Route path="/myregisteredproducts" element={<ProtectedRoute><MyRegisteredProducts /></ProtectedRoute>} />
      <Route path="/readystockservices" element={<ProtectedRoute><ReadyStockServices /></ProtectedRoute>} />
      <Route path="/orderserve" element={<ProtectedRoute><OrderServe /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/productregistration" element={<ProtectedRoute><ProductRegistration /></ProtectedRoute>} />
      <Route path="/QCApprovalPage" element={<ProtectedRoute><QCApprovalPage /></ProtectedRoute>} />
      <Route path="/liverates" element={<ProtectedRoute><LiveRatesPage /></ProtectedRoute>} />
 <Route path="/product/:productId" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
     
      {/* Fallback */}
      <Route path="*" element={<Navigate to={seller?.sellerId ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

// 🌐 Main App
function App() {
  return (
    <AuthProvider>
      <SellerProvider>
        <Router>
          <AppContent />
        </Router>
      </SellerProvider>
    </AuthProvider>
  );
}

export default App;