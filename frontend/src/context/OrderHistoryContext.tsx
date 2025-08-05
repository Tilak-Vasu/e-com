// src/context/OrderHistoryContext.tsx

import React, { createContext, type ReactNode } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import type { Order } from '../api/types';

interface OrderHistoryContextType {
  orders: Order[];
  addOrder: (order: Order) => void;
}

const OrderHistoryContext = createContext<OrderHistoryContextType | null>(null);
export default OrderHistoryContext;

export const OrderHistoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [orders, setOrders] = useLocalStorage<Order[]>('orderHistory', []);

  const addOrder = (order: Order) => {
    // Add the new order to the beginning of the list
    setOrders(prevOrders => [order, ...prevOrders]);
  };

  const value: OrderHistoryContextType = {
    orders,
    addOrder,
  };

  return <OrderHistoryContext.Provider value={value}>{children}</OrderHistoryContext.Provider>;
};