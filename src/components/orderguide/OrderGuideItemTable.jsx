// src/components/orderguide/OrderGuideItemTable.jsx
import React, { useState } from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/supabaseClient';
import { AlertTriangle, HelpCircle } from 'lucide-react';

/**
 * Inline editing:
 * - Actual (on_hand): anyone can edit
 * - Forecast (PAR): Admin Mode only
 * We intentionally use UNCONTROLLED inputs (defaultValue + onBlur)
 * so typing is never blocked by React state.
 */
const OrderGuideItemTable = ({
  items = [],
  categoryTitle,
  getStatusClass = () => '',
  getStatusIcon = () => null,
  isParCategory,
  locationId,
  onRefresh,
}) => {
  const { isAdminMode } = useData();
  const [working, setWorking] = useState({}); // { [itemId]: 'on_hand' | 'par' }

  const callEdge = async (fnName, payload) => {
    return supabase.functions.invoke(fnName, { body: payload });
  };

  // Replace the updateOnHand function with this:
const updateOnHand = async (row, newVal ) => {
  if (!row.item_id || !locationId) return;
  setWorking((w) => ({ ...w, [row.item_id]: 'on_hand' }));
  try {
    const { error } = await supabase
      .from('order_guide_status')
      .upsert({
        item_id: row.item_id,
        location_id: locationId,
        on_hand: Number(newVal),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'item_id,location_id'
      });
    
    if (error) throw error;
    onRefresh?.();
  } catch (error) {
    console.error('Error updating on_hand:', error);
  } finally {
    setWorking((w) => {
      const c = { ...w };
      delete c[row.item_id];
      return c;
    });
  }
};


  const updateParLevel = async (row, newVal) => {
    if (!isAdminMode || !row.item_id || !locationId) return;
    setWorking((w) => ({ ...w, [row.item_id]: 'par' }));
    try {
      await callEdge('update-par-level', {
        item_id: row.item_id,
        location_id: locationId,
        par_level: Number(newVal),
      });
      onRefresh?.();
    } finally {
      setWorking((w) => {
        const c = { ...w };
        delete c[row.item_id];
        return c;
      });
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="text-left px-4 py-2 font-semibold">Item</th>
            <th className="text-right px-4 py-2 font-semibold">Forecast (PAR)</th>
            <th className="text-right px-4 py-2 font-semibold">Actual (On Hand)</th>
            <th className="text-right px-4 py-2 font-semibold">Variance</th>
            <th className="text-left px-4 py-2 font-semibold">Unit</th>
            <th className="text-left px-4 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((row, idx) => {
            const statusLower = (row.status || '').toLowerCase();
            const isParItem = statusLower === 'par item'; // legacy tag; optional
            const busy = !!working[row.item_id];

            // Use numeric fallbacks for display only
            const forecast0 = Number(row.forecast ?? 0);
            const actual0 = Number(row.actual ?? 0);
            const variance0 = Number((actual0 - forecast0).toFixed(1));

            return (
              <tr key={`${row.item_id ?? row.item_name ?? row.name}-${idx}`}
 className="border-b dark:border-gray-700">
                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap bg-yellow-50">
                  {row.item_name || row.name || 'Unnamed'}
                  {isParItem && (
                    <span className="ml-2 inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      PAR Item
                    </span>
                  )}
                </td>

                {/* Forecast (PAR) - Admin only */}
                <td className="px-4 py-2 bg-yellow-50 text-right">
                  <input
                    type="number"
                    className={`w-24 rounded border border-gray-300 px-2 py-1 text-right ${
                      !isAdminMode ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                    }`}
                    defaultValue={forecast0}
                    onBlur={(e) => {
                      if (!isAdminMode) return;
                      updateParLevel(row, e.target.value);
                    }}
                    readOnly={!isAdminMode}
                    disabled={busy}
                  />
                </td>

                {/* Actual (On Hand) */}
                <td className="px-4 py-2 bg-yellow-50 text-right">
                  <input
                    type="number"
                    className="w-24 rounded border border-gray-300 px-2 py-1 text-right"
                    defaultValue={actual0}
                    onBlur={(e) => updateOnHand(row, e.target.value)}
                    disabled={busy}
                  />
                </td>

                {/* Variance (view-only; recalculated on server after save) */}
                <td className={`px-4 py-2 bg-yellow-50 text-right ${getStatusClass({ ...row, forecast: forecast0, actual: actual0 })}`}>
                  {variance0}
                </td>

                {/* Unit */}
                <td className="px-4 py-2 bg-yellow-50">{row.unit}</td>

                {/* Status pill/icon */}
                <td className="px-4 py-2 bg-yellow-50">
                  <span className="inline-flex items-center gap-1">
                    {getStatusIcon({ ...row, forecast: forecast0, actual: actual0 })}
                    <span className="capitalize">{row.status || 'auto'}</span>
                  </span>
                </td>
              </tr>
            );
          })}

          {items.length === 0 && (
            <tr>
              <td colSpan={6} className="px-4 py-6 text-center text-slate-500">
                No items found in this category.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {/* Legend */}
      <div className="mt-2 text-xs text-slate-500 flex items-center gap-3">
        <span className="inline-flex items-center gap-1">
          <HelpCircle className="h-3 w-3" /> Forecast = PAR, Actual = On Hand.
        </span>
        <span className="inline-flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-yellow-500" /> Admin Mode enables PAR editing.
        </span>
      </div>
    </div>
  );
};

export default OrderGuideItemTable;
