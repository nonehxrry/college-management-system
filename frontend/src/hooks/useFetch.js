import { useState, useEffect, useCallback, useRef } from "react";
import api from "../services/api";

const useFetch = (url, options = {}) => {
  const { immediate = true, params = {}, dependencies = [] } = options;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState(null);
  const abortRef = useRef(null);

  const fetch = useCallback(
    async (overrideParams = {}) => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      setError(null);

      try {
        const { data: responseData } = await api.get(url, {
          params: { ...params, ...overrideParams },
          signal: controller.signal,
        });
        setData(responseData);
        return responseData;
      } catch (err) {
        if (err.name !== "CanceledError" && err.name !== "AbortError") {
          setError(err.response?.data?.message || err.message || "Something went wrong");
        }
        return null;
      } finally {
        setLoading(false);
      }
    },
    [url, JSON.stringify(params), ...dependencies]
  );

  useEffect(() => {
    if (immediate) fetch();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [fetch]);

  const mutate = useCallback((updater) => {
    setData((prev) => (typeof updater === "function" ? updater(prev) : updater));
  }, []);

  return { data, loading, error, refetch: fetch, mutate };
};

export const usePost = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const post = useCallback(async (url, body, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post(url, body, config);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || "Request failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const put = useCallback(async (url, body, config = {}) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.put(url, body, config);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || "Update failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  const del = useCallback(async (url) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.delete(url);
      return { success: true, data };
    } catch (err) {
      const message = err.response?.data?.message || "Delete failed";
      setError(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, post, put, del };
};

export default useFetch;