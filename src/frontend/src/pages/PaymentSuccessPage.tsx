import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { useNavigate } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useCartStore } from '../lib/cartStore';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearCart = useCartStore(state => state.clearCart);

  useEffect(() => {
    // Clear cart on successful payment
    clearCart();
    
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
    queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });

    // Show success toast with bonus tokens info
    toast.success(
      <div className="flex items-center gap-2">
        <img src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" alt="Reward" className="h-6 w-6" />
        <span>Payment successful! You earned bonus tokens (5% of purchase).</span>
      </div>
    );
  }, [queryClient, clearCart]);

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
              Bonus tokens have been added to your wallet (5% of purchase total)
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
