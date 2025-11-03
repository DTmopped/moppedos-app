import React, { useState } from 'react';
import { Calendar, RefreshCw, Download, ChevronDown, Sparkles } from 'lucide-react';
import { useSmartPrepLogic } from '../hooks/useSmartPrepLogic';
import PrepStationView from './prep/PrepStationView';
import RethermSchedule from './prep/RethermSchedule';
import FinancialImpactDashboard from './prep/FinancialImpactDashboard';
import AddNewMenuItemWizard from './prep/AddNewMenuItemWizard';
import { exportPrepListToCSV, exportPrepListToPrint } from '../utils/exportPrepList';

const SmartPrepGuide = () => {
  const {
    prepSchedule,
    prepTasks,
    financialImpact,
    forecastData,
    loading,
    generating,
    selectedDate,
    setSelectedDate,
    refreshData,
    generatePrepSchedule,
    getSuggestedGuestCount,
    tenantId
  } = useSmartPrepLogic();

  const [activeTab, setActiveTab] = useState('prep');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [guestCountInput, setGuestCountInput] = useState('');

  const handleExportCSV = () => {
    exportPrepListToCSV(prepTasks, prepSchedule);
    setShowExportMenu(false);
  };

  const handleExportPrint = () => {
    exportPrepListToPrint(prepTasks, prepSchedule);
    setShowExportMenu(false);
  };

  const handleItemsUpdated = () => {
    refreshData();
  };

  const handleGenerateClick = () => {
    const suggestedGuests = getSuggestedGuestCount();
    setGuestCountInput(suggestedGuests.toString());
    setShowGenerateModal(true);
  };

  const handleGenerateConfirm = async () => {
    const guestCount = parseInt(guestCountInput);
    if (isNaN(guestCount) || guestCount <= 0) {
      alert('Please enter a valid guest count');
      return;
    }

    const result = await generatePrepSchedule(guestCount);
    
    if (result.success) {
      setShowGenerateModal(false);
      // Success feedback could be added here
    } else {
      alert(`Error generating schedule: ${result.error}`);
    }
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

              {/* Generate Schedule Button */}
              <button
                onClick={handleGenerateClick}
                disabled={loading || generating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold"
              >
                <Sparkles size={20} className={generating ? 'animate-pulse' : ''} />
                {prepSchedule ? 'Regenerate' : 'Generate Schedule'}
              </button>

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
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowExportMenu(false)}
                    />
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

              {/* Add New Menu Item Wizard */}
              {tenantId && (
                <AddNewMenuItemWizard
                  tenantId={tenantId}
                  onItemCreated={handleItemsUpdated}
                  prepSchedule={prepSchedule}
                  selectedDate={selectedDate}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Generate Schedule Modal */}
      {showGenerateModal && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setShowGenerateModal(false)}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {prepSchedule ? 'Regenerate Prep Schedule' : 'Generate Prep Schedule'}
              </h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Expected Guest Count
                </label>
                <input
                  type="number"
                  value={guestCountInput}
                  onChange={(e) => setGuestCountInput(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter guest count"
                  min="1"
                />
                
                {forecastData && (
                  <p className="mt-2 text-sm text-gray-600">
                    📊 Forecast suggests: <strong>{getSuggestedGuestCount()} guests</strong>
                    {forecastData.am_guests && forecastData.pm_guests && (
                      <span className="text-gray-500">
                        {' '}(AM: {forecastData.am_guests}, PM: {forecastData.pm_guests})
                      </span>
                    )}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-blue-900 mb-2">🧠 Smart Calculation</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Uses prep rules and day-of-week multipliers</li>
                  <li>✓ Applies batch sizing and min/max constraints</li>
                  <li>✓ Assigns tasks to prep stations automatically</li>
                </ul>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateConfirm}
                  disabled={generating}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 font-semibold"
                >
                  {generating ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

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
            <div className="text-6xl mb-4">📋</div>
            <p className="text-gray-900 text-xl font-semibold mb-2">No prep schedule for this date</p>
            <p className="text-gray-600 mb-6">Click "Generate Schedule" to create a smart prep plan</p>
            <button
              onClick={handleGenerateClick}
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
            >
              <Sparkles size={20} />
              Generate Schedule
            </button>
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
