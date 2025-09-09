import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Zap, LogOut } from 'lucide-react';
import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabaseClient';

const AppHeader = ({ views }) => {
  const navigationViews = views ? views.filter(view => view.showInNav) : [];
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login");
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-lg shadow-lg sticky top-0 z-50 border-b border-slate-700">
      <div className="container max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo + Nav */}
          <div className="flex items-center space-x-3">
            <Zap className="h-8 w-8 text-sky-400" />
            <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-indigo-500">
              Mopped OS
            </h1>
          </div>

          {/* Navigation Links */}
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

            {/* 🔒 Logout Button */}
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="text-sm text-red-400 hover:text-red-600 flex items-center px-3 py-2"
            >
              <LogOut size={16} className="mr-2" />
              Log Out
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default AppHeader;
