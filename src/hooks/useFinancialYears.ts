import { useEffect, useMemo, useState } from 'react';
import performanceService from '../services/performanceService';
import { getApiErrorMessage, toArrayFromPayload } from '../utils/helpers';

export interface FinancialYearOption {
  id: string;
  name: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

function mapRow(row: Record<string, unknown>): FinancialYearOption {
  return {
    id: String(row.id ?? row._id ?? ''),
    name: String(row.name ?? ''),
    startDate: (row.startDate as string) ?? undefined,
    endDate: (row.endDate as string) ?? undefined,
    isActive: Boolean(row.isActive),
  };
}

export default function useFinancialYears() {
  const [items, setItems] = useState<FinancialYearOption[]>([]);
  /** Start true so first paint does not flash empty UI before the fetch sets loading. */
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFinancialYears = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = await performanceService.getFinancialYears();
      const rows = toArrayFromPayload(payload);
      setItems(rows.map((row) => mapRow((row ?? {}) as Record<string, unknown>)));
    } catch (e) {
      setError(getApiErrorMessage(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFinancialYears();
  }, []);

  const active = useMemo(
    () => items.find((row) => row.isActive) ?? items[0] ?? null,
    [items]
  );

  return {
    financialYears: items,
    financialYearsLoading: loading,
    financialYearsError: error,
    activeFinancialYear: active,
    reloadFinancialYears: loadFinancialYears,
  };
}
