import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Layout } from '../../components/common/Layout';
import { EvCalculator } from '../../components/EvCalculator/EvCalculator';
import { AppProvider } from '../../context/AppContext';
import 'virtual:uno.css';
import '../../index.css';

const EvCalculatorApp = () => {
  return (
    <Layout activePage="evCalculator">
      <EvCalculator
        onImportComplete={() => {
          window.location.href = '/party.html';
        }}
      />
    </Layout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProvider>
        <EvCalculatorApp />
      </AppProvider>
    </StrictMode>
  );
}

export default EvCalculatorApp;
