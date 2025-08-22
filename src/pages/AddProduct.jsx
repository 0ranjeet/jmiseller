import React, { useState } from 'react';
import {  X, ChevronDown, Camera } from 'lucide-react';
import './AddProduct.css'; 
import { db } from '../services/firebase';
import { collection, addDoc } from 'firebase/firestore';

const AddProduct = () => {
  // const mob=localStorage.getItem("sellerMobile");
  const [activeTab, setActiveTab] = useState('ready');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [specifications,setSpecifications]=useState("otherWork");
  const [formData, setFormData] = useState({
    productCategory: '',
    subCategory: '',
    productName: '',
    tags: ['High Fancy', 'High Finished', 'Light Weight'],
    selectedTags: [],
    moqGram: 1,
    moqSet: 1,
    netWtPurity: 91.6,
    wastage: 10,
    setMc: 1200,
    netGramMc: 5200,
    stoneGram: 1,
    meenaGram: '',
    paymentMethod: 'RTGS',
    netWt: '',
    totalAmt: 79500,
    set: 1,
    grossWt: 15.75,
    otherWt: 0.75,
    fineWt: 13.74,
    gst: 1,
    sizeValue: ''
  });

  const CLOUDINARY_CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = "jmiseller";
  const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

  const handleImageUpload = async (files) => {
    setUploading(true);
    const uploadPromises = Array.from(files).map(async (file) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

      try {
        const response = await fetch(CLOUDINARY_API_URL, {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        return {
          id: data.public_id,
          url: data.secure_url,
          name: file.name,
        };
      } catch (error) {
        console.error('Upload failed:', error);
        return null;
      }
    });

    const results = await Promise.all(uploadPromises);
    const successfulUploads = results.filter(Boolean);
    setUploadedImages(prev => [...prev, ...successfulUploads]);
    setUploading(false);
  };

  const removeImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const toggleTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      selectedTags: prev.selectedTags.includes(tag)
        ? prev.selectedTags.filter(t => t !== tag)
        : [...prev.selectedTags, tag]
    }));
  };

  const handleSubmit = async () => {
    try {
      const productData = {
        ...formData,
        images: uploadedImages,
        type: activeTab
      };
      
      // Here you would typically save to Firebase
      console.log('Product data to save:', productData);
      
      // Add your Firebase save logic here
      await addDoc(collection(db, 'products'), productData);
      
      alert('Product added successfully!');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Error saving product. Please try again.');
    }
  };

  return (
    <div className="add-product-container">
      {/* Header */}
      <div className="header">
        <div className="header-title">Add Product</div>
      </div>

      {/* Tabs */}
      <div className="tab-container">
        <button
          onClick={() => setActiveTab('ready')}
          className={`tab-button ${activeTab === 'ready' ? 'active' : 'inactive'}`}
        >
          Ready Serve
        </button>
        <button
          onClick={() => setActiveTab('order')}
          className={`tab-button ${activeTab === 'order' ? 'active' : 'inactive'}`}
        >
          Order Serve
        </button>
      </div>

      <div className="content">
        {/* Select Specifications */}
        <div className="section">
          <div className="form-grid-2">
            <div className="form-group">
              <div className="select-wrapper">
                <select
                  value={formData.productCategory}
                  onChange={(e) => handleInputChange('productCategory', e.target.value)}
                  className="form-select"
                >
                  <option value="">Product Category</option>
                  <option value="necklace">Necklace</option>
                  <option value="ring">Ring</option>
                  <option value="earring">Earring</option>
                  <option value="bracelet">Bracelet</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>
            <div className="form-group">
              <div className="select-wrapper">
                <select
                  value={formData.subCategory}
                  onChange={(e) => handleInputChange('subCategory', e.target.value)}
                  className="form-select"
                >
                  <option value="">Sub-category</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                  <option value="platinum">Platinum</option>
                </select>
                <ChevronDown className="select-icon" />
              </div>
            </div>
            <div className="select-wrapper">
              <select
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className="form-select"
              >
                <option value="">Product Name</option>
                <option value="short-necklace">Short Necklace</option>
                <option value="long-necklace">Long Necklace</option>
                <option value="pendant">Pendant</option>
              </select>
              <ChevronDown className="select-icon" />
            </div>
            <div className="select-wrapper">
              <select
                value={specifications}
                onChange={(e) => setSpecifications( e.target.value)}
                className="form-select"
              >
                <option value="">Specification</option>
                <option value="plain">Plain</option>
                <option value="otherwork">Other Work</option>
                <option value="meenawork">Meena Work</option>
                <option value="stonework">Stone Work</option>
              </select>
              <ChevronDown className="select-icon" />
            </div>
          </div>

          {/* Tags */}
          
        </div>

        {/* Upload Photos */}
        <div className="upload-section">
          <h3 className="section-title">Upload Photos</h3>
          
          {uploadedImages.length > 0 && (
            <div className="image-grid">
              {uploadedImages.map((image) => (
                <div key={image.id} className="image-container">
                  <img
                    src={image.url}
                    alt={image.name}
                    className="uploaded-image"
                  />
                  <button
                    onClick={() => removeImage(image.id)}
                    className="remove-image-btn"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="upload-area">
            <div className="upload-icon-container">
              <Camera className="upload-icon" />
            </div>
            <p className="upload-text">
              {uploadedImages.length > 0 ? 'Short Necklace\nGold-916 HUID-Kataki' : 'Upload product photos'}
            </p>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={(e) => handleImageUpload(e.target.files)}
              className="upload-input"
              id="photo-upload"
              disabled={uploading}
            />
            <label
              htmlFor="photo-upload"
              className={`upload-button ${uploading ? 'loading' : ''}`}
            >
              {uploading ? 'Uploading...' : 'Add Photos'}
            </label>
          </div>
        </div>
<div className="tags-container">
            {formData.tags.map((tag) => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`tag-button ${
                  formData.selectedTags.includes(tag) ? 'selected' : 'unselected'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        {/* Product Details */}
        <div className="section">
          <h3 className="section-title">Product Details</h3>
          
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">MOQ Gram</label>
              <input
                type="number"
                value={formData.moqGram}
                onChange={(e) => handleInputChange('moqGram', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">MOQ Set</label>
              <input
                type="number"
                value={formData.moqSet}
                onChange={(e) => handleInputChange('moqSet', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Net Wt. Purity (%)</label>
              <input
                type="number"
                step="0.1"
                value={formData.netWtPurity}
                onChange={(e) => handleInputChange('netWtPurity', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Wastage (%)</label>
              <input
                type="number"
                value={formData.wastage}
                onChange={(e) => handleInputChange('wastage', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Set MC</label>
              <input
                type="number"
                value={formData.setMc}
                onChange={(e) => handleInputChange('setMc', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Net Gram MC</label>
              <input
                type="number"
                value={formData.netGramMc}
                onChange={(e) => handleInputChange('netGramMc', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              {specifications==="stonework" && (
              <>
              <label className="form-label">Stone Gram</label>
              <input
                type="number"
                step="0.01"
                value={formData.stoneGram}
                onChange={(e) => handleInputChange('stoneGram', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
              </>
              )}
            </div>
            <div className="form-group">
              {specifications==="meenawork" && (
              <>

              <label className="form-label">Meena Gram</label>
              <input
                type="number"
                step="0.01"
                value={formData.meenaGram}
                onChange={(e) => handleInputChange('meenaGram', e.target.value)}
                className="form-input"
              />
              </>
              )}
            </div>
          </div>

          {/* Size Selection */}
          <div className="form-group">
            <label className="form-label">Payment Method</label>
            <div className="radio-group">
              <div className="radio-item">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="RTGS"
                  checked={formData.paymentMethod === 'RTGS'}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="radio-input"
                  id="payment-rtgs"
                />
                <label htmlFor="payment-rtgs" className="radio-label">RTGS</label>
              </div>
              <div className="radio-item">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="Cash"
                  checked={formData.paymentMethod === 'Cash'}
                  onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                  className="radio-input"
                  id="payment-cash"
                />
                <label htmlFor="payment-cash" className="radio-label">Cash</label>
              </div>
            </div>
          </div>
        </div>

        {/* Enter New Details */}
        <div className="section">
          <h3 className="section-title">Enter New Details</h3>
          
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Net Wt. (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.netWt}
                onChange={(e) => handleInputChange('netWt', e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Total Amt</label>
              <input
                type="number"
                value={formData.totalAmt}
                onChange={(e) => handleInputChange('totalAmt', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Set</label>
              <input
                type="number"
                value={formData.set}
                onChange={(e) => handleInputChange('set', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Gross Wt. (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.grossWt}
                onChange={(e) => handleInputChange('grossWt', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              {specifications==="otherwork" && (
              <>

              <label className="form-label">Other Wt. (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.otherWt}
                onChange={(e) => handleInputChange('otherWt', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
              </>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">Fine Wt. (g)</label>
              <input
                type="number"
                step="0.01"
                value={formData.fineWt}
                onChange={(e) => handleInputChange('fineWt', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">GST%</label>
              <input
                type="number"
                value={formData.gst}
                onChange={(e) => handleInputChange('gst', parseFloat(e.target.value) || 0)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Size</label>
              <input
                type="text"
                value={formData.sizeValue}
                onChange={(e) => handleInputChange('sizeValue', e.target.value)}
                className="form-input"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={uploading}
          className="submit-button"
        >
          QC Request
        </button>
      </div>
    </div>
  );
};

export default AddProduct;