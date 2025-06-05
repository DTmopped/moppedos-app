import React from 'react';
import AppRouter from './AppRouter';
import AppProviders from './AppProviders';

function App() {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}

export default App;
