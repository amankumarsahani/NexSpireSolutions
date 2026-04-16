import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const SITE_KEY = 'test-site-key';

describe('recaptcha', () => {
  let getRecaptchaToken;

  beforeEach(async () => {
    vi.resetModules();
    vi.stubEnv('VITE_RECAPTCHA_SITE_KEY', SITE_KEY);

    document.head.innerHTML = '';
    delete window.grecaptcha;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  async function loadModule() {
    const mod = await import('../utils/recaptcha');
    getRecaptchaToken = mod.getRecaptchaToken;
    return mod;
  }

  it('injects script tag into document.head on first call', async () => {
    const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
      window.grecaptcha = {
        ready: (cb) => cb(),
        execute: vi.fn().mockResolvedValue('token-abc'),
      };
      el.onload();
      return el;
    });

    await loadModule();
    const token = await getRecaptchaToken('test_action');

    expect(appendChildSpy).toHaveBeenCalledOnce();
    const script = appendChildSpy.mock.calls[0][0];
    expect(script.tagName).toBe('SCRIPT');
    expect(script.src).toContain('recaptcha/api.js');
    expect(script.src).toContain(SITE_KEY);
    expect(token).toBe('token-abc');
  });

  it('returns singleton — does not inject script twice', async () => {
    const appendChildSpy = vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
      window.grecaptcha = {
        ready: (cb) => cb(),
        execute: vi.fn().mockResolvedValue('token-1'),
      };
      el.onload();
      return el;
    });

    await loadModule();
    await getRecaptchaToken('action1');
    await getRecaptchaToken('action2');

    expect(appendChildSpy).toHaveBeenCalledOnce();
  });

  it('skips script injection when grecaptcha already exists', async () => {
    window.grecaptcha = {
      ready: (cb) => cb(),
      execute: vi.fn().mockResolvedValue('pre-loaded-token'),
    };

    const appendChildSpy = vi.spyOn(document.head, 'appendChild');

    await loadModule();
    const token = await getRecaptchaToken('submit');

    expect(appendChildSpy).not.toHaveBeenCalled();
    expect(token).toBe('pre-loaded-token');
  });

  it('calls grecaptcha.execute with correct site key and action', async () => {
    const executeMock = vi.fn().mockResolvedValue('token-xyz');
    window.grecaptcha = {
      ready: (cb) => cb(),
      execute: executeMock,
    };

    await loadModule();
    await getRecaptchaToken('contact_form');

    expect(executeMock).toHaveBeenCalledWith(SITE_KEY, { action: 'contact_form' });
  });

  it('rejects when script fails to load', async () => {
    vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
      el.onerror();
      return el;
    });

    await loadModule();
    await expect(getRecaptchaToken('test')).rejects.toThrow('Failed to load reCAPTCHA script');
  });

  it('throws when grecaptcha is undefined after script loads', async () => {
    vi.spyOn(document.head, 'appendChild').mockImplementation((el) => {
      el.onload();
      return el;
    });

    await loadModule();
    await expect(getRecaptchaToken('test')).rejects.toThrow('reCAPTCHA failed to load');
  });
});
