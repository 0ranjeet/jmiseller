// components/ProductDetails.js
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import "./ProductDetails.css";
import PageHeader from "../components/PageHeader";
import Footer from "../components/Footer";

const ProductDetails = () => {
  // Navigation & location
  const navigate = useNavigate();
  const location = useLocation();
  const product = location.state?.product;

  // State
  const [selectedImage, setSelectedImage] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLotIndex, setSelectedLotIndex] = useState(0);
  const [sizes, setSizes] = useState([{
    size: "Regular",
    quantity: 1,
    availableQty: 0,
    isReadyStock: false,
    isExistingSize: false
  }]);

  // Derived data
  const isLotBased = product?.Lot && product.lotDetails?.length > 0;
  const selectedLot = isLotBased ? product.lotDetails[selectedLotIndex] : null;

  // Guard clause
  if (!product) {
    return (
      <div className="product-details-container">
        <div className="error">Product not found</div>
        <button onClick={() => navigate(-1)} className="back-button">
          ← Back to Catalog
        </button>
      </div>
    );
  }

  // ==========================
  // 🧮 Price & Weight Calculations
  // ==========================

  const num = (v) => parseFloat(v) || 0;

  const totalWestage = num(product.purity) +
    num(product.wastage) +
    num(product.specificationMC) +
    (product.specification && product.specification !== "Plane"
      ? 0
      : 0);

  const wastage = num(product.wastage) +
    num(product.specificationMC) +
    (product.specification && product.specification !== "Plane"
      ? 0
      : 0);

  const setMcBase = num(product.setMc);
  const setMc = setMcBase;

  const gramMcPerGram = num(product.netGramMc);

  const specMcPerGram = num(product.specificationGramRate);

  const TotalAmount = setMc + gramMcPerGram * product.netWt + specMcPerGram * product.specificationWt;

  const calculateFineWeight = () => {
    const netWeight = num(product.netWt);
    const fineWeight = (netWeight * totalWestage) / 100;
    return fineWeight.toFixed(3);
  };

  const displayPurity = product.category?.replace(/(\d+)(HUID|ORNA)/i, "$1 $2");

  const calculateApproxNetWt = (variant) => {
    if (!product.lotDetails || !variant) return null;
    const lotDetail = product.lotDetails.find(lot => lot.size === variant.size);
    if (lotDetail?.avgNetWt) {
      return `~${(parseFloat(lotDetail.avgNetWt) * variant.quantity).toFixed(3)} g`;
    }
    return null;
  };

  const calculateSetForNonLot = (variant) => {
    if (product.lot || !variant || !product.netWt) return null;
    const setValue = parseFloat(product.netWt) * variant.quantity;
    return ` Set ~${setValue.toFixed(3)}`;
  };

  // ==========================
  // 🖱️ Event Handlers
  // ==========================

 
