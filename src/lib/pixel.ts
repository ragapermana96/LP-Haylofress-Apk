import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

/**
 * Dynamically injects and initializes the Meta Facebook Pixel script on the client.
 */
export function initializeMetaPixel(pixelId: string) {
  if (!pixelId) return;
  const fId = pixelId.trim();
  if (!fId) return;

  try {
    if (!(window as any).fbq) {
      (function(f: any, b: any, e: any, v: any, n: any, t: any, s: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        if (s && s.parentNode) {
          s.parentNode.insertBefore(t, s);
        } else {
          document.head.appendChild(t);
        }
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js', undefined, undefined, undefined);
    }

    (window as any).fbq('init', fId);
    (window as any).fbq('track', 'PageView');
    console.log('[Meta Pixel] Initialized successfully with ID:', fId);
  } catch (error) {
    console.error('[Meta Pixel] Failed to initialize:', error);
  }
}

/**
 * Dispatches a track event to standard Meta Pixel and saves it to Firestore.
 */
export async function trackPixelEvent(eventName: string, params: any = {}) {
  // 1. Dispatch to browser-side Meta Pixel
  if ((window as any).fbq) {
    try {
      (window as any).fbq('track', eventName, params);
      console.log(`[Meta Pixel Event Sent]: ${eventName}`, params);
    } catch (e) {
      console.warn('[Meta Pixel] Track execution error:', e);
    }
  } else {
    console.log(`[Meta Pixel Simulator]: Event "${eventName}" triggered but Meta Pixel script is not loaded yet.`, params);
  }

  // 2. Persist to Firestore for Customer Analytics Dashboard
  try {
    const analyticsId = 'evt-' + Date.now().toString().slice(-6) + Math.random().toString(36).substring(2, 5);
    await addDoc(collection(db, 'pixel_analytics'), {
      id: analyticsId,
      eventName,
      params,
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent || 'unknown',
      pageUrl: window.location.href,
      referrer: document.referrer || 'direct'
    });
    console.log(`[Firestore Analytics Logged]: ${eventName}`);
  } catch (error) {
    console.warn('[Firestore Analytics] Failed to log event:', error);
  }
}
