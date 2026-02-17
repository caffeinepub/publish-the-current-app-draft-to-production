// Utilities for persisting checkout context across Stripe redirect
interface CheckoutContext {
  buyerDetails: {
    name: string;
    phoneNumber: string;
    notes: string;
  };
  products: Array<{
    id: string;
    name: string;
    price: bigint;
    quantity: number;
  }>;
  total: number;
  discountAmount: number;
  finalTotal: number;
  bonusTokens: number;
  timestamp: number;
}

const STORAGE_KEY = 'stripe_checkout_context';
const CONTEXT_EXPIRY_MS = 30 * 60 * 1000; // 30 minutes

export function saveCheckoutContext(context: Omit<CheckoutContext, 'timestamp'>): void {
  const contextWithTimestamp: CheckoutContext = {
    ...context,
    timestamp: Date.now(),
  };
  
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(contextWithTimestamp));
  } catch (error) {
    console.error('Failed to save checkout context:', error);
  }
}

export function loadCheckoutContext(): CheckoutContext | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const context: CheckoutContext = JSON.parse(stored);
    
    // Check if context has expired
    if (Date.now() - context.timestamp > CONTEXT_EXPIRY_MS) {
      clearCheckoutContext();
      return null;
    }
    
    return context;
  } catch (error) {
    console.error('Failed to load checkout context:', error);
    return null;
  }
}

export function clearCheckoutContext(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear checkout context:', error);
  }
}
