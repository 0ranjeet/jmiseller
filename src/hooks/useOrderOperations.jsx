import { useCallback } from 'react';

export const useOrderOperations = () => {
  const calculateOrderMetrics = useCallback((order) => {
    const totalWastage = parseNumber(order.purity) + parseNumber(order.wastage) + parseNumber(order.specificationMC);
    const setMc = parseNumber(order.setMc);
    const gramMcPerGram = parseNumber(order.netGramMc);
    const specWt = parseNumber(order.specificationWt);
    const specMcPerGram = parseNumber(order.specificationGramRate);

    const totalAmount = setMc + (gramMcPerGram * parseNumber(order.netWt)) + (specMcPerGram * specWt);
    const fineWeight = (parseNumber(order.netWt) * totalWastage) / 100;

    return {
      fineWeight: parseFloat(fineWeight.toFixed(3)),
      totalMc: parseFloat(totalAmount.toFixed(2)),
    };
  }, []);

  const calculateDispatchSummary = useCallback((group) => ({
    totalItems: group.totalItems,
    totalGrossWeight: parseFloat(group.orders.reduce((sum, order) =>
      sum + parseNumber(order.grossWt || order.netWt), 0).toFixed(3)),
    totalPackets: group.orders.length,
  }), []);

  return {
    calculateOrderMetrics,
    calculateDispatchSummary,
  };
};

const parseNumber = (value) => {
  const parsed = parseFloat(value);
  return isNaN(parsed) ? 0 : parsed;
};