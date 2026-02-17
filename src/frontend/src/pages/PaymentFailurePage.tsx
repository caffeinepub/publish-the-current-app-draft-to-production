import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, ShoppingBag, ArrowLeft } from 'lucide-react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { clearCheckoutContext } from '../utils/stripeCheckoutContext';

export default function PaymentFailurePage() {
  const navigate = useNavigate();
  const search = useSearch({ strict: false }) as { reason?: string };

  useEffect(() => {
    // Clear any pending checkout context
    clearCheckoutContext();
  }, []);

  const reason = search.reason || 'Your payment could not be processed or was cancelled.';

  return (
    <div className="container py-16 flex items-center justify-center min-h-[80vh]">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600 dark:text-red-400" />
          </div>
          <CardTitle className="text-2xl">Payment Failed</CardTitle>
          <CardDescription>
            {reason}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted p-4 rounded-lg space-y-2">
            <p className="text-sm text-muted-foreground">
              Don't worry, no charges were made to your account. You can try again or choose a different payment method.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate({ to: '/store' })} className="w-full gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Store
            </Button>
            <Button variant="outline" onClick={() => navigate({ to: '/' })} className="w-full">
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
