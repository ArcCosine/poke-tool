import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Layout } from '../../components/common/Layout';
import { StatSearch } from '../../components/StatSearch/StatSearch';
import { AppProvider } from '../../context/AppContext';
import 'virtual:uno.css';
import '../../index.css';

const RankingApp = () => {
  return (
    <Layout activePage="ranking">
      <StatSearch />
    </Layout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProvider>
        <RankingApp />
      </AppProvider>
    </StrictMode>
  );
}

export default RankingApp;
