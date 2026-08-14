'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from './api';
import type { CustomerSessionDto } from '@sdm/shared';

interface CustomerContextType {
  session: CustomerSessionDto | null;
  isLoading: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<CustomerSessionDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSession() {
      try {
        const data = await api.get<CustomerSessionDto | null>('/customer/session');
        setSession(data);
      } catch (error) {
        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSession();
  }, []);

  return (
    <CustomerContext.Provider value={{ session, isLoading }}>
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomerSession() {
  const context = useContext(CustomerContext);
  if (context === undefined) {
    throw new Error('useCustomerSession must be used within a CustomerProvider');
  }
  return context;
}
