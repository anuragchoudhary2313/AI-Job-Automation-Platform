import { FeatureProvider } from '../contexts/FeatureContext';
import { MainLayout } from '../components/layout/MainLayout';

export default function ProtectedAppShell() {
  return (
    <FeatureProvider>
      <MainLayout />
    </FeatureProvider>
  );
}
