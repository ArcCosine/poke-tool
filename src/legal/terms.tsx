import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LegalLayout } from '../components/Legal/LegalLayout';
import { TermsOfService } from '../components/Legal/TermsOfService';

const handleBack = () => {
  window.location.href = '/index.html';
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <LegalLayout>
        <TermsOfService onBack={handleBack} />
      </LegalLayout>
    </StrictMode>
  );
}
