import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';

vi.mock('../services/api', () => ({
  settingsAPI: {
    getPublicSettings: vi.fn(),
  },
  billingAPI: {
    createPaymentLink: vi.fn(),
  },
}));

vi.mock('../utils/recaptcha', () => ({
  getRecaptchaToken: vi.fn(),
}));

import useCRMPricing from '../hooks/useCRMPricing';
import { settingsAPI } from '../services/api';

describe('useCRMPricing', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    settingsAPI.getPublicSettings.mockResolvedValue({
      data: { success: true, data: { pricing_page_mode: 'contact_us' } },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('initializes with correct default state', async () => {
    const { result } = renderHook(() => useCRMPricing());
    await act(() => vi.runAllTimersAsync());

    expect(result.current.isYearly).toBe(false);
    expect(result.current.showContactModal).toBe(false);
    expect(result.current.selectedPlan).toBe('');
    expect(result.current.submitting).toBe(false);
    expect(result.current.submitted).toBe(false);
    expect(result.current.pricingMode).toBe('contact_us');
    expect(result.current.toast).toEqual({ show: false, message: '', type: 'error' });
  });

  it('showToast sets toast and auto-dismisses after 4 seconds', async () => {
    const { result } = renderHook(() => useCRMPricing());
    await act(() => vi.runAllTimersAsync());

    act(() => result.current.showToast('Test message', 'info'));

    expect(result.current.toast).toEqual({ show: true, message: 'Test message', type: 'info' });

    act(() => vi.advanceTimersByTime(4000));

    expect(result.current.toast).toEqual({ show: false, message: '', type: 'error' });
  });

  it('dismissToast clears toast immediately', async () => {
    const { result } = renderHook(() => useCRMPricing());
    await act(() => vi.runAllTimersAsync());

    act(() => result.current.showToast('Test'));
    act(() => result.current.dismissToast());

    expect(result.current.toast.show).toBe(false);
  });

  it('cleans up toast timer on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout');
    const { result, unmount } = renderHook(() => useCRMPricing());
    await act(() => vi.runAllTimersAsync());

    act(() => result.current.showToast('Test'));
    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
  });

  it('showToast replaces previous timer when called multiple times', async () => {
    const { result } = renderHook(() => useCRMPricing());
    await act(() => vi.runAllTimersAsync());

    act(() => result.current.showToast('First'));
    act(() => result.current.showToast('Second'));

    expect(result.current.toast.message).toBe('Second');

    act(() => vi.advanceTimersByTime(4000));

    expect(result.current.toast.show).toBe(false);
  });

  it('fetches settings on mount and updates pricingMode', async () => {
    settingsAPI.getPublicSettings.mockResolvedValue({
      data: { success: true, data: { pricing_page_mode: 'razorpay' } },
    });

    const { result } = renderHook(() => useCRMPricing());
    await act(() => vi.runAllTimersAsync());

    expect(settingsAPI.getPublicSettings).toHaveBeenCalledOnce();
    expect(result.current.pricingMode).toBe('razorpay');
  });

  it('falls back to defaults when settings fetch fails', async () => {
    settingsAPI.getPublicSettings.mockRejectedValue(new Error('Network'));

    const { result } = renderHook(() => useCRMPricing());
    await act(() => vi.runAllTimersAsync());

    expect(result.current.pricingMode).toBe('contact_us');
  });
});
