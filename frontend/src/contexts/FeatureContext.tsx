import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface FeatureFlags {
  ai_resume: boolean;
  ai_cover_letter: boolean;
  email_automation: boolean;
  job_scraping: boolean;
  auto_apply: boolean;
  teams: boolean;
  admin_panel: boolean;
}

const defaultFeatures: FeatureFlags = {
  ai_resume: false,
  ai_cover_letter: false,
  email_automation: false,
  job_scraping: false,
  auto_apply: false,
  teams: false,
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
    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/v1/features/');
        if (response.ok) {
          const data = await response.json();
          setFeatures(data);
        } else {
          console.error('Failed to fetch feature flags');
        }
      } catch (error) {
        console.error('Error fetching feature flags:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatures();
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
