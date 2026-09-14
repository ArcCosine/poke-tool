import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Layout } from '../../components/common/Layout';
import { PartySimulator } from '../../components/PartySimulator/PartySimulator';
import { AppProvider } from '../../context/AppContext';
import 'virtual:uno.css';
import '../../index.css';

const PartyApp = () => {
  return (
    <Layout activePage="party">
      <PartySimulator />
    </Layout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProvider>
        <PartyApp />
      </AppProvider>
    </StrictMode>
  );
}

export default PartyApp;
