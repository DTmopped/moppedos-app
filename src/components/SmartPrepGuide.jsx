import React, { useState } from 'react';
import { Calendar, RefreshCw, Download, ChevronDown } from 'lucide-react';
import { useSmartPrepLogic } from '../hooks/useSmartPrepLogic';
import PrepStationView from './prep/PrepStationView';
import RethermSchedule from './prep/RethermSchedule';
import FinancialImpactDashboard from './prep/FinancialImpactDashboard';
import PrepItemManager from './prep/PrepItemManager';
import AddNewMenuItemWizard from './prep/AddNewMenuItemWizard';
import { exportPrepListToCSV, exportPrepListToPrint } from '../utils/exportPrepList';

const SmartPrepGuide = () => {
  const {
    prepSchedule,
    prepTasks,
    financialImpact,
    loading,
    selectedDate,
    setSelectedDate,
    refreshData,
    tenantId
  } = useSmartPrepLogic();

  const [activeTab, setActiveTab] = useState('prep');
  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExportCSV = () => {
    exportPrepListToCSV(prepTasks, prepSchedule);
    setShowExportMenu(false);
  };

  const handleExportPrint = () => {
    exportPrepListToPrint(prepTasks, prepSchedule);
    setShowExportMenu(false);
  };

  const handleItemsUpdated = () => {
    // Refresh the prep schedule data after adding/removing items
    refreshData();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Smart Prep Guide</h1>
              <p className="mt-1 text-sm text-gray-500">
                Smart logic-based prep planning using historical data and forecasts
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Date Picker */}
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-4 py-2">
                <Calendar className="text-gray-600" size={20} />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:outline-none font-semibold text-gray-900"
                />
              </div>

              {/* Refresh Button */}
              <button
                onClick={refreshData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
              >
                <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportMenu(!showExportMenu)}
                  disabled={!prepTasks || prepTasks.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  <Download size={20} />
                  Export
                  <ChevronDown size={16} />
                </button>

                {showExportMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowExportMenu(false)}
                    />
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={handleExportPrint}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        🖨️ Print Prep List
                      </button>
                      <button
                        onClick={handleExportCSV}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
                      >
                        📊 Download CSV
                      </button>
                    </div>
                  </>
                )}
              </div>

              {/* Add Item to Prep List Button */}
              {prepSchedule && (
                <PrepItemManager
                  prepSchedule={prepSchedule}
                  prepTasks={prepTasks || []}
                  onItemsUpdated={handleItemsUpdated}
                />
              )}

              {/* Add New Menu Item Wizard */}
              {tenantId && (
                <AddNewMenuItemWizard
                  tenantId={tenantId}
                  onItemCreated={handleItemsUpdated}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading && !prepSchedule ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading prep schedule...</p>
            </div>
          </div>
        ) : !prepSchedule ? (
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <p className="text-gray-600 text-lg">No prep schedule available for this date</p>
            <p className="text-gray-500 mt-2">Select a different date or create a new schedule</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Expected Guests</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {prepSchedule.expected_guests || 0}
                    </p>
                  </div>
                  <div className="text-4xl">👥</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Prep Cost</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      ${financialImpact?.total_prep_cost?.toFixed(0) || 0}
                    </p>
                  </div>
                  <div className="text-4xl">💰</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Food Cost %</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {financialImpact?.food_cost_percentage?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="text-4xl">📊</div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Smart Factor</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {prepSchedule.adjustment_factor?.toFixed(2) || 1.00}x
                    </p>
                  </div>
                  <div className="text-4xl">🧠</div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('prep')}
                    className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === 'prep'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Prep Guide
                  </button>
                  <button
                    onClick={() => setActiveTab('retherm')}
                    className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === 'retherm'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Retherm Schedule
                  </button>
                  <button
                    onClick={() => setActiveTab('financial')}
                    className={`px-6 py-4 text-sm font-semibold border-b-2 transition-colors ${
                      activeTab === 'financial'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Financial Impact
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'prep' && (
                  <PrepStationView 
                    prepTasks={prepTasks} 
                    prepSchedule={prepSchedule}
                    onItemRemoved={handleItemsUpdated}
                  />
                )}
                {activeTab === 'retherm' && (
                  <RethermSchedule 
                    prepTasks={prepTasks} 
                    prepSchedule={prepSchedule} 
                  />
                )}
                {activeTab === 'financial' && (
                  <FinancialImpactDashboard 
                    financialImpact={financialImpact}
                    prepSchedule={prepSchedule}
                  />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SmartPrepGuide;
