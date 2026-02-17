import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertCircle } from 'lucide-react';
import BuyerDetailsFields from './BuyerDetailsFields';
import { useCreateCheckoutSession, useGetCallerUserProfile } from '../../hooks/useQueries';
import { useCartStore } from '../../lib/cartStore';
import { toast } from 'sonner';
import { type ShoppingItem } from '../../backend';
import { saveCheckoutContext } from '../../utils/stripeCheckoutContext';

interface StripeCardCheckoutFormProps {
  total: number;
  bonusTokens: number;
  onSuccess: () => void;
  onError: (error: string) => void;
}

export default function StripeCardCheckoutForm({
  total,
  bonusTokens,
  onSuccess,
  onError,
}: StripeCardCheckoutFormProps) {
  const cart = useCartStore(state => state.cart);
  const createCheckoutSession = useCreateCheckoutSession();
  const { data: userProfile } = useGetCallerUserProfile();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phoneNumber?: string }>({});

  const validateFields = (): boolean => {
    const newErrors: { name?: string; phoneNumber?: string } = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (phoneNumber.trim().length < 10) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    try {
      // Calculate token discount (5% per token)
      const tokenBalance = userProfile?.tokenBalance ? Number(userProfile.tokenBalance) : 0;
      const maxDiscountPercent = Math.min(tokenBalance * 5, 100); // Cap at 100%
      const discountAmount = Math.floor(total * (maxDiscountPercent / 100));
      const finalTotal = Math.max(total - discountAmount, 0);

      // Save checkout context for after redirect
      saveCheckoutContext({
        buyerDetails: {
          name: name.trim(),
          phoneNumber: phoneNumber.trim(),
          notes: notes.trim(),
        },
        products: cart.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
        })),
        total,
        discountAmount,
        finalTotal,
        bonusTokens,
      });

      // Prepare shopping items for Stripe
      const items: ShoppingItem[] = cart.map(item => ({
        productName: item.product.name,
        productDescription: item.product.description,
        priceInCents: BigInt(Math.floor(Number(item.product.price) * (1 - maxDiscountPercent / 100))),
        quantity: BigInt(item.quantity),
        currency: 'usd',
      }));

      // Create checkout session
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const successUrl = `${baseUrl}/payment-success`;
      const cancelUrl = `${baseUrl}/payment-failure`;

      const session = await createCheckoutSession.mutateAsync({
        items,
        successUrl,
        cancelUrl,
      });

      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }

      // Redirect to Stripe Checkout (never use router navigation)
      window.location.href = session.url;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start checkout';
      onError(errorMessage);
      console.error('Checkout error:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Alert>
        <CreditCard className="h-4 w-4" />
        <AlertDescription>
          Complete your purchase details below. You'll earn {bonusTokens} bonus tokens with this purchase!
        </AlertDescription>
      </Alert>

      <BuyerDetailsFields
        name={name}
        phoneNumber={phoneNumber}
        notes={notes}
        onNameChange={setName}
        onPhoneNumberChange={setPhoneNumber}
        onNotesChange={setNotes}
        errors={errors}
      />

      <div className="pt-2">
        <Button 
          type="submit" 
          className="w-full gap-2" 
          disabled={createCheckoutSession.isPending}
        >
          <CreditCard className="h-4 w-4" />
          {createCheckoutSession.isPending ? 'Starting Checkout...' : `Proceed to Payment - $${(total / 100).toFixed(2)}`}
        </Button>
      </div>

      {createCheckoutSession.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to start checkout. Please try again or contact support.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
