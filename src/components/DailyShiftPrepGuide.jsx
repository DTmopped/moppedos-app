import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Printer, ChefHat } from 'lucide-react';

const DailyShiftPrepGuide = () => {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center gap-3">
            <ChefHat className="text-blue-400" size={40} />
            Smart Prep Guide
          </h1>
          <p className="text-slate-300 mt-2">
            Intelligent prep planning system
          </p>
        </div>
        
        <Card className="glassmorphic-card">
          <CardHeader>
            <CardTitle className="text-blue-400">Prep Guide Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-300">Smart prep guide is being configured...</p>
            <Button onClick={handlePrint} className="mt-4">
              <Printer className="mr-2 h-4 w-4" />
              Print / PDF
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DailyShiftPrepGuide;
