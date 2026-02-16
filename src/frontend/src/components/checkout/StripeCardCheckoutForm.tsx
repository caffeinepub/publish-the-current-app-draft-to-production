import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, AlertCircle } from 'lucide-react';
import BuyerDetailsFields from './BuyerDetailsFields';
import { useSavePurchaseOrder } from '../../hooks/useQueries';
import { useCartStore } from '../../lib/cartStore';
import { toast } from 'sonner';
import { Variant_token_card, type OrderedProduct, type BuyerDetails } from '../../backend';

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
  const clearCart = useCartStore(state => state.clearCart);
  const savePurchaseOrder = useSavePurchaseOrder();

  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{ name?: string; phoneNumber?: string }>({});
  const [isProcessing, setIsProcessing] = useState(false);

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

    setIsProcessing(true);

    try {
      // Prepare order data
      const products: OrderedProduct[] = cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: BigInt(item.quantity),
      }));

      const buyerDetails: BuyerDetails = {
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        notes: notes.trim(),
      };

      // Save the order
      await savePurchaseOrder.mutateAsync({
        products,
        total: BigInt(total),
        buyerDetails,
        paymentType: Variant_token_card.card,
      });

      // Clear cart and show success
      clearCart();
      toast.success(
        <div className="space-y-1">
          <p className="font-semibold">Order placed successfully!</p>
          <p className="text-sm">You earned {bonusTokens} bonus tokens!</p>
        </div>
      );
      onSuccess();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to process order';
      onError(errorMessage);
      toast.error(errorMessage);
      console.error('Order error:', error);
    } finally {
      setIsProcessing(false);
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
          disabled={isProcessing}
        >
          <CreditCard className="h-4 w-4" />
          {isProcessing ? 'Processing Order...' : `Complete Purchase - $${(total / 100).toFixed(2)}`}
        </Button>
      </div>

      {savePurchaseOrder.isError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to process order. Please try again or contact support.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
