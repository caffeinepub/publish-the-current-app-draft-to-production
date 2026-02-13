import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Coins } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export default function PaymentSuccessPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
    queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
    queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });

    toast.success(
      <div className="flex items-center gap-2">
        <Coins className="h-5 w-5 text-yellow-500" />
        <div>
          <div className="font-semibold">Payment successful!</div>
          <div className="text-sm text-muted-foreground">You've earned bonus tokens for your purchase!</div>
        </div>
      </div>,
      { duration: 5000 }
    );
  }, [queryClient]);

  return (
    <div className="container py-16">
      <Card className="max-w-md mx-auto text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>
            Thank you for your purchase. Your order has been confirmed and you've earned bonus tokens!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center gap-2 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <img src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" alt="Reward" className="h-8 w-8" />
            <div className="text-left">
              <div className="font-semibold text-sm">Bonus Tokens Earned!</div>
              <div className="text-xs text-muted-foreground">5% of your purchase total</div>
            </div>
          </div>
          <Button onClick={() => navigate({ to: '/wallet' })} className="w-full">
            View Wallet
          </Button>
          <Button onClick={() => navigate({ to: '/store' })} variant="outline" className="w-full">
            Continue Shopping
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
