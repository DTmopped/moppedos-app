import React from 'react';
import { DataProvider } from "/src/contexts/DataContext";
import { Toaster } from "/src/components/ui/toaster";
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
