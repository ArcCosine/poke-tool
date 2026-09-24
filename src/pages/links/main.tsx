import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from '../../context/AppContext';
import { LinksPage } from './LinksPage';
import 'virtual:uno.css';
import '../../index.css';

const LinksApp = () => {
  return <LinksPage />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <AppProvider>
        <LinksApp />
      </AppProvider>
    </StrictMode>
  );
}

export default LinksApp;
