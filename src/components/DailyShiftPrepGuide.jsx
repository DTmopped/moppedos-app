import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select.jsx';
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog.jsx';
import { 
  Printer, 
  Settings, 
  Lightbulb, 
  Calendar,
  Clock,
  ChefHat,
  Utensils,
  Download,
  TrendingUp,
  Sun,
  Cloud,
  CloudRain,
  Zap
} from 'lucide-react';
import { useSmartPrepGuide } from '@/hooks/useSmartPrepGuide.js';

const DailyShiftPrepGuide = () => {
  const {
    smartPrepData,
    adjustmentFactor,
    prepInsights,
    selectedTemplate,
    setSelectedTemplate,
    weatherCondition,
    setWeatherCondition,
    wasteOptimization,
    setWasteOptimization,
    crossUtilization,
    setCrossUtilization,
    exportPrepGuide,
    availableTemplates,
    currentTemplate
  } = useSmartPrepGuide();

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Calculate summary statistics
  const totalDays = smartPrepData.length;
  const avgGuests = smartPrepData.reduce((sum, day) => sum + day.totalGuests, 0) / totalDays || 0;
  const totalInsights = prepInsights.length;
  const avgPrepTime = smartPrepData.reduce((sum, day) => {
    const dayPrepTime = Object.values(day.shifts).reduce((shiftSum, shift) => 
      shiftSum + shift.estimatedPrepTime, 0);
    return sum + dayPrepTime;
  }, 0) / totalDays || 0;

  const handlePrint = () => {
    window.print();
  };

  const handleExport = (format) => {
    const exportData = exportPrepGuide(format);
    
    if (format === 'text') {
      const blob = new Blob([exportData], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `smart-prep-guide-${selectedTemplate}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const getWeatherIcon = (condition) => {
    switch(condition) {
      case 'sunny': return <Sun className="h-4 w-4" />;
      case 'cloudy': return <Cloud className="h-4 w-4" />;
      case 'rainy': return <CloudRain className="h-4 w-4" />;
      case 'stormy': return <Zap className="h-4 w-4" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  // Show loading state if no data yet
  if (!smartPrepData || smartPrepData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="glassmorphic-card border-blue-500/20 p-8">
              <CardContent className="text-center">
                <ChefHat className="mx-auto h-12 w-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold text-slate-200 mb-2">
                  Loading Smart Prep Guide
                </h3>
                <p className="text-slate-400">
                  Analyzing forecast data and generating intelligent prep recommendations...
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - Consistent with other pages */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500 flex items-center gap-3">
                <ChefHat className="text-blue-400" size={40} />
                Smart Prep Guide
              </h1>
              <p className="text-slate-300 mt-2 flex items-center gap-2">
                Intelligent prep planning • {currentTemplate.icon} {currentTemplate.name}
                {getWeatherIcon(weatherCondition)}
                <span className="capitalize">{weatherCondition}</span>
              </p>
            </div>
            
            <div className="flex gap-3">
              <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10 hover:border-blue-400">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] glassmorphic-card border-slate-700/50">
                  <DialogHeader>
                    <DialogTitle className="text-blue-400">Smart Prep Guide Settings</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    {/* Restaurant Template */}
                    <div>
                      <label className="text-sm font-medium text-slate-200 mb-2 block">
                        Restaurant Template
                      </label>
                      <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600/50">
                          {availableTemplates.map(template => (
                            <SelectItem key={template} value={template} className="text-slate-200 hover:bg-slate-700">
                              {currentTemplate.icon} {currentTemplate.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Weather Condition */}
                    <div>
                      <label className="text-sm font-medium text-slate-200 mb-2 block">
                        Weather Condition
                      </label>
                      <Select value={weatherCondition} onValueChange={setWeatherCondition}>
                        <SelectTrigger className="bg-slate-800/50 border-slate-600/50 text-slate-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-600/50">
                          <SelectItem value="sunny" className="text-slate-200 hover:bg-slate-700">☀️ Sunny</SelectItem>
                          <SelectItem value="cloudy" className="text-slate-200 hover:bg-slate-700">☁️ Cloudy</SelectItem>
                          <SelectItem value="rainy" className="text-slate-200 hover:bg-slate-700">🌧️ Rainy</SelectItem>
                          <SelectItem value="stormy" className="text-slate-200 hover:bg-slate-700">⛈️ Stormy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Smart Features */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <div>
                          <label className="text-sm font-medium text-slate-200">
                            Waste Optimization
                          </label>
                          <p className="text-xs text-slate-400">
                            Adjust quantities based on shelf life
                          </p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={wasteOptimization} 
                          onChange={(e) => setWasteOptimization(e.target.checked)}
                          className="h-4 w-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                        <div>
                          <label className="text-sm font-medium text-slate-200">
                            Cross-Utilization
                          </label>
                          <p className="text-xs text-slate-400">
                            Suggest ingredient sharing opportunities
                          </p>
                        </div>
                        <input 
                          type="checkbox"
                          checked={crossUtilization} 
                          onChange={(e) => setCrossUtilization(e.target.checked)}
                          className="h-4 w-4 text-blue-500 bg-slate-700 border-slate-600 rounded focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600">
                        Apply Settings
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Button 
                onClick={() => handleExport('text')} 
                variant="outline" 
                className="border-green-500/50 text-green-400 hover:bg-green-500/10 hover:border-green-400"
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>

              <Button 
                onClick={handlePrint} 
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                <Printer className="mr-2 h-4 w-4" />
                Print / PDF
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Summary Cards - Consistent with dashboard styling */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <Card className="glassmorphic-card border-blue-500/20 card-hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Avg Daily Guests
              </CardTitle>
              <Utensils className="h-4 w-4 text-blue-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-500">
                {avgGuests.toFixed(0)}
              </div>
              <p className="text-xs text-slate-400">
                Smart factor: {adjustmentFactor.toFixed(2)}x
              </p>
            </CardContent>
          </Card>

          <Card className="glassmorphic-card border-green-500/20 card-hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Planning Days
              </CardTitle>
              <Calendar className="h-4 w-4 text-green-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-500">
                {totalDays}
              </div>
              <p className="text-xs text-slate-400">
                Days scheduled
              </p>
            </CardContent>
          </Card>

          <Card className="glassmorphic-card border-yellow-500/20 card-hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Smart Insights
              </CardTitle>
              <Lightbulb className="h-4 w-4 text-yellow-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                {totalInsights}
              </div>
              <p className="text-xs text-slate-400">
                Optimization tips
              </p>
            </CardContent>
          </Card>

          <Card className="glassmorphic-card border-purple-500/20 card-hover-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-200">
                Avg Prep Time
              </CardTitle>
              <Clock className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500">
                {avgPrepTime.toFixed(1)}h
              </div>
              <p className="text-xs text-slate-400">
                Per day estimate
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Smart Insights Panel */}
        {prepInsights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <Card className="glassmorphic-card border-yellow-500/20 card-hover-glow">
              <CardHeader>
                <CardTitle className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-yellow-400" />
                  Smart Insights & Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {prepInsights.slice(0, 6).map((insight, index) => (
                    <div key={index} className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-lg border border-slate-700/50">
                      <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 rounded border border-blue-500/30">
                        {insight.type}
                      </span>
                      <p className="text-sm text-slate-300 flex-1">
                        {insight.message}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Daily Prep Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {smartPrepData.map((dayData, index) => (
            <motion.div
              key={dayData.date}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="glassmorphic-card border-slate-600/50 h-full card-hover-glow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-slate-100 to-slate-300">
                        {new Date(dayData.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </CardTitle>
                      <p className="text-sm text-slate-400">
                        {dayData.totalGuests.toFixed(0)} guests • Factor: {dayData.smartFactor.factor.toFixed(2)}x
                      </p>
                    </div>
                    <span className="text-xs px-3 py-1 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 text-blue-400 rounded-full border border-blue-500/30">
                      {currentTemplate.icon} {currentTemplate.name}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {Object.entries(dayData.shifts).map(([shiftKey, shiftData]) => (
                      <div key={shiftKey} className="border border-slate-600/50 rounded-lg p-4 bg-slate-800/30">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className={`font-medium ${shiftData.color} flex items-center gap-2`}>
                            <Clock className="h-4 w-4" />
                            {shiftData.name}
                          </h4>
                          <span className="text-xs px-2 py-1 bg-slate-700/50 text-slate-300 rounded border border-slate-600/50">
                            {shiftData.totalItems} items
                          </span>
                        </div>
                        
                        {/* Group items by category */}
                        {Object.entries(
                          shiftData.prepItems.reduce((acc, item) => {
                            if (!acc[item.category]) acc[item.category] = [];
                            acc[item.category].push(item);
                            return acc;
                          }, {})
                        ).map(([category, items]) => (
                          <div key={category} className="mb-3">
                            <h5 className="text-sm font-medium text-slate-300 mb-2 flex items-center gap-2">
                              <span>{items[0]?.categoryIcon}</span>
                              {category}
                            </h5>
                            <div className="grid grid-cols-1 gap-1 text-xs">
                              {items.slice(0, 5).map(item => (
                                <div key={item.id} className="flex justify-between text-slate-400 py-1 px-2 bg-slate-800/50 rounded">
                                  <span>{item.name}</span>
                                  <span className="font-mono">{item.quantity} {item.unit}</span>
                                </div>
                              ))}
                              {items.length > 5 && (
                                <div className="text-slate-500 text-center py-1">
                                  +{items.length - 5} more items
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DailyShiftPrepGuide;
