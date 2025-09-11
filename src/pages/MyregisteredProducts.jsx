import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import './MyRegisteredProducts.css';
import { useNavigate } from 'react-router-dom';
import { useSeller } from '../contexts/SellerContext';
import Header from '../components/Header';

const MyRegisteredProducts = () => {
    const navigate = useNavigate();
    const { seller } = useSeller();
    const sellerId = seller?.sellerId;
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [editFormData, setEditFormData] = useState({});

    const tabs = ['All', 'Pending QC', 'Approved', 'Rejected'];

    useEffect(() => {
        fetchRegisteredProducts();
        }, []);

    const fetchRegisteredProducts = async () => {
        if (!sellerId) return;

        setLoading(true);
        try {
            const docRef = doc(db, 'ProductRegistrations', sellerId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const allRegistrations = data.registrations || [];
                const sortedRegistrations = allRegistrations.sort((a, b) => {
                    const dateA = new Date(a.requestTimestamp);
                    const dateB = new Date(b.requestTimestamp);
                    return dateB - dateA;
                });

                setRegistrations(sortedRegistrations);
            } else {
                setRegistrations([]);
            }
        } catch (error) {
            console.error('Error fetching registered products:', error);
            setRegistrations([]);
        } finally {
            setLoading(false);
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'pending_approval':
                return 'pending';
            case 'approved':
                return 'approved';
            case 'rejected':
                return 'rejected';
            default:
                return '';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'pending_approval':
                return 'Pending QC';
            case 'approved':
                return 'Approved';
            case 'rejected':
                return 'Rejected';
            default:
                return status;
        }
    };

    const getFilteredRegistrations = () => {
        let filtered = registrations;

        if (activeTab !== 'All') {
            const statusMap = {
                'Pending QC': 'pending_approval',
                'Approved': 'approved',
                'Rejected': 'rejected'
            };
            filtered = filtered.filter(reg => reg.status === statusMap[activeTab]);
        }

        if (searchTerm) {
            filtered = filtered.filter(reg => {
                const productNames = Object.keys(reg.products || {}).join(' ').toLowerCase();
                const searchLower = searchTerm.toLowerCase();
                return productNames.includes(searchLower) ||
                    Object.values(reg.products || {}).some(product => 
                        product.segment?.toLowerCase().includes(searchLower) ||
                        product.category?.toLowerCase().includes(searchLower) ||
                        product.subcategory?.toLowerCase().includes(searchLower)
                    );
            });
        }

        if (sortBy === 'newest') {
            filtered = filtered.sort((a, b) => new Date(b.requestTimestamp) - new Date(a.requestTimestamp));
        } else if (sortBy === 'oldest') {
            filtered = filtered.sort((a, b) => new Date(a.requestTimestamp) - new Date(b.requestTimestamp));
        } else if (sortBy === 'name') {
            filtered = filtered.sort((a, b) => {
                const nameA = Object.keys(a.products || {})[0] || '';
                const nameB = Object.keys(b.products || {})[0] || '';
                return nameA.localeCompare(nameB);
            });
        }

        return filtered;
    };

    const getMainProductName = (products) => {
        const productNames = Object.keys(products || {});
        if (productNames.length === 0) return 'No Products';
        return productNames[0];
    };

    const getCategoryPath = (product) => {
        // Now getting category path from individual product object
        return `${product.segment || ''} ${product.category || ''} ${product.subcategory || ''}`.trim();
    };

    const getFirstProductImage = (products) => {
        const productNames = Object.keys(products || {});
        if (productNames.length === 0) return null;
        const firstProduct = products[productNames[0]];
        return firstProduct.image || null;
    };

    const getSpecificationDetails = (product) => {
        const details = [];
        if (product.wastage && product.wastage !== '0' && product.wastage !== '') {
            details.push(`Wastage: ${product.wastage}%`);
        }
        if (product.specificationMC && product.specificationMC !== '0' && product.specificationMC !== '') {
            details.push(`Spec MC: ${product.specificationMC}`);
        }
        if (product.specificationGramRate && product.specificationGramRate !== '0' && product.specificationGramRate !== '') {
            details.push(`Gram Rate: ${product.specificationGramRate}`);
        }
        return details.join(' | ') || 'No specifications';
    };

    const handleEditClick = (registration) => {
        const productName = getMainProductName(registration.products);
        const productData = registration.products[productName];

        setSelectedProduct(registration);
        setEditFormData({
            ...productData,
            productName
        });
        setIsEditModalOpen(true);
    };

    const handleEditChange = (field, value) => {
        setEditFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleEditSubmit = async () => {
        if (!selectedProduct || !sellerId) return;

        try {
            // Update local state
            const updatedRegistrations = registrations.map(reg => {
                if (reg.registrationId === selectedProduct.registrationId) {
                    const productName = editFormData.productName;
                    return {
                        ...reg,
                        products: {
                            ...reg.products,
                            [productName]: {
                                ...reg.products[productName],
                                ...editFormData
                            }
                        },
                        status: 'pending_approval',
                        approved: false
                    };
                }
                return reg;
            });

            setRegistrations(updatedRegistrations);
            setIsEditModalOpen(false);

            // Update Firestore
            const docRef = doc(db, 'ProductRegistrations', sellerId);
            await updateDoc(docRef, {
                registrations: updatedRegistrations
            });
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const filteredRegistrations = getFilteredRegistrations();

    if (loading) {
        return (
            <>
                <Header title='My Registered Products' />
                <div className="loading-state">Loading...</div>
            </>
        );
    }

    return (
        <>
            <Header title='My Registered Products' />
            <div className="catalogue-container">
                <div className="tabs-container">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`registertab-button ${activeTab === tab ? 'active' : ''}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            <div className="controls-container">
                <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="registersearch-input"
                    />
                </div>
                <div className="sort-container">
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="name">Name A-Z</option>
                    </select>
                </div>
            </div>

            <div className="products-list">
                {filteredRegistrations.length === 0 ? (
                    <div className="empty-state">
                        <p>No products found</p>
                    </div>
                ) : (
                    filteredRegistrations.map((registration) => {
                        const mainProductName = getMainProductName(registration.products);
                        const productData = registration.products[mainProductName];
                        const categoryPath = getCategoryPath(productData); // Fixed: pass productData instead of registration.products
                        const statusLabel = getStatusLabel(registration.status);
                        const statusClass = getStatusClass(registration.status);
                        const imageUrl = getFirstProductImage(registration.products);
                        const specificationDetails = getSpecificationDetails(productData);

                        return (
                            <div
                                key={registration.registrationId}
                                className="product-card"
                                onClick={() => registration.status === 'rejected' && handleEditClick(registration)}
                                style={{ cursor: registration.status === 'rejected' ? 'pointer' : 'default' }}
                            >
                                <div className="product-image">
                                    {imageUrl ?
                                        <img src={imageUrl} alt={mainProductName} className="product-image-placeholder" /> :
                                        <div className="product-image-placeholder"></div>
                                    }
                                </div>
                                <div className="product-info">
                                    <h3 className="product-title">{mainProductName}</h3>
                                    <p className="product-category">{categoryPath} / {productData?.selectedStyleType || 'N/A'} / {productData?.specification || 'N/A'}</p>
                                    <p className="product-specs">{specificationDetails}</p>
                                    <span className={`status-badge ${statusClass}`}>
                                        {statusLabel}
                                        {registration.status === 'rejected' && (
                                            <span style={{ marginLeft: '8px', textDecoration: 'underline' }}>
                                                (Click to Edit)
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <ChevronRight className="chevron-icon" size={20} />
                            </div>
                        );
                    })
                )}
            </div>

            <div className="bottom-bar">
                <button
                    onClick={() => navigate("/productregistration")}
                    className="register-new-fab"
                >
                    Register New Product
                </button>
            </div>

            {/* Edit Modal */}
            {isEditModalOpen && selectedProduct && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h3>Edit Rejected Product</h3>
                            <button
                                className="modal-close"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="product-header">
                                <div className="header-image">
                                    {editFormData.image ? (
                                        <img src={editFormData.image} alt="Product" className="header-image-preview" />
                                    ) : (
                                        <div className="header-image-placeholder"></div>
                                    )}
                                </div>
                                <div className="header-info">
                                    <h4>{editFormData.productName}</h4>
                                    <p>{editFormData.category || editFormData.segment} - {editFormData.productSource || editFormData.subcategory} - {editFormData.selectedStyleType || 'N/A'} - {editFormData.specification || 'N/A'}</p>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Purity</label>
                                <input
                                    type="text"
                                    value={editFormData.purity || ''}
                                    onChange={(e) => handleEditChange('purity', e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label>Wastage (%)</label>
                                <input
                                    type="text"
                                    value={editFormData.wastage || ''}
                                    onChange={(e) => handleEditChange('wastage', e.target.value)}
                                    className="form-input"
                                />
                            </div>
                            
                            {editFormData.category !== 'PLANE' && (
                                <>
                                    <div className="form-group">
                                        <label>Specification MC</label>
                                        <input
                                            type="text"
                                            value={editFormData.specificationMC || ''}
                                            onChange={(e) => handleEditChange('specificationMC', e.target.value)}
                                            className="form-input"
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label>Specification Gram Rate</label>
                                        <input
                                            type="text"
                                            value={editFormData.specificationGramRate || ''}
                                            onChange={(e) => handleEditChange('specificationGramRate', e.target.value)}
                                            className="form-input"
                                        />
                                    </div>
                                </>
                            )}

                            <div className="form-group">
                                <label>Set MC / Gram MC</label>
                                <input
                                    type="text"
                                    value={editFormData.setMC || editFormData.netGramMC || ''}
                                    onChange={(e) => {
                                        if (editFormData.setMC !== undefined) {
                                            handleEditChange('setMC', e.target.value);
                                        } else {
                                            handleEditChange('netGramMC', e.target.value);
                                        }
                                    }}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="submit-button"
                                onClick={handleEditSubmit}
                            >
                                Submit for Review
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MyRegisteredProducts;