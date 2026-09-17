import type React from 'react';
import { AppProvider } from '../../context/AppContext';
import { AuthProvider } from '../../context/AuthContext';
import { Layout } from '../common/Layout';
import 'virtual:uno.css';
import '../../index.css';

export const LegalLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  return (
    <AppProvider>
      <AuthProvider>
        <Layout activePage="legal">{children}</Layout>
      </AuthProvider>
    </AppProvider>
  );
};
