import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/AppHeader';
import AppFooter from '@/components/AppFooter';
import { Toaster } from "@/components/ui/toaster";
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import AppNavigation from '@/components/AppNavigation';
import { views as viewsConfig } from '@/config/views';
import ViewRenderer from '@/components/ViewRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';


const AppLayout = () => {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-50 antialiased">
      <AppHeader views={viewsConfig} />
      <div className="flex flex-1 container mx-auto px-4 py-6 sm:px-6 lg:px-8 w-full max-w-7xl">
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="flex-1 w-full"
          >
             <ScrollArea className="h-[calc(100vh-160px)] md:h-[calc(100vh-120px)] w-full">
                <div className="p-1 md:p-2 lg:p-4">
                    <ViewRenderer viewsConfig={viewsConfig} />
                </div>
            </ScrollArea>
          </motion.main>
        </AnimatePresence>
      </div>
      <AppFooter />
      <Toaster />
    </div>
  );
};

export default AppLayout;
