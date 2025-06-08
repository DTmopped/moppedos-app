import React from 'react';
import { DataProvider } from "contexts/DataContext";
import { Toaster } from "components/ui/toaster.jsx";
import { LazyMotion, domAnimation } from "framer-motion";

const AppProviders = ({ children }) => {
  return (
    <LazyMotion features={domAnimation}>
      <DataProvider>
        {children}
        <Toaster />
      </DataProvider>
    </LazyMotion>
  );
};

export default AppProviders;
