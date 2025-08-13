// src/components/orderguide/OrderGuideItemTable.jsx
import React, { useMemo, useRef, useState, useCallback } from 'react';
import { useData } from '@/contexts/DataContext';
import { supabase } from '@/supabaseClient';
import { AlertTriangle, HelpCircle, Loader2 } from 'lucide-react';

/** Small debouncer */
function useDebounced(callback, delay = 500) {
  const timer = useRef(null);
  return useCallback((...args) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => callback(...args), delay);
  }, [callback, delay]);
}

const OrderGuideItemTable = ({
  items = [],
  categoryTitle,
  getStatusClass,
  getStatusIcon,
  isParCategory,
  locationId,
  onRefresh
}) => {
  const { isAdminMode } = useData();

  // local draft/saving/error trackers keyed by item_id
  const [drafts, setDrafts] = useState({});
  const [saving, setSaving] = useState({});
  const [errors, setErrors] = useState({});

  const safeItems = useMemo(
    () => items.filter((it) => it && (it.item_id || it.itemId) && it.name !== categoryTitle),
    [items, categoryTitle]
  );

  const setDraftField = useCallback((id, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), [field]: value },
    }));
  }, []);

  const optimisticRow = useCallback((row) => {
    const id = row.item_id || row.itemId;
    const d = drafts[id] || {};
    const actual = typeof d.actual === 'number' ? d.actual : row.actual;
    const forecast = typeof d.forecast === 'number' ? d.forecast : row.forecast;
    const variance = Number((actual - forecast).toFixed(1));
    return { ...row, actual, forecast, variance };
  }, [drafts]);

  const debouncedSaveOnHand = useDebounced(async (itemId, locId, value) => {
    try {
      setSaving((s) => ({ ...s, [itemId]: true }));
      setErrors((e) => ({ ...e, [itemId]: null }));

      const { data, error } = await supabase.functions.invoke('update-on-hand', {
        method: 'POST',
        body: { item_id: itemId, location_id: locId, on_hand: value },
      });
      if (error) throw error;

      // refresh data to stay true to DB, but keep the UI snappy
      onRefresh?.();
    } catch (err) {
      setErrors((e) => ({ ...e, [itemId]: err?.message || 'Failed to update on-hand' }));
    } finally {
      setSaving((s) => ({ ...s, [itemId]: false }));
    }
  }, 600);

  const debouncedSavePar = useDebounced(async (itemId, locId, value) => {
    try {
      setSaving((s) => ({ ...s, [itemId]: true }));
      setErrors((e) => ({ ...e, [itemId]: null }));

      const { data, error } = await supabase.functions.invoke('update-par-level', {
        method: 'POST',
        body: { item_id: itemId, location_id: locId, par_level: value },
      });
      if (error) throw error;

      onRefresh?.();
    } catch (err) {
      setErrors((e) => ({ ...e, [itemId]: err?.message || 'Failed to update PAR' }));
    } finally {
      setSaving((s) => ({ ...s, [itemId]: false }));
    }
  }, 600);

  const onChangeOnHand = (row, val) => {
    const itemId = row.item_id || row.itemId;
    const num = Number(val);
    if (!Number.isFinite(num)) return;
    setDraftField(itemId, 'actual', num);       // optimistic
    if (locationId) debouncedSaveOnHand(itemId, locationId, num);
  };

  const onChangePar = (row, val) => {
    const itemId = row.item_id || row.itemId;
    const num = Number(val);
    if (!Number.isFinite(num)) return;
    setDraftField(itemId, 'forecast', num);     // optimistic
    if (locationId) debouncedSavePar(itemId, locationId, num);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-200 dark:border-gray-700 text-sm">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="text-left px-4 py-2 font-semibold">Item</th>
            <th className="text-left px-4 py-2 font-semibold">Forecast (PAR)</th>
            <th className="text-left px-4 py-2 font-semibold">On Hand</th>
            <th className="text-left px-4 py-2 font-semibold">Variance</th>
            <th className="text-left px-4 py-2 font-semibold">Unit</th>
            <th className="text-left px-4 py-2 font-semibold">Status</th>
          </tr>
        </thead>
        <tbody>
          {safeItems.map((raw, idx) => {
            const row = optimisticRow(raw);
            const id = row.item_id || row.itemId;
            const isSaving = !!saving[id];
            const err = errors[id];

            const statusPill = (() => {
              const status = (row.status || '').toLowerCase();
              if (status.includes('critical')) {
                return (
                  <span className="inline-flex items-center rounded bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-inset ring-red-600/20">
                    <AlertTriangle className="w-3 h-3 mr-1 text-red-600" />
                    Critical
                  </span>
                );
              }
              if (status.includes('low')) {
                return (
                  <span className="inline-flex items-center rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800 ring-1 ring-inset ring-yellow-600/20">
                    Low
                  </span>
                );
              }
              if (status.includes('needs')) {
                return (
                  <span className="inline-flex items-center rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 ring-1 ring-inset ring-amber-600/20">
                    Needs Order
                  </span>
                );
              }
              return (
                <span className="inline-flex items-center rounded bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 ring-1 ring-inset ring-green-600/20">
                  In Stock
                </span>
              );
            })();

            return (
              <tr key={id ?? idx} className="border-b dark:border-gray-700">
                {/* Item name */}
                <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap bg-yellow-50">
                  {row.name || 'Unnamed Item'}
                </td>

                {/* Forecast (PAR) */}
                <td className="px-4 py-2 bg-yellow-50">
                  <input
                    type="number"
                    className={`w-24 rounded border border-gray-300 px-2 py-1 text-right ${
                      isParCategory ? '' : (isAdminMode ? '' : 'bg-gray-100 text-gray-500 cursor-not-allowed')
                    }`}
                    value={row.forecast}
                    readOnly={!isAdminMode}
                    onChange={(e) => isAdminMode && onChangePar(row, e.target.value)}
                  />
                </td>

                {/* On Hand */}
                <td className="px-4 py-2 bg-yellow-50">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="w-24 rounded border border-gray-300 px-2 py-1 text-right"
                      value={row.actual}
                      onChange={(e) => onChangeOnHand(row, e.target.value)}
                    />
                    {isSaving && <Loader2 className="h-4 w-4 animate-spin text-slate-500" />}
                  </div>
                  {err && (
                    <div className="text-xs text-red-600 mt-1">
                      {err}
                    </div>
                  )}
                </td>

                {/* Variance */}
                <td className={`px-4 py-2 bg-yellow-50 ${getStatusClass?.(row) || ''}`}>
                  {row.variance}
                </td>

                {/* Unit */}
                <td className="px-4 py-2 bg-yellow-50">{row.unit}</td>

                {/* Status */}
                <td className="px-4 py-2 bg-yellow-50 flex items-center gap-2">
                  {getStatusIcon?.(row) || <HelpCircle className="w-4 h-4 text-slate-500" />}
                  {statusPill}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrderGuideItemTable;
