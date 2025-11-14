import React from 'react';
import { formatWeight, getQuantity } from '../utils/formatters';

export const OrderItem = React.memo(({ order }) => {
  const imageUrl = order.images?.[0]?.url?.trim();
  const orderWeight = formatWeight(order.orderWeight || order.grossWt || order.netWt);

  return (
    <div className="order-item">
      <div className="item-image">
        {imageUrl ? (
          <img src={imageUrl} alt={order.productName || 'Product'} />
        ) : (
          <div className="image-placeholder">No Image</div>
        )}
      </div>
      <div className="item-details">
        <h4 className="item-name">{order.productName || 'Unnamed Product'}</h4>
        <div className="item-specs">
          <span className="purity">{order.category || 'N/A'}</span>
          <span className="weight">• {orderWeight}</span>
          <span className="quantity">• Qty {getQuantity(order)}</span>
        </div>
        <div className="item-metrics">
          <span>Fine Wt: {order.fineWeight.toFixed(3)}g</span>
          <span>MC: ₹{order.totalMc.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
});