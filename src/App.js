// src/App.js
import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import './App.css';
import './styles/AppLayout.css';

// 🧩 Contexts
import { AuthProvider } from "./contexts/AuthContext";
import { SellerProvider, useSeller } from "./contexts/SellerContext";

// 📄 Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import SellerRegistration from "./pages/SellerRegistartion"; // check spelling of the file
import SegmentRegistration from "./pages/SegmentRegistration";
import ProductRegistration from "./pages/ProductRegistration";
import Dashboard from "./components/Dashboard";
import UploadProduct from "./pages/UploadProduct";
import MyRegisteredProducts from "./pages/MyregisteredProducts";
import QCApprovalPage from "./pages/QCApprovalPage";
import ReadyStockServices from "./pages/ReadyStockServices";
import Catalogue from "./pages/Catalogue";
import BuyerRequest from "./pages/BuyerRequest";
import Assortment from "./pages/Assortment";
import FinalCorrection from "./pages/FinalCorrection";
import ReadyToDispatch from "./pages/ReadyToDispatch";
import Pickup from "./pages/Pickup";
import LiveRatesPage from "./pages/LiveRatesPage";
import ForgotPassword from "./pages/ForgetPassword";
import ProductDetails from "./pages/ProductDetails";
import Payment from "./pages/Payment";
import MyCatalogue from "./pages/MyCatalogue";
import OrderServe from "./pages/OrderServe";

// 🧱 Protected Route
const ProtectedRoute = ({ children }) => {
  const { seller, loading } = useSeller();

  if (loading) return <div className="splash-screen">Loading...</div>;

  // not logged in
  if (!seller?.sellerId) return <Navigate to="/login" replace />;

  return children;
};

// 🧱 Public Route
const PublicRoute = ({ children }) => {
  const { seller, loading } = useSeller();
   console.log(seller);
  if (loading) return <div className="splash-screen">Loading...</div>;

  // redirect to dashboard if seller already logged in
  if (seller?.sellerId) {
    if (!seller?.sellerRegistration) return <Navigate to="/sellerregistration" replace />;
    if (!seller?.segmentRegistration) return <Navigate to="/segmentregistration" replace />;
    if (!seller?.productRegistration) return <Navigate to="/productregistration" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// 💡 Layout Wrapper
const AppLayout = ({ children }) => (
  <div className="app-layout safe-area">
    <div className="app-content">{children}</div>
  </div>
);

// 🔄 AppContent handles routing
const AppContent = () => {
  const { seller, loading } = useSeller();

  useEffect(() => {
    console.log("[Seller App] Auth State:", { loading, seller });
  }, [loading, seller]);

  if (loading) return <div className="splash-screen">Loading...</div>;

  return (
    <Routes>
      {/* Root redirect */}
      <Route path="/" element={<Navigate to={seller?.sellerId ? "/dashboard" : "/login"} replace />} />

      {/* Public Routes */}
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      <Route path="/forgetpassword" element={<PublicRoute><ForgotPassword /></PublicRoute>} />

      {/* Protected Registration Steps */}
      <Route path="/sellerregistration" element={<SellerRegistration />}/>
      <Route path="/segmentregistration" element={<SegmentRegistration />}/>
      <Route path="/productregistration" element={<ProductRegistration />}/>

      {/* Protected Seller Functional Pages */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/uploadproduct" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
      <Route path="/myregisteredproducts" element={<ProtectedRoute><MyRegisteredProducts /></ProtectedRoute>} />
      <Route path="/readystockservices" element={<ProtectedRoute><ReadyStockServices /></ProtectedRoute>} />
      <Route path="/qcapprovalpage" element={<ProtectedRoute><QCApprovalPage /></ProtectedRoute>} />
      <Route path="/orderserve" element={<ProtectedRoute><OrderServe /></ProtectedRoute>} />
      <Route path="/liverates" element={<ProtectedRoute><LiveRatesPage /></ProtectedRoute>} />
      <Route path="/product/:productId" element={<ProtectedRoute><ProductDetails /></ProtectedRoute>} />
      <Route path="/mycatalogue" element={<ProtectedRoute><MyCatalogue /></ProtectedRoute>} />
      <Route path="/catalogue/:type" element={<ProtectedRoute><Catalogue /></ProtectedRoute>} />
      <Route path="/buyerrequest" element={<ProtectedRoute><BuyerRequest /></ProtectedRoute>} />
      <Route path="/assortment" element={<ProtectedRoute><Assortment /></ProtectedRoute>} />
      <Route path="/finalcorrection" element={<ProtectedRoute><FinalCorrection /></ProtectedRoute>} />
      <Route path="/rtd" element={<ProtectedRoute><ReadyToDispatch /></ProtectedRoute>} />
      <Route path="/pickup" element={<ProtectedRoute><Pickup /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={seller?.sellerId ? "/dashboard" : "/login"} replace />} />
    </Routes>
  );
};

// 🌍 Main App Entry
function App() {
  return (
    <AuthProvider>
      <SellerProvider>
        <Router>
          <AppLayout>
            <AppContent />
          </AppLayout>
        </Router>
      </SellerProvider>
    </AuthProvider>
  );
}

export default App;
