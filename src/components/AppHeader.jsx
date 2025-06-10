import React from 'react';
import { NavLink } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';

const AppHeader = ({ views }) => {
  const navigationViews = views ? views.filter(view => view.showInNav) : [];

  return (
    <header className="bg-slate-900/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-slate-700">
      <div className="container max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-sky-400" />
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
              Mopped OS
            </h1>
          </div>
          <nav className="hidden md:flex items-center space-x-1">
            {navigationViews.map((view) => (
              <Button
                key={view.id}
                variant="ghost"
                asChild
                className="text-sm font-semibold rounded-lg px-3 py-2 transition-all"
              >
                <NavLink
                  to={view.path}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center px-3 py-2 rounded-md transition-colors duration-150",
                      isActive
                        ? "bg-indigo-600/20 text-white shadow-inner"
                        : "text-slate-300 hover:text-white hover:bg-slate-700/40"
                    )
                  }
                >
                  {view.icon && React.cloneElement(view.icon, { size: 16, className: "mr-2" })}
                  {view.label}
                </NavLink>
              </Button>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
