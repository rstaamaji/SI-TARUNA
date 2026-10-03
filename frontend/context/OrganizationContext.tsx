'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import organizationService, { OrganizationConfig } from '@/services/organization';

interface OrganizationContextType {
  config: OrganizationConfig;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (data: Partial<OrganizationConfig>) => Promise<void>;
}

export const DEFAULT_ORG_CONFIG: OrganizationConfig = {
  orgName: 'Karang Taruna Setya Bakti',
  logoUrl: '/assets/logo.png',
  phone: '0812-3456-7890',
  email: 'setyabakti.tukuluh@gmail.com',
  socialMedia: '@karangtaruna_setyabakti',
  address: 'Dusun Tuk Uluh, Desa Sringin, Kec. Jumantono, Kab. Karanganyar, Jawa Tengah',
  hamlet: 'Tuk Uluh',
  village: 'Sringin',
  subDistrict: 'Jumantono',
  district: 'Karanganyar',
  period: '2024 - 2027',
  description: 'Wadah pembinaan dan pengembangan generasi muda Dusun Tuk Uluh, Desa Sringin, Kecamatan Jumantono.',
};

const OrganizationContext = createContext<OrganizationContextType>({
  config: DEFAULT_ORG_CONFIG,
  isLoading: false,
  error: null,
  refreshConfig: async () => {},
  updateConfig: async () => {},
});

export const OrganizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<OrganizationConfig>(DEFAULT_ORG_CONFIG);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await organizationService.getConfig();
      if (data) {
        setConfig(data);
      }
      setError(null);
    } catch (err: any) {
      console.warn('Failed to load live organization config, using default:', err.message);
      // Fallback to default
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (data: Partial<OrganizationConfig>) => {
    const updated = await organizationService.updateConfig(data);
    setConfig(updated);
  };

  return (
    <OrganizationContext.Provider
      value={{
        config,
        isLoading,
        error,
        refreshConfig: fetchConfig,
        updateConfig,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
};

export const useOrganization = () => useContext(OrganizationContext);
export default useOrganization;
