import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Layout } from '../../components/common/Layout';
import { PartyRanking } from '../../components/PartyRanking/PartyRanking';
import { AppProvider } from '../../context/AppContext';
import 'virtual:uno.css';
import '../../index.css';

const PartyRankingApp = () => {
  return (
    <Layout activePage="partyRanking">
      <PartyRanking />
    </Layout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProvider>
        <PartyRankingApp />
      </AppProvider>
    </StrictMode>
  );
}

export default PartyRankingApp;