console.log(product);


  const renderImageGallery = () => (
    <div className="product-gallery">
      <div className="main-image">
        {product.images && product.images.length > 0 ? (
          <>
            <img src={product.images[selectedImage]?.url} alt={product.productName} />
          </>
        ) : (
          <div className="image-placeholder">
            No Image Available
          </div>
        )}
      </div>

      {product.images?.length > 1 && (
        <div className="thumbnail-container">
          {product.images.map((image, index) => (
            <div
              key={index}
              className={`thumbnail ${selectedImage === index ? "active" : ""}`}
              onClick={() => setSelectedImage(index)}
            >
              <img src={image.url} alt={`Thumbnail ${index + 1}`} />
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderVariantInfo = () => {
    if (product.selectedVariants?.length > 0) {
      return product.selectedVariants.map((variant, index) => (
        <span key={variant.size} className="variant-info">
          {variant.size}
          {variant.quantity > 1 ? ` x ${variant.quantity}` : " x 1"}
          {product.lot && calculateApproxNetWt(variant) && (
            <span className="approx-weight">({calculateApproxNetWt(variant)})</span>
          )}
          {!product.lot && calculateSetForNonLot(variant) && (
            <span className="set-info">{calculateSetForNonLot(variant)}</span>
          )}
          {index < product.selectedVariants.length - 1 && ", "}
        </span>
      ));
    }

    if (isLotBased) {
      return (
        <div>
          <div className="lot-chips">{product.lotDetails.map((lot, index) => (
            <button
              key={index}
              className={`chip ${selectedLotIndex === index ? 'chip-selected' : ''}`}
              onClick={() => setSelectedLotIndex(index)}
            >
              {lot.size || `Lot ${index + 1}`}
            </button>
          ))}</div>
          <div><div className="spec-lot-item">
            <span className="spec-label">Net wt ~ {parseFloat(selectedLot.avgNetWt || 0).toFixed(3)} g</span>
            <span className="spec-label">Avl set: {selectedLot.set}</span>
          </div></div>
        </div>
      );
    }

    return (
      <span className="spec-nonlot-item">
        <span className="spec-label">Net wt ~ {parseFloat(product.netWt || 0).toFixed(3)} g</span>
        <span className="spec-label">Avl set: {product.instockSet}</span>
        {product.sizes?.length > 0 && (
          <span className="spec-label">Size: {product.sizes[0]}</span>
        )}
      </span>
    );
  };

  const renderSpecifications = () => {
  // Add safety check for selectedLot
  if (isLotBased && !selectedLot) {
    return <div className="error">Lot details not available</div>;
  }

  return (
    <div className="specifications-card">
      <h2>Specifications</h2>
      <div className="spec-grid">
        <div>
          <SpecRow label="Status" value={product.serviceType === "ready" ? "Ready Serve" : "Order Serve"} />
          <SpecRow label="Segment" value={product.segment} />
          <SpecRow label="Category" value={product.category} />
          <SpecRow label="Purity" value={`${parseFloat(product.purity || 0).toFixed(2)}%`} />
          <SpecRow label="Product" value={`${product.productSource} ${product.productName}`} />
          <SpecRow label="Specification" value={product.specification} />
          <SpecRow label="Finish Type" value={product.finishType || product.styleType || "Regular"} />
          <SpecRow label="Settlement" value={product.paymentMethod} />
        </div>
        <div>
          <SpecRow label="Set" value={isLotBased ? (selectedLot?.set || "N/A") : (product.instockSet || "N/A")} />
          <SpecRow label="Gross Wt." value={isLotBased ? `~${parseFloat(selectedLot?.avgGrossWt || 0).toFixed(3)} g` : `~${parseFloat(product.grossWt || 0).toFixed(3)} g`} />
          <SpecRow label={`${product.specification || 'Spec'} Wt.`} value={isLotBased ? `~${parseFloat(selectedLot?.avgSpecWt || 0).toFixed(3)} g` : `~${parseFloat(product.specificationWt || 0).toFixed(3)} g`} />
          <SpecRow label="Net Wt." value={isLotBased ? `~${parseFloat(selectedLot?.avgNetWt || 0).toFixed(3)} g` : `~${parseFloat(product.netWt || 0).toFixed(3)} g`} />
          <SpecRow label="Wastage" value={`${parseFloat(wastage || 0).toFixed(2)}%`} />
          <SpecRow label="Set Mc." value={`~₹${setMc.toFixed(2)}`} />
          <SpecRow label="Net Gram Mc." value={`~₹${gramMcPerGram.toFixed(2)}/g`} />
          <SpecRow label={`${product.specification || 'Spec'} Wt. Per gm`} value={`~₹${specMcPerGram.toFixed(2)}/g`} />
        </div>
      </div>

      <div className="rtgs-section">
        <div><strong>Total Fine</strong><div className="price">~ {calculateFineWeight()} g</div></div>
        <div><strong>Total Amount</strong><div className="price">~₹{TotalAmount.toFixed(2)}</div></div>
      </div>

      
    </div>
  );
};

  // ==========================
  // 🧩 JSX
  // ==========================

  return (
    <>
      <PageHeader title={`${product.segment} ${displayPurity} ${product.productName}`} />
      <div className="product-details-container">
        <div className="product-content">
          {renderImageGallery()}

          <div className="additional-info">
            <h3>
              {product.serviceType === "ready" ? "Ready Serve" : "Order Serve"}{" "}
              {product.productSource} {product.productName}
            </h3>
            <span className="spec-label">{renderVariantInfo()}</span>
          </div>
        </div>

        <div className="product-info">
          {renderSpecifications()}
        </div>
      </div>

      

      <Footer />
    </>
  );
};

// 💡 Reusable Spec Row Component
const SpecRow = ({ label, value }) => (
  <div className="spec-row">
    <span className="spec-label">{label}</span>
    <span className="spec-value">{value}</span>
  </div>
);

export default ProductDetails;