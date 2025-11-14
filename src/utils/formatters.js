export const formatDate = (dateValue) => {
  if (!dateValue) return 'N/A';
  const date = dateValue?.seconds ? new Date(dateValue.seconds * 1000) : new Date(dateValue);
  return isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
};

export const formatWeight = (weight) => weight ? `${parseFloat(weight).toFixed(2)}g` : 'N/A';

export const getQuantity = (order) => order.orderPiece ? parseInt(order.orderPiece) : 1;