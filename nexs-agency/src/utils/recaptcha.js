const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

let loadPromise = null;

function loadScript() {
  if (loadPromise) return loadPromise;

  if (window.grecaptcha) {
    loadPromise = Promise.resolve();
    return loadPromise;
  }

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load reCAPTCHA script'));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export async function getRecaptchaToken(action) {
  await loadScript();

  if (!window.grecaptcha) {
    throw new Error('reCAPTCHA failed to load. Please refresh the page and try again.');
  }

  await new Promise(resolve => window.grecaptcha.ready(resolve));
  return window.grecaptcha.execute(RECAPTCHA_SITE_KEY, { action });
}
