import React, { useState } from 'react';
import { useAIOrderGuide } from '../hooks/useOrderGuide';

const AIOrderDashboard = () => {
  const locationId = 'a8e559f8-fdb4-435b-bd1f-ccba5d175f2b'; // Your location ID
  const { 
    suggestionsByPriority, 
    summary, 
    isLoading, 
    error, 
    approveOrder, 
    refreshAI 
  } = useAIOrderGuide({ locationId });

  const [approving, setApproving] = useState({});

  const handleApproveOrder = async (item) => {
    setApproving(prev => ({ ...prev, [item.item_name]: true }));
    const result = await approveOrder(item);
    setApproving(prev => ({ ...prev, [item.item_name]: false }));
    
    if (result.success) {
      // Could add a toast notification here
      console.log(`✅ Approved order for ${item.item_name}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-lg text-gray-700">🧠 AI is analyzing your inventory...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto mt-20">
          <h3 className="text-red-800 font-medium text-lg mb-2">🚨 Error Loading AI Suggestions</h3>
          <p className="text-red-600">{error.message}</p>
          <button 
            onClick={refreshAI}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              🧠 AI Order Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Smart inventory management powered by artificial intelligence
            </p>
          </div>
          <button
            onClick={refreshAI}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            🔄 Refresh AI
          </button>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <SummaryCard
          title="Urgent Items"
          value={suggestionsByPriority?.urgent?.length || 0}
          icon="🔴"
          color="red"
          subtitle="Need immediate ordering"
        />
        <SummaryCard
          title="Order Value"
          value={`$${summary?.estimated_order_value?.toLocaleString() || '0'}`}
          icon="💰"
          color="green"
          subtitle="Total estimated cost"
        />
        <SummaryCard
          title="Vendors"
          value={summary?.vendors_needed || 0}
          icon="🚚"
          color="blue"
          subtitle="Delivery coordination"
        />
        <SummaryCard
          title="AI Confidence"
          value="94%"
          icon="🧠"
          color="purple"
          subtitle="Based on sales patterns"
        />
      </div>

      {/* AI Insights Panel */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-xl">🧠</span>
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">AI Insights</h3>
            <p className="text-gray-600">Smart recommendations based on your usage patterns</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InsightCard
            insight="High usage items prioritized"
            action="Smart PAR calculations active"
            impact="Prevents stockouts on key items"
          />
          <InsightCard
            insight="Vendor cost optimization enabled"
            action="Comparing prices across suppliers"
            impact="Maximizes cost savings"
          />
          <InsightCard
            insight="Real-time inventory tracking"
            action="Updates based on current stock"
            impact="Accurate order suggestions"
          />
        </div>
      </div>

      {/* Priority Order Sections */}
      <div className="space-y-6">
        {suggestionsByPriority?.urgent?.length > 0 && (
          <PrioritySection
            title="🔴 URGENT - Order Today"
            items={suggestionsByPriority.urgent}
            color="red"
            bgColor="bg-red-50 border-red-200"
            onApprove={handleApproveOrder}
            approving={approving}
          />
        )}
        
        {suggestionsByPriority?.high?.length > 0 && (
          <PrioritySection
            title="🟡 HIGH - Order This Week"
            items={suggestionsByPriority.high}
            color="orange"
            bgColor="bg-orange-50 border-orange-200"
            onApprove={handleApproveOrder}
            approving={approving}
          />
        )}
        
        {suggestionsByPriority?.normal?.length > 0 && (
          <PrioritySection
            title="🟢 NORMAL - Upcoming Needs"
            items={suggestionsByPriority.normal}
            color="green"
            bgColor="bg-green-50 border-green-200"
            onApprove={handleApproveOrder}
            approving={approving}
          />
        )}
      </div>

      {/* No Suggestions Message */}
      {(!suggestionsByPriority?.urgent?.length && 
        !suggestionsByPriority?.high?.length && 
        !suggestionsByPriority?.normal?.length) && (
        <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">All Stocked Up!</h3>
          <p className="text-gray-600 text-lg">
            Your inventory levels look great. No orders needed at this time.
          </p>
        </div>
      )}
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ title, value, icon, color, subtitle }) => {
  const colorClasses = {
    red: 'bg-red-50 border-red-200 text-red-800',
    green: 'bg-green-50 border-green-200 text-green-800',
    blue: 'bg-blue-50 border-blue-200 text-blue-800',
    purple: 'bg-purple-50 border-purple-200 text-purple-800',
    orange: 'bg-orange-50 border-orange-200 text-orange-800'
  };

  return (
    <div className={`rounded-xl border p-6 ${colorClasses[color] || colorClasses.blue}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-2xl">{icon}</span>
        <div className="text-right">
          <div className="text-2xl font-bold">{value}</div>
        </div>
      </div>
      <div className="text-sm font-medium mb-1">{title}</div>
      <div className="text-xs opacity-75">{subtitle}</div>
    </div>
  );
};

// Insight Card Component
const InsightCard = ({ insight, action, impact }) => {
  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100">
      <div className="text-sm font-medium text-gray-900 mb-2">{insight}</div>
      <div className="text-xs text-blue-600 mb-2">→ {action}</div>
      <div className="text-xs text-gray-600">{impact}</div>
    </div>
  );
};

// Priority Section Component
const PrioritySection = ({ title, items, color, bgColor, onApprove, approving }) => {
  return (
    <div className={`rounded-xl border p-6 ${bgColor}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-600">({items.length} items)</span>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => (
          <OrderItemCard
            key={`${item.item_name}-${index}`}
            item={item}
            onApprove={onApprove}
            isApproving={approving[item.item_name]}
          />
        ))}
      </div>
    </div>
  );
};

// Order Item Card Component
const OrderItemCard = ({ item, onApprove, isApproving }) => {
  return (
    <div className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm mb-1">{item.item_name}</h4>
          <p className="text-xs text-gray-600">{item.best_vendor}</p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-gray-900">
            {item.cases_needed}
          </div>
          <div className="text-xs text-gray-600">cases</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div>
          <span className="text-gray-500">Current:</span>
          <div className="font-medium">{item.current_stock}</div>
        </div>
        <div>
          <span className="text-gray-500">Smart PAR:</span>
          <div className="font-medium">{Math.round(item.smart_par)}</div>
        </div>
        <div>
          <span className="text-gray-500">Total Units:</span>
          <div className="font-medium">{item.total_units}</div>
        </div>
        <div>
          <span className="text-gray-500">Cost:</span>
          <div className="font-medium">${item.total_cost?.toFixed(2)}</div>
        </div>
      </div>
      
      <button
        onClick={() => onApprove(item)}
        disabled={isApproving}
        className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isApproving ? '⏳ Approving...' : '✓ Approve Order'}
      </button>
    </div>
  );
};

export default AIOrderDashboard;
