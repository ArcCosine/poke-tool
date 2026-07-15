import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LegalLayout } from '../components/Legal/LegalLayout';
import { PrivacyPolicy } from '../components/Legal/PrivacyPolicy';

const handleBack = () => {
  window.location.href = '/';
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <LegalLayout>
        <PrivacyPolicy onBack={handleBack} />
      </LegalLayout>
    </StrictMode>
  );
}
