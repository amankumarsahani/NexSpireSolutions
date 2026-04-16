import { useState, useEffect, useRef, useCallback } from 'react';
import { settingsAPI, billingAPI } from '../services/api';
import { getRecaptchaToken } from '../utils/recaptcha';

export default function useCRMPricing() {
    const [isYearly, setIsYearly] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [pricingMode, setPricingMode] = useState('contact_us');

    const [toast, setToast] = useState({ show: false, message: '', type: 'error' });
    const toastTimerRef = useRef(null);

    const showToast = useCallback((message, type = 'error') => {
        setToast({ show: true, message, type });
        if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
        toastTimerRef.current = setTimeout(
            () => setToast({ show: false, message: '', type: 'error' }),
            4000
        );
    }, []);

    const dismissToast = useCallback(() => {
        setToast({ show: false, message: '', type: 'error' });
    }, []);

    useEffect(() => {
        let cancelled = false;
        const fetchSettings = async () => {
            try {
                const response = await settingsAPI.getPublicSettings();
                if (cancelled) return;
                if (response.data.success || response.data) {
                    const settings = response.data.data || response.data;
                    if (settings.pricing_page_mode) setPricingMode(settings.pricing_page_mode);
                }
            } catch {
                // Settings fetch is non-critical — defaults will be used
            }
        };
        fetchSettings();
        return () => { cancelled = true; };
    }, []);

    useEffect(() => {
        return () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); };
    }, []);

    const openContactModal = useCallback((planName) => {
        setSelectedPlan(planName);
        setShowContactModal(true);
        setSubmitted(false);
    }, []);

    const handleAction = useCallback(async (planName) => {
        if (pricingMode === 'contact_us' || planName === 'Enterprise') {
            openContactModal(planName);
            return;
        }

        const planId = planName.toLowerCase();
        showToast('Initiating secure Razorpay checkout...', 'info');
        try {
            const finalPlanId = isYearly ? `${planId}_yearly` : planId;
            const response = await billingAPI.createPaymentLink({
                planId: finalPlanId,
                billingCycle: isYearly ? 'yearly' : 'monthly',
                successUrl: window.location.origin + '/nexcrm?payment=success',
                cancelUrl: window.location.origin + '/nexcrm/pricing?payment=cancelled',
                metadata: {
                    source: 'agency_pricing_page',
                    billing_cycle: isYearly ? 'yearly' : 'monthly'
                }
            });

            if (response.data.success && response.data.url) {
                const paymentUrl = new URL(response.data.url, window.location.origin);
                const allowedHosts = [
                    window.location.hostname,
                    'razorpay.com',
                    'api.razorpay.com',
                    'checkout.razorpay.com'
                ];
                if (allowedHosts.some(h => paymentUrl.hostname === h || paymentUrl.hostname.endsWith('.' + h))) {
                    window.location.href = response.data.url;
                } else {
                    showToast('Invalid checkout URL. Please contact support.');
                }
            } else {
                showToast(response.data.error || 'Failed to generate checkout link');
            }
        } catch (err) {
            showToast('Failed to initiate Razorpay checkout. Please contact support.');
            console.error('Razorpay checkout error:', err);
        }
    }, [pricingMode, isYearly, showToast, openContactModal]);

    const submitContactForm = useCallback(async (formData, planOverride) => {
        setSubmitting(true);
        let captchaToken;
        try {
            captchaToken = await getRecaptchaToken('pricing_inquiry');
        } catch (captchaErr) {
            showToast(captchaErr.message, 'error');
            setSubmitting(false);
            return;
        }

        const plan = planOverride || selectedPlan || 'General';
        const data = {
            name: formData.get('name'),
            email: formData.get('email'),
            phone: formData.get('phone'),
            company: formData.get('company'),
            message: `Plan: NexCRM ${plan}\n\n${formData.get('message') || 'Interested in learning more about NexCRM.'}`,
            captchaToken
        };

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/inquiries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (response.ok) {
                setSubmitted(true);
            } else {
                const err = await response.json().catch(() => ({}));
                showToast(err.error || 'Something went wrong. Please try again.', 'error');
            }
        } catch {
            showToast('Network error. Please try again.', 'error');
        } finally {
            setSubmitting(false);
        }
    }, [selectedPlan, showToast]);

    return {
        isYearly,
        setIsYearly,
        showContactModal,
        setShowContactModal,
        selectedPlan,
        submitting,
        submitted,
        pricingMode,
        toast,
        showToast,
        dismissToast,
        handleAction,
        submitContactForm,
    };
}
