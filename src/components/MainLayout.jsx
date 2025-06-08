import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from '@/components/AppHeader.jsx';
import AppFooter from '@/components/AppFooter.jsx';
import { ScrollArea } from '@/components/ui/scroll-area';

const MainLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-950 to-black text-slate-50">
      <AppHeader />
      <div className="flex flex-1 container mx-auto px-4 py-8 max-w-7xl">
        <ScrollArea className="flex-1 h-[calc(100vh-120px)] md:h-[calc(100vh-110px)]">
          <main className="flex-1 p-0 md:p-6">
            <Outlet />
          </main>
        </ScrollArea>
      </div>
      <AppFooter />
    </div>
  );
};

export default MainLayout;
