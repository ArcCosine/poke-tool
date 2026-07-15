import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Disclaimer } from '../components/Legal/Disclaimer';
import { LegalLayout } from '../components/Legal/LegalLayout';

const handleBack = () => {
  window.location.href = '/';
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <LegalLayout>
        <Disclaimer onBack={handleBack} />
      </LegalLayout>
    </StrictMode>
  );
}
