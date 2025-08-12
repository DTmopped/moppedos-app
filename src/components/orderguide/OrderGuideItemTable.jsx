import React, { useCallback } from 'react';
import { AlertTriangle, HelpCircle, Check, X } from 'lucide-react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/supabaseClient';

/**
 * Expects each `item` to look like:
 * {
 *   name, unit, actual, forecast, variance, status,
 *   on_hand, par_level, order_quantity,
 *   // (ideally present for updates)
 *   itemId | item_id | id
 * }
 */
const OrderGuideItemTable = ({
  items = [],
  categoryTitle,
  getStatusClass,
  getStatusIcon,
  isParCategory,
  locationId,          // ⬅️ needed for edge function payloads
  onRefresh,           // ⬅️ call after successful update
}) => {
  const { isAdminMode } = useData();

  const resolveItemId = useCallback((item) => {
    return item?.itemId ?? item?.item_id ?? item?.id ?? null;
  }, []);

  const callEdge = useCallback(async (fnName, body) => {
    // supabase-js v2 automatically forwards the user's auth if signed in
    return await supabase.functions.invoke(fnName, { body });
  }, []);

  const handleOnHandChange = useCallback(
    async (item, value) => {
      if (!isAdminMode) return;
      const itemId = resolveItemId(item);
      if (!itemId || !locationId) {
        window.alert('Missing itemId or locationId for update.');
        return;
      }
      const on_hand = Number(value);
      if (Number.isNaN(on_hand)) return;

      const { data, error } = await callEdge('update-on-hand', {
        item_id: itemId,
        location_id: locationId,
        on_hand,
      });

      if (error) {
        console.error('update-on-hand error:', error);
        window.alert(`Failed to update on-hand: ${error.message ?? error}`);
        return;
      }
      // Optional: log or toast
      // console.log('Updated on-hand:', data);
      onRefresh?.();
    },
    [isAdminMode, resolveItemId, locationId, callEdge, onRefresh]
  );

  const handleParChange = useCallback(
    async (item, value) => {
      if (!isAdminMode) return;
      const itemId = resolveItemId(item);
      if (!itemId || !locationId) {
        window.alert('Missing itemId or locationId for update.');
        return;
      }
      const par_level = Number(value);
      if (Number.isNaN(par_level)) return;

      const { data, error } = await callEdge('update-par-level', {
        item_id: itemId,
        location_id: locationId,
        par_level,
      });

      if (error) {
        console.error('update-par-level error:', error);
        window.alert(`Failed to update PAR: ${error.message ?? error}`);
        return;
      }
      // Optional: log or toast
      // console.log('Updated PAR:', data);
      onRefresh?.();
    },
    [isAdminMode, resolveItemId, locationId, callEdge, onRefresh]
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="text-left px-4 py-2 font-semibold">Item</th>
            <th className="text-center px-4 py-2 font-semibold">On Hand</th>
            <th className="text-center px-4 py-2 font-semibold">PAR</th>
            <th className="text-center px-4 py-2 font-semibold">Order</th>
            <th className="text-left px-4 py-2 font-semibold">Unit</th>
            <th className="text-left px-4 py-2 font-semibold">Status</th>
            {isAdminMode && <th className="text-left px-4 py-2 font-semibold">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {(Array.isArray(items) ? items : []).map((item, index) => {
            const name = item?.name ?? 'Unnamed Item';
            const unit = item?.unit ?? '';
            // For backwards compat, use explicit on_hand/par_level if present; fall back to actual/forecast.
            const onHand = Number.isFinite(item?.on_hand) ? Number(item.on_hand) : Number(item?.actual ?? 0);
            const parLevel = Number.isFinite(item?.par_level) ? Number(item.par_level) : Number(item?.forecast ?? 0);
            const orderQty = Number.isFinite(item?.order_quantity)
              ? Number(item.order_quantity)
              : Math.max(0, parLevel - onHand);

            const status = String(item?.status ?? '').toLowerCase();
            const isParItem = status === 'par item';

            const readOnlyOnHand = !isAdminMode;
            const readOnlyPar = !isAdminMode || (!isAdminMode && isParCategory);

            const statusClasses = getStatusClass ? getStatusClass({ forecast: parLevel, actual: onHand }) : '';
            const statusIcon = getStatusIcon ? getStatusIcon({ forecast: parLevel, actual: onHand }) : <HelpCircle className="h-4 w-4 text-slate-500" />;

            return (
              <tr key={index} className="border-b dark:border-gray-700">
                {/* Item name */}
                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap bg-yellow-50">
                  {name}
                  {isParItem && (
                    <span className="ml-2 inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                      PAR Item
                    </span>
                  )}
                </td>

                {/* On Hand (editable in admin) */}
                <td className="px-4 py-2 text-center bg-yellow-50">
                  <input
                    type="number"
                    className={`w-24 rounded border border-gray-300 px-2 py-1 text-right ${readOnlyOnHand ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    value={onHand}
                    onChange={(e) => handleOnHandChange(item, e.target.value)}
                    readOnly={readOnlyOnHand}
                  />
                </td>

                {/* PAR (editable in admin) */}
                <td className="px-4 py-2 text-center bg-yellow-50">
                  <input
                    type="number"
                    className={`w-24 rounded border border-gray-300 px-2 py-1 text-right ${readOnlyPar ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    value={parLevel}
                    onChange={(e) => handleParChange(item, e.target.value)}
                    readOnly={readOnlyPar}
                  />
                </td>

                {/* Order (derived) */}
                <td className="px-4 py-2 text-center bg-yellow-50">{orderQty}</td>

                {/* Unit */}
                <td className="px-3 py-2 bg-yellow-50 text-left">{unit}</td>

                {/* Status */}
                <td className="px-3 py-2 bg-yellow-50">
                  <span className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusClasses}`}>
                    {statusIcon}
                    {status || '—'}
                  </span>
                </td>

                {/* Actions (placeholder) */}
                {isAdminMode && (
                  <td className="px-3 py-2 bg-yellow-50">
                    <span className="text-gray-400 text-xs italic">Auto</span>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderGuideItemTable;
