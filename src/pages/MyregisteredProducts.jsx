import React, { useState, useEffect } from 'react';
import { Search, ChevronRight } from 'lucide-react';
import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import './MyRegisteredProducts.css';
import { useNavigate } from 'react-router-dom';
import { useSeller } from '../contexts/SellerContext';
import Header from '../components/Header';

const MyRegisteredProducts = () => {
    const navigate = useNavigate();
    const { seller } = useSeller(); // Get seller object from context
    const sellerId = seller?.sellerId;
    const [activeTab, setActiveTab] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    const tabs = ['All', 'Pending QC', 'Approved', 'Rejected'];

    useEffect(() => {
        fetchRegisteredProducts();
    }, [sellerId]);

    const fetchRegisteredProducts = async () => {
        if (!sellerId) return;

        setLoading(true);
        try {
            const docRef = doc(db, 'ProductRegistrations', sellerId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const allRegistrations = data.registrations || [];

                // Sort by timestamp (newest first)
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

        // Filter by tab
        if (activeTab !== 'All') {
            const statusMap = {
                'Pending QC': 'pending_approval',
                'Approved': 'approved',
                'Rejected': 'rejected'
            };
            filtered = filtered.filter(reg => reg.status === statusMap[activeTab]);
        }

        // Filter by search term
        if (searchTerm) {
            filtered = filtered.filter(reg => {
                const productNames = Object.keys(reg.products || {}).join(' ').toLowerCase();
                const searchLower = searchTerm.toLowerCase();
                return productNames.includes(searchLower) ||
                    reg.segment?.toLowerCase().includes(searchLower) ||
                    reg.category?.toLowerCase().includes(searchLower) ||
                    reg.subcategory?.toLowerCase().includes(searchLower);
            });
        }

        // Sort
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

    const getCategoryPath = (registration) => {
        if (registration.category && registration.subcategory) {
            return `${registration.category} / ${registration.subcategory}`;
        } else if (registration.category) {
            return registration.category;
        } else if (registration.segment) {
            return registration.segment;
        }
        return 'Uncategorized';
    };

    const getFirstProductImage = (products) => {
        const productNames = Object.keys(products || {});
        if (productNames.length === 0) return null;
        const firstProduct = products[productNames[0]];
        return firstProduct.image || null; // Assuming image is a URL or base64 data
    };

    const filteredRegistrations = getFilteredRegistrations();

    if (loading) {
        return (
            <Header title='My Registered Products' />
        );
    }

    return (
        <>
            <Header title='My Registered Products' />
            <div className="catalogue-container">                <div className="tabs-container">
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

            {/* Search and Sort */}
            <div className="controls-container">
                <div className="search-container">
                    <Search className="search-icon" size={20} />
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="registersearch-input"
                        style={{ padding: '0 30px' }}
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

            {/* Products List */}
            <div className="products-list">
                {filteredRegistrations.length === 0 ? (
                    <div className="empty-state">
                        <p>No products found</p>
                    </div>
                ) : (
                    filteredRegistrations.map((registration, index) => {
                        const mainProductName = getMainProductName(registration.products);
                        const categoryPath = getCategoryPath(registration);
                        const statusLabel = getStatusLabel(registration.status);
                        const statusClass = getStatusClass(registration.status);
                        const imageUrl = getFirstProductImage(registration.products);

                        return (
                            <div key={registration.registrationId} className="product-card" >
                                <div className="product-image">
                                    {imageUrl ? <img src={imageUrl} alt={mainProductName} className="product-image-placeholder" /> : <div className="product-image-placeholder"></div>}
                                </div>
                                <div className="product-info">
                                    <h3 className="product-title">{mainProductName}</h3>
                                    <p className="product-category">{categoryPath}</p>
                                    <span className={`status-badge ${statusClass}`}>
                                        {statusLabel}
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
        </>
    );
};

export default MyRegisteredProducts;