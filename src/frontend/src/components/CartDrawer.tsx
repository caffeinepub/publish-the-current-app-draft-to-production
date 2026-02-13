import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Minus, Plus, Trash2, CreditCard, AlertCircle, Coins } from 'lucide-react';
import { useCreateCheckoutSession, useSpendTokens, useGetCallerUserProfile, useIsStripeConfigured, useIsCallerAdmin } from '../hooks/useQueries';
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
  
  const createCheckout = useCreateCheckoutSession();
  const spendTokens = useSpendTokens();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: stripeConfigured, isLoading: stripeConfigLoading } = useIsStripeConfigured();
  const { data: isAdmin } = useIsCallerAdmin();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'tokens'>('stripe');
  const queryClient = useQueryClient();

  const total = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const tokenBalance = userProfile?.tokenBalance ? Number(userProfile.tokenBalance) : 0;
  const totalInTokens = Math.ceil(total / 100);
  const hasEnoughTokens = tokenBalance >= totalInTokens;
  const bonusTokens = Math.ceil(total / 100 * 0.05); // 5% bonus

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
      } else if (errorMessage.includes('Unauthorized')) {
        toast.error('You must be logged in to complete checkout.');
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
          <Coins className="h-5 w-5 text-yellow-500" />
          <div>
            <div className="font-semibold">Purchase completed!</div>
            <div className="text-sm text-muted-foreground">You've earned {bonusTokens} bonus tokens!</div>
          </div>
        </div>,
        { duration: 5000 }
      );
      
      clearCart();
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || String(error);
      
      if (errorMessage.includes('Insufficient balance')) {
        toast.error('Insufficient token balance to complete this purchase.');
      } else if (errorMessage.includes('Unauthorized')) {
        toast.error('You must be logged in to complete this purchase.');
      } else {
        toast.error('Failed to complete purchase. Please try again.');
      }
      console.error('Token checkout error:', error);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Shopping Cart</DrawerTitle>
          <DrawerDescription>{cart.length} items in your cart</DrawerDescription>
        </DrawerHeader>
        <div className="px-4 pb-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {cart.length === 0 ? (
            <div className="text-center py-8">
              <img src="/assets/generated/cart-empty.dim_300x200.jpg" alt="Empty cart" className="mx-auto h-32 opacity-50" />
              <p className="text-muted-foreground mt-4">Your cart is empty</p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.product.id} className="flex items-center gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      ${(Number(item.product.price) / 100).toFixed(2)} each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, -1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => updateQuantity(item.product.id, 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="destructive"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <Coins className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                <div className="text-sm">
                  <span className="font-semibold">Earn {bonusTokens} bonus tokens</span>
                  <span className="text-muted-foreground"> with this purchase!</span>
                </div>
              </div>
            </>
          )}
        </div>
        {cart.length > 0 && (
          <>
            <Separator />
            <DrawerFooter>
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-semibold">Total:</span>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    ${(total / 100).toFixed(2)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    or {totalInTokens} tokens
                  </div>
                </div>
              </div>
              
              <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'tokens')} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stripe">Card</TabsTrigger>
                  <TabsTrigger value="tokens">Tokens</TabsTrigger>
                </TabsList>
                
                <TabsContent value="stripe" className="mt-4 space-y-3">
                  {!stripeConfigLoading && !stripeConfigured && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {isAdmin 
                          ? 'Stripe is not configured. Please configure it in the Admin panel to accept card payments.'
                          : 'Card payments are temporarily unavailable. Please use an alternative payment method.'}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Button 
                    onClick={handleStripeCheckout} 
                    disabled={createCheckout.isPending || stripeConfigLoading || !stripeConfigured} 
                    className="w-full gap-2"
                  >
                    <CreditCard className="h-4 w-4" />
                    {createCheckout.isPending ? 'Processing...' : 'Buy with Card'}
                  </Button>
                </TabsContent>
                
                <TabsContent value="tokens" className="mt-4 space-y-2">
                  <div className="text-sm text-center text-muted-foreground">
                    Your balance: {tokenBalance} tokens
                  </div>
                  <Button 
                    onClick={handleTokenCheckout} 
                    disabled={spendTokens.isPending || !hasEnoughTokens} 
                    className="w-full gap-2"
                    variant={hasEnoughTokens ? 'default' : 'destructive'}
                  >
                    <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Tokens" className="h-4 w-4" />
                    {spendTokens.isPending ? 'Processing...' : hasEnoughTokens ? 'Pay with Tokens' : 'Insufficient Balance'}
                  </Button>
                </TabsContent>
              </Tabs>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
