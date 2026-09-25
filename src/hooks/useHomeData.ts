// @ts-nocheck
import { useEffect, useState } from 'react';
import { getHomeData } from '../services/homeService';

export const useHomeData = (role, user) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getHomeData(role, user)
      .then((res) => !cancelled && setData(res))
      .catch((e) => !cancelled && setError(e))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [role, userId]);

  return { data, loading, error };
};
