import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let cache, cacheSet, cachedGet, MAX_CACHE_SIZE, clearApiCache;
let mockAxiosInstance;
let requestInterceptor, responseSuccessInterceptor, responseErrorInterceptor;

vi.mock('axios', () => {
  const interceptors = {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  };
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    interceptors,
  };
  return {
    default: {
      create: vi.fn(() => instance),
    },
  };
});

vi.mock('../utils/mapKeys', () => ({
  snakeToCamel: vi.fn((obj) => {
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return Object.keys(obj).reduce((acc, key) => {
        const camelKey = key.replace(/_([a-z])/g, (_, l) => l.toUpperCase());
        acc[camelKey] = obj[key];
        return acc;
      }, {});
    }
    return obj;
  }),
}));

describe('api.js', () => {
  beforeEach(async () => {
    vi.stubGlobal('localStorage', {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
    vi.stubGlobal('dispatchEvent', vi.fn());
    vi.stubGlobal('CustomEvent', class MockCustomEvent { constructor(type) { this.type = type; } });

    vi.resetModules();

    const axios = await import('axios');
    mockAxiosInstance = axios.default.create();

    await import('../services/api');

    requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    responseSuccessInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
    responseErrorInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];

    const apiModule = await import('../services/api');
    clearApiCache = apiModule.clearApiCache;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe('request interceptor', () => {
    it('attaches bearer token when present in localStorage', () => {
      localStorage.getItem.mockReturnValue('test-token');
      const config = { headers: {} };
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBe('Bearer test-token');
    });

    it('does not attach Authorization header when no token', () => {
      localStorage.getItem.mockReturnValue(null);
      const config = { headers: {} };
      const result = requestInterceptor(config);
      expect(result.headers.Authorization).toBeUndefined();
    });

    it('creates AbortController when no signal present', () => {
      localStorage.getItem.mockReturnValue(null);
      const config = { headers: {} };
      const result = requestInterceptor(config);
      expect(result.signal).toBeDefined();
      expect(result._abortController).toBeDefined();
    });

    it('preserves existing signal', () => {
      localStorage.getItem.mockReturnValue(null);
      const signal = new AbortController().signal;
      const config = { headers: {}, signal };
      const result = requestInterceptor(config);
      expect(result.signal).toBe(signal);
    });
  });

  describe('response interceptor', () => {
    it('transforms snake_case to camelCase in response data', () => {
      const response = { data: { user_name: 'test', created_at: '2024' } };
      const result = responseSuccessInterceptor(response);
      expect(result.data.userName).toBe('test');
      expect(result.data.createdAt).toBe('2024');
    });

    it('dispatches auth:logout on 401 error', async () => {
      const error = { response: { status: 401 } };
      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(localStorage.removeItem).toHaveBeenCalledWith('token');
      expect(window.dispatchEvent).toHaveBeenCalled();
      const dispatched = window.dispatchEvent.mock.calls[0][0];
      expect(dispatched.type).toBe('auth:logout');
    });

    it('rejects non-401 errors without dispatching logout', async () => {
      const error = { response: { status: 500 } };
      await expect(responseErrorInterceptor(error)).rejects.toBe(error);
      expect(localStorage.removeItem).not.toHaveBeenCalled();
    });
  });

  describe('LRU cache', () => {
    beforeEach(async () => {
      vi.resetModules();

      const axios = await import('axios');
      mockAxiosInstance = axios.default.create();

      const apiModule = await import('../services/api');
      clearApiCache = apiModule.clearApiCache;

      responseSuccessInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0]?.[0];
      mockAxiosInstance.get.mockClear();
    });

    it('caches GET responses and returns cached on second call', async () => {
      const mockResponse = { data: { id: 1 } };
      mockAxiosInstance.get.mockResolvedValueOnce(mockResponse);

      const apiModule = await import('../services/api');
      const result1 = await apiModule.inquiryAPI.getAll({ page: 1 });
      const result2 = await apiModule.inquiryAPI.getAll({ page: 1 });

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
      expect(result1).toEqual(result2);
    });

    it('clearApiCache empties the cache', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { id: 1 } });

      const apiModule = await import('../services/api');
      await apiModule.inquiryAPI.getAll({ page: 1 });

      apiModule.clearApiCache();
      mockAxiosInstance.get.mockClear();

      mockAxiosInstance.get.mockResolvedValue({ data: { id: 2 } });
      await apiModule.inquiryAPI.getAll({ page: 1 });

      expect(mockAxiosInstance.get).toHaveBeenCalledTimes(1);
    });
  });
});
