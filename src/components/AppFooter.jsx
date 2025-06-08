import React from 'react';

const AppFooter = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-900/80 backdrop-blur-lg border-t border-slate-700 py-6">
      <div className="container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <p className="text-sm text-slate-400">
          &copy; {currentYear} Mopped OS. All rights reserved.
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Built with Horizon AI
        </p>
      </div>
    </footer>
  );
};

export default AppFooter;