import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import axios from 'axios';
import apiClient from '../lib/api';

interface FeatureFlags {
  ai_resume: boolean;
  ai_cover_letter: boolean;
  email_automation: boolean;
  job_scraping: boolean;
  auto_apply: boolean;
  admin_panel: boolean;
}

const defaultFeatures: FeatureFlags = {
  ai_resume: false,
  ai_cover_letter: false,
  email_automation: false,
  job_scraping: false,
  auto_apply: false,
  admin_panel: false,
};

interface FeatureContextType {
  features: FeatureFlags;
  isLoading: boolean;
  isEnabled: (feature: keyof FeatureFlags) => boolean;
}

const FeatureContext = createContext<FeatureContextType>({
  features: defaultFeatures,
  isLoading: true,
  isEnabled: () => false,
});

export const FeatureProvider = ({ children }: { children: ReactNode }) => {
  const [features, setFeatures] = useState<FeatureFlags>(defaultFeatures);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    const fetchFeatures = async () => {
      try {
        // Do not block app startup for long if backend is unavailable.
        const response = await apiClient.get<FeatureFlags>('/features/', {
          timeout: 4000,
          signal: controller.signal,
          _suppressGlobalErrorToast: true,
        });
        setFeatures(response.data);
      } catch (error: unknown) {
        // Use defaults quietly when the feature endpoint is slow or offline.
        if (axios.isAxiosError(error) && (error.code === 'ECONNABORTED' || !error.response)) {
          // Expected when backend is unavailable; defaults are intentionally used.
        } else if (!axios.isCancel(error)) {
          console.error('Error fetching feature flags:', error);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatures();

    return () => {
      controller.abort();
    };
  }, []);

  const isEnabled = (feature: keyof FeatureFlags) => {
    return features[feature] ?? false;
  };

  return (
    <FeatureContext.Provider value={{ features, isLoading, isEnabled }}>
      {children}
    </FeatureContext.Provider>
  );
};

export const useFeatures = () => useContext(FeatureContext);
