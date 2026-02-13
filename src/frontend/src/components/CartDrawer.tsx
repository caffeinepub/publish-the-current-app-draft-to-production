import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Minus, Plus, Trash2, CreditCard, AlertCircle, Coins, LogIn } from 'lucide-react';
import { useCreateCheckoutSession, useSpendTokens, useGetCallerUserProfile, useIsStripeConfigured, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { ShoppingItem } from '../backend';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../lib/cartStore';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const cart = useCartStore(state => state.cart);
  const updateQuantity = useCartStore(state => state.updateQuantity);
  const removeItem = useCartStore(state => state.removeItem);
  const clearCart = useCartStore(state => state.clearCart);
  
  const { identity } = useInternetIdentity();
  const createCheckout = useCreateCheckoutSession();
  const spendTokens = useSpendTokens();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: stripeConfigured, isLoading: stripeConfigLoading, refetch: refetchStripeConfig } = useIsStripeConfigured();
  const { data: isAdmin } = useIsCallerAdmin();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'tokens'>('stripe');
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const total = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const tokenBalance = userProfile?.tokenBalance ? Number(userProfile.tokenBalance) : 0;
  const totalInTokens = Math.ceil(total / 100);
  const hasEnoughTokens = tokenBalance >= totalInTokens;
  const bonusTokens = Math.ceil(total / 100 * 0.05); // 5% bonus

  // Refresh Stripe configuration when drawer opens
  useEffect(() => {
    if (open) {
      refetchStripeConfig();
    }
  }, [open, refetchStripeConfig]);

  const handleStripeCheckout = async () => {
    // Check if Stripe is configured before attempting checkout
    if (!stripeConfigured) {
      if (isAdmin) {
        toast.error('Stripe is not configured. Please configure Stripe in the Admin panel before accepting payments.');
      } else {
        toast.error('Checkout is temporarily unavailable. Please try again later or use an alternative payment method.');
      }
      return;
    }

    const items: ShoppingItem[] = cart.map(item => ({
      productName: item.product.name,
      productDescription: item.product.description,
      priceInCents: BigInt(item.product.price),
      quantity: BigInt(item.quantity),
      currency: 'usd',
    }));

    try {
      const baseUrl = `${window.location.protocol}//${window.location.host}`;
      const session = await createCheckout.mutateAsync({
        items,
        successUrl: `${baseUrl}/payment-success`,
        cancelUrl: `${baseUrl}/payment-failure`,
      });
      
      // Validate session URL before redirecting
      if (!session?.url) {
        throw new Error('Stripe session missing url');
      }
      
      window.location.href = session.url;
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      // Check for specific error messages from backend
      if (errorMessage.includes('Stripe needs to be first configured')) {
        if (isAdmin) {
          toast.error('Stripe configuration error: Please configure Stripe in the Admin panel with your secret key and allowed countries.');
        } else {
          toast.error('Checkout is temporarily unavailable. Please try again later or use an alternative payment method.');
        }
      } else if (errorMessage.includes('Stripe session missing url')) {
        toast.error('Unable to create checkout session. Please try again or contact support.');
      } else {
        // Generic error handling
        if (isAdmin) {
          toast.error(`Checkout failed: ${errorMessage}`);
        } else {
          toast.error('Unable to process checkout. Please try again or contact support.');
        }
      }
      console.error('Checkout error:', error);
    }
  };

  const handleTokenCheckout = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to pay with tokens');
      return;
    }

    if (!hasEnoughTokens) {
      toast.error('Insufficient token balance');
      return;
    }

    try {
      const productNames = cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
      await spendTokens.mutateAsync({
        amount: BigInt(totalInTokens),
        description: `Purchase: ${productNames}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['tokenBalance'] });
      queryClient.invalidateQueries({ queryKey: ['transactionHistory'] });
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      
      toast.success(
        <div className="flex items-center gap-2">
          <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Token" className="h-6 w-6" />
          <span>Purchase successful! {totalInTokens} tokens spent.</span>
        </div>
      );
      clearCart();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to complete purchase';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader>
          <DrawerTitle>Shopping Cart</DrawerTitle>
          <DrawerDescription>
            {cart.length === 0 ? 'Your cart is empty' : `${cart.length} item${cart.length > 1 ? 's' : ''} in cart`}
          </DrawerDescription>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-4 space-y-4">
          {cart.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <img 
                src="/assets/generated/cart-empty.dim_300x200.jpg" 
                alt="Empty cart" 
                className="mx-auto h-32 w-auto opacity-50"
              />
              <p className="text-muted-foreground">Add some products to get started</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-1">
                      <h3 className="font-semibold">{item.product.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-1">{item.product.description}</p>
                      <p className="text-lg font-bold text-primary mt-2">
                        ${(Number(item.product.price) / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeItem(item.product.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => updateQuantity(item.product.id, Math.min(Number(item.product.inventory), item.quantity + 1))}
                          disabled={item.quantity >= Number(item.product.inventory)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator />

              {/* Total */}
              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Token equivalent:</span>
                  <span className="flex items-center gap-1">
                    <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Token" className="h-4 w-4" />
                    {totalInTokens} tokens
                  </span>
                </div>
              </div>

              <Separator />

              {/* Payment Methods */}
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'tokens')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stripe" className="gap-2">
                    <CreditCard className="h-4 w-4" />
                    Card
                  </TabsTrigger>
                  <TabsTrigger value="tokens" className="gap-2">
                    <Coins className="h-4 w-4" />
                    Tokens
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="stripe" className="space-y-4">
                  {stripeConfigLoading ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>Checking payment availability...</AlertDescription>
                    </Alert>
                  ) : !stripeConfigured ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {isAdmin 
                          ? 'Stripe is not configured. Please configure Stripe in the Admin panel to accept card payments.'
                          : 'Card payments are temporarily unavailable. Please try using tokens or contact support.'}
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Pay securely with credit or debit card via Stripe
                      </p>
                      <Alert>
                        <img src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" alt="Bonus" className="h-4 w-4" />
                        <AlertDescription>
                          Earn {bonusTokens} bonus tokens (5%) with this purchase!
                        </AlertDescription>
                      </Alert>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="tokens" className="space-y-4">
                  {!isAuthenticated ? (
                    <Alert variant="destructive">
                      <LogIn className="h-4 w-4" />
                      <AlertDescription>
                        Please login to pay with tokens
                      </AlertDescription>
                    </Alert>
                  ) : !hasEnoughTokens ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Insufficient balance. You have {tokenBalance} tokens but need {totalInTokens} tokens.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Pay with your token balance
                      </p>
                      <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                        <span className="text-sm">Your balance:</span>
                        <span className="font-semibold flex items-center gap-1">
                          <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Token" className="h-5 w-5" />
                          {tokenBalance} tokens
                        </span>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </>
          )}
        </div>

        <DrawerFooter>
          {cart.length > 0 && (
            <>
              {paymentMethod === 'stripe' ? (
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={handleStripeCheckout}
                  disabled={createCheckout.isPending || stripeConfigLoading || !stripeConfigured}
                >
                  <CreditCard className="h-5 w-5" />
                  {createCheckout.isPending ? 'Processing...' : 'Checkout with Card'}
                </Button>
              ) : (
                <Button 
                  className="w-full gap-2" 
                  size="lg"
                  onClick={handleTokenCheckout}
                  disabled={!isAuthenticated || !hasEnoughTokens || spendTokens.isPending}
                >
                  <Coins className="h-5 w-5" />
                  {spendTokens.isPending ? 'Processing...' : 'Pay with Tokens'}
                </Button>
              )}
            </>
          )}
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
