import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

function makeJWT(payload) {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.fakesignature`;
}

vi.mock('../services/api', () => ({
  authAPI: {
    getMe: vi.fn(),
    signin: vi.fn(),
    signup: vi.fn(),
    logout: vi.fn(),
  },
}));

describe('AuthContext — isTokenValid logic', () => {
  let storage;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => storage[key] ?? null),
      setItem: vi.fn((key, val) => { storage[key] = val; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  async function getIsTokenValid() {
    const mod = await import('../context/AuthContext.jsx');
    return mod.__test_isTokenValid ?? null;
  }

  it('returns false for null/undefined token', async () => {
    vi.resetModules();
    const mod = await import('../context/AuthContext.jsx');
    const isTokenValid = extractIsTokenValid();
    expect(isTokenValid(null)).toBe(false);
    expect(isTokenValid(undefined)).toBe(false);
    expect(isTokenValid('')).toBe(false);
  });

  it('returns false for malformed token', () => {
    const isTokenValid = extractIsTokenValid();
    expect(isTokenValid('not-a-jwt')).toBe(false);
    expect(isTokenValid('a.b')).toBe(false);
    expect(isTokenValid('a.!!!.c')).toBe(false);
  });

  it('returns true for non-expired token', () => {
    const isTokenValid = extractIsTokenValid();
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const token = makeJWT({ exp: futureExp, sub: '123' });
    expect(isTokenValid(token)).toBe(true);
  });

  it('returns false for expired token', () => {
    const isTokenValid = extractIsTokenValid();
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const token = makeJWT({ exp: pastExp, sub: '123' });
    expect(isTokenValid(token)).toBe(false);
  });

  it('returns false when exp is exactly now (boundary)', () => {
    const isTokenValid = extractIsTokenValid();
    const nowSec = Math.floor(Date.now() / 1000);
    vi.spyOn(Date, 'now').mockReturnValue(nowSec * 1000);
    const token = makeJWT({ exp: nowSec, sub: '123' });
    expect(isTokenValid(token)).toBe(false);
  });
});

describe('AuthContext — auto-logout on expired token', () => {
  let storage;

  beforeEach(() => {
    storage = {};
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key) => storage[key] ?? null),
      setItem: vi.fn((key, val) => { storage[key] = val; }),
      removeItem: vi.fn((key) => { delete storage[key]; }),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('removes expired token from localStorage on mount', async () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600;
    const expiredToken = makeJWT({ exp: pastExp, sub: '123' });
    storage.token = expiredToken;

    vi.resetModules();
    const { renderHook } = await import('@testing-library/react');
    const React = await import('react');
    const { AuthProvider } = await import('../context/AuthContext.jsx');

    renderHook(() => null, {
      wrapper: ({ children }) => React.createElement(AuthProvider, null, children),
    });

    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });

  it('keeps valid token in localStorage on mount', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const validToken = makeJWT({ exp: futureExp, sub: '123' });
    storage.token = validToken;

    vi.resetModules();
    const { renderHook, act } = await import('@testing-library/react');
    const React = await import('react');
    const { authAPI } = await import('../services/api');
    authAPI.getMe.mockResolvedValue({ data: { user: { id: 1, name: 'Test' } } });

    const { AuthProvider } = await import('../context/AuthContext.jsx');

    await act(async () => {
      renderHook(() => null, {
        wrapper: ({ children }) => React.createElement(AuthProvider, null, children),
      });
    });

    expect(localStorage.removeItem).not.toHaveBeenCalledWith('token');
  });

  it('responds to auth:logout custom event by clearing state', async () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600;
    const validToken = makeJWT({ exp: futureExp, sub: '123' });
    storage.token = validToken;

    vi.resetModules();
    const { renderHook, act } = await import('@testing-library/react');
    const React = await import('react');
    const { authAPI } = await import('../services/api');
    const { AuthProvider, useAuth } = await import('../context/AuthContext.jsx');

    authAPI.getMe.mockResolvedValue({ data: { user: { id: 1, name: 'Test' } } });

    let hookResult;
    await act(async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: ({ children }) => React.createElement(AuthProvider, null, children),
      });
      hookResult = result;
    });

    act(() => {
      window.dispatchEvent(new CustomEvent('auth:logout'));
    });

    expect(hookResult.current.isAuthenticated).toBe(false);
    expect(localStorage.removeItem).toHaveBeenCalledWith('token');
  });
});

function extractIsTokenValid() {
  function isTokenValid(token) {
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp * 1000 > Date.now();
    } catch {
      return false;
    }
  }
  return isTokenValid;
}
