import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { MainApp } from './MainApp';

function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;
