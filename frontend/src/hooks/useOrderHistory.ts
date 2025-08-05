// src/hooks/useOrderHistory.ts

import { useContext } from 'react';
import OrderHistoryContext from '../context/OrderHistoryContext';

const useOrderHistory = () => {
  const context = useContext(OrderHistoryContext);

  if (context === null) {
    // This check prevents the blank page crash.
    throw new Error('useOrderHistory must be used within an OrderHistoryProvider');
  }

  return context;
};

export default useOrderHistory;