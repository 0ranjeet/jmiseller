import React from 'react';
import { OrderGroupCard } from './OrderGroupCard';

export const OrderGroupList = React.memo(({ 
  groups, 
  expandedGroup, 
  onToggleGroup, 
  onSecureDispatch, 
  calculateDispatchSummary 
}) => {
  return (
    <div className="seller-orders-container">
      {groups.map((group) => (
        <OrderGroupCard
          key={group.groupKey}
          group={group}
          isExpanded={expandedGroup === group.groupKey}
          onToggle={onToggleGroup}
          onSecureDispatch={onSecureDispatch}
          calculateDispatchSummary={calculateDispatchSummary}
        />
      ))}
    </div>
  );
});