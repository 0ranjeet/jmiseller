import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Heart, ShoppingCart } from "lucide-react";
import "./ProductDetails.css";
import PageHeader from "../components/PageHeader";
import Footer from "../components/Footer";

const ProductDetails = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedImage, setSelectedImage] = useState(0);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [sizes, setSizes] = useState([{ size: "Regular", quantity: "1" }]);


  // Get product from navigation state
  const product = location.state?.product;
  console.log(product);
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

 

  // Update quantity
  const updateQuantity = (index, delta) => {
    const newSizes = [...sizes];
    newSizes[index].quantity = Math.max(1, newSizes[index].quantity + delta);
    setSizes(newSizes);
  };

  

  // Price calculation
  const calculatePrice = () => {
    const metalRate = 6000; // Can come from API/context
    const makingCharge = parseFloat(product.gramMakingOperator) || 0;
    const wastagePercent = parseFloat(product.wastageOperator) || 0;
    const netWeight = parseFloat(product.netWt) || 0;

    const total =
      netWeight * metalRate +
      netWeight * makingCharge +
      (netWeight * wastagePercent * metalRate) / 100;

    return total.toLocaleString("en-IN");
  };
  const totalWestage = parseFloat(
    Number(product.wastage)
  );

  // Fine weight
  const calculateFineWeight = () => {
    const grossWeight = parseFloat(product?.grossWt) || 0;
    const purity = parseFloat(product?.purity) || 0;
    
    // Fine weight formula
    const fineWeight = (grossWeight * (purity + totalWestage)) / 100;
    return fineWeight.toFixed(3);
  };

  // Format purity display
  const displayPurity = product.category?.replace(/(\d+)(HUID|ORNA)/i, "$1 $2");
  
  return (
    <>
      <PageHeader
        title={`${product.segment} ${displayPurity} ${product.productName} `}
      />

      <div className="product-details-container">
        <div className="product-content">
          {/* Image Gallery */}
          <div className="product-gallery">
            <div className="main-image">
              {product.images && product.images.length > 0 ? (
                <>
                  <img
                    src={product.images[selectedImage]?.url}
                    alt={product.productName}
                  />
                </>
              ) : (
                <div className="image-placeholder">
                  No Image Available
                </div>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="thumbnail-container">
                {product.images.map((image, index) => (
                  <div
                    key={index}
                    className={`thumbnail ${selectedImage === index ? "active" : ""
                      }`}
                    onClick={() => setSelectedImage(index)}
                  >
                    <img src={image.url} alt={`Thumbnail ${index + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>


          <div className="additional-info">
            <h3>{displayPurity} {product.serviceType === "ready" ? "Ready Serve" : "Order Serve"}</h3>
            <span className="spec-label">Net wt {product.netWt} g</span>

          </div>
          {/* Product Info */}

        </div>
        <div className="product-info">

          <div className="specifications-card">
            <h2>Specifications</h2>
            <div className="spec-grid">
              <div className="spec-row">
                <span className="spec-label">Segment</span>
                <span className="spec-value">{product.segment}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Set</span>
                <span className="spec-value">1</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Product ID</span>
                <span className="spec-value">
                  {product.id?.slice(0, 8).toUpperCase()}{" "}

                </span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Category</span>
                <span className="spec-value">{product.category}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Status</span>
                <span className="spec-value">{product.serviceType}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Specification:</span>
                <span className="spec-value">{product.specification}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Finish Type:</span>
                <span className="spec-value">
                  {product.finishType || product.styleType || "Regular"}
                </span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Gross wt </span>
                <span className="spec-value">{product.grossWt} g</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Settlement:</span>
                <span className="spec-value">{product.paymentMethod}</span>
              </div>

              <div className="spec-row">
                <span className="spec-label">Fine wt </span>
                <span className="spec-value">{calculateFineWeight()} g</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Product</span>
                <span className="spec-value">{product.productSource} {product.productName}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Wastage </span>
                <span className="spec-value">{totalWestage}%</span>
              </div>

              {/* <div className="spec-row">
                <span className="spec-label">In Stock (Grams):</span>
                <span className="spec-value">{product.instockGram}g</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Minimum Order Quantity:</span>
                <span className="spec-value">{product.moqGram}g</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Making Charges Size</span>
                <span className="spec-value">
                  ₹{product.gramMakingOperator}
                </span>
              </div> */}
            </div>



            <div className="rtgs-section">
              <strong>Fine Weight</strong>
              <div className="price">{calculateFineWeight()+"g"}</div>
            </div>

           
          </div>


        </div>
      </div>

      

      <Footer />
    </>
  );
};

export default ProductDetails;