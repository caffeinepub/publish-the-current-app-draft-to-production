import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShoppingBag, Loader2 } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCartStore } from '../lib/cartStore';
import { useGetStripeSessionStatus, useSavePurchaseOrder } from '../hooks/useQueries';
import { loadCheckoutContext, clearCheckoutContext } from '../utils/stripeCheckoutContext';
import { Variant_token_card, type OrderedProduct, type BuyerDetails } from '../backend';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearCart = useCartStore(state => state.clearCart);
  const search = useSearch({ strict: false }) as { session_id?: string };
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  
  const getSessionStatus = useGetStripeSessionStatus();
  const savePurchaseOrder = useSavePurchaseOrder();

  useEffect(() => {
    const verifyAndCreateOrder = async () => {
      const sessionId = search.session_id;
      
      if (!sessionId) {
        setVerificationError('Missing session identifier');
        setIsVerifying(false);
        setTimeout(() => navigate({ to: '/payment-failure' }), 2000);
        return;
      }

      // Load checkout context
      const context = loadCheckoutContext();
      if (!context) {
        setVerificationError('Checkout session expired or invalid');
        setIsVerifying(false);
        setTimeout(() => navigate({ to: '/payment-failure' }), 2000);
        return;
      }

      try {
        // Verify session status with Stripe
        const status = await getSessionStatus.mutateAsync(sessionId);

        if (status.__kind__ !== 'completed') {
          const errorMsg = status.__kind__ === 'failed' ? status.failed.error : 'Payment not completed';
          setVerificationError(errorMsg);
          setIsVerifying(false);
          setTimeout(() => navigate({ to: '/payment-failure' }), 2000);
          return;
        }

        // Payment verified - create order
        const products: OrderedProduct[] = context.products.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          quantity: BigInt(p.quantity),
        }));

        const buyerDetails: BuyerDetails = {
          name: context.buyerDetails.name,
          phoneNumber: context.buyerDetails.phoneNumber,
          notes: context.buyerDetails.notes,
        };

        await savePurchaseOrder.mutateAsync({
          products,
          total: BigInt(context.total),
          buyerDetails,
          paymentType: Variant_token_card.card,
        });

        // Clear cart and context
        clearCart();
        clearCheckoutContext();

        // Invalidate queries to refresh data
        queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
        queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
        queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        queryClient.invalidateQueries({ queryKey: ['userOrders'] });

        // Show success toast
        toast.success(
          <div className="flex items-center gap-2">
            <img src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" alt="Reward" className="h-6 w-6" />
            <span>Payment successful! You earned {context.bonusTokens} bonus tokens.</span>
          </div>
        );

        setIsVerifying(false);
      } catch (error: any) {
        console.error('Payment verification error:', error);
        setVerificationError(error?.message || 'Failed to verify payment');
        setIsVerifying(false);
        setTimeout(() => navigate({ to: '/payment-failure' }), 2000);
      }
    };

    verifyAndCreateOrder();
  }, [search.session_id, navigate, queryClient, clearCart, getSessionStatus, savePurchaseOrder]);

  if (isVerifying) {
    return (
      <div className="container py-16 flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-600 dark:text-blue-400 animate-spin" />
            </div>
            <CardTitle className="text-2xl">Verifying Payment...</CardTitle>
            <CardDescription>
              Please wait while we confirm your payment with Stripe.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (verificationError) {
    return (
      <div className="container py-16 flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-destructive">Verification Failed</CardTitle>
            <CardDescription>
              {verificationError}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground text-center">
              Redirecting to failure page...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-16 flex items-center justify-center min-h-[80vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Your order has been confirmed and you've earned bonus tokens.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              Thank you for your purchase! Your order is being processed and you'll receive a confirmation shortly.
            </p>
            <p className="text-sm font-medium flex items-center gap-2">
              <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Token" className="h-5 w-5" />
              Bonus tokens have been added to your wallet
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate({ to: '/store' })} className="w-full gap-2">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/profile' })} className="w-full">
              View Profile
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
