import { useState, useEffect } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Minus, Plus, Trash2, AlertCircle, Coins, LogIn } from 'lucide-react';
import { useSpendTokens, useGetCallerUserProfile, useGetStripePublicConfig, useIsCallerAdmin, useSavePurchaseOrder } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useCartStore } from '../lib/cartStore';
import StripeCardCheckoutForm from './checkout/StripeCardCheckoutForm';
import BuyerDetailsFields from './checkout/BuyerDetailsFields';
import { Variant_token_card, type OrderedProduct, type BuyerDetails, StripeMode } from '../backend';

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
  const spendTokens = useSpendTokens();
  const savePurchaseOrder = useSavePurchaseOrder();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: stripePublicConfig, isLoading: stripeConfigLoading, refetch: refetchStripeConfig } = useGetStripePublicConfig();
  const { data: isAdmin } = useIsCallerAdmin();
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'tokens'>('stripe');
  const queryClient = useQueryClient();

  // Token checkout buyer details
  const [tokenName, setTokenName] = useState('');
  const [tokenPhone, setTokenPhone] = useState('');
  const [tokenNotes, setTokenNotes] = useState('');
  const [tokenErrors, setTokenErrors] = useState<{ name?: string; phoneNumber?: string }>({});

  const isAuthenticated = !!identity;
  const total = cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0);
  const tokenBalance = userProfile?.tokenBalance ? Number(userProfile.tokenBalance) : 0;
  
  // Apply token discount (5% per token, max 100%)
  const maxDiscountPercent = Math.min(tokenBalance * 5, 100);
  const discountAmount = Math.floor(total * (maxDiscountPercent / 100));
  const finalTotal = Math.max(total - discountAmount, 0);
  
  const totalInTokens = Math.ceil(total / 100);
  const hasEnoughTokens = tokenBalance >= totalInTokens;
  const bonusTokens = Math.ceil(total / 100 * 0.05); // 5% bonus

  // Check if card payments are available based on active mode
  const isCardPaymentAvailable = stripePublicConfig 
    ? (stripePublicConfig.activeMode === StripeMode.test ? stripePublicConfig.hasTestKey : stripePublicConfig.hasLiveKey)
    : false;

  // Refresh Stripe configuration when drawer opens
  useEffect(() => {
    if (open) {
      refetchStripeConfig();
    }
  }, [open, refetchStripeConfig]);

  const validateTokenFields = (): boolean => {
    const newErrors: { name?: string; phoneNumber?: string } = {};

    if (!tokenName.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!tokenPhone.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (tokenPhone.trim().length < 10) {
      newErrors.phoneNumber = 'Please enter a valid phone number';
    }

    setTokenErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

    if (!validateTokenFields()) {
      return;
    }

    try {
      const productNames = cart.map(item => `${item.quantity}x ${item.product.name}`).join(', ');
      
      // Spend tokens first
      await spendTokens.mutateAsync({
        amount: BigInt(totalInTokens),
        description: `Purchase: ${productNames}`,
      });

      // Prepare order data
      const products: OrderedProduct[] = cart.map(item => ({
        id: item.product.id,
        name: item.product.name,
        price: item.product.price,
        quantity: BigInt(item.quantity),
      }));

      const buyerDetails: BuyerDetails = {
        name: tokenName.trim(),
        phoneNumber: tokenPhone.trim(),
        notes: tokenNotes.trim(),
      };

      // Save the order
      await savePurchaseOrder.mutateAsync({
        products,
        total: BigInt(total),
        buyerDetails,
        paymentType: Variant_token_card.token,
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
      
      // Reset form
      setTokenName('');
      setTokenPhone('');
      setTokenNotes('');
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to complete purchase';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleCardCheckoutSuccess = () => {
    // Don't close drawer or clear cart here - redirect will happen
  };

  const handleCardCheckoutError = (error: string) => {
    if (isAdmin) {
      toast.error(`Checkout failed: ${error}`);
    } else {
      toast.error('Unable to process checkout. Please try again or contact support.');
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
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          ) : (
            <>
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-4 p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.product.name}</h4>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.product.description}</p>
                    <p className="text-lg font-bold text-primary mt-2">
                      ${(Number(item.product.price) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(item.product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, -1)}
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(item.product.id, 1)}
                        disabled={item.quantity >= Number(item.product.inventory)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Total:</span>
                  <span>${(total / 100).toFixed(2)}</span>
                </div>
                {maxDiscountPercent > 0 && (
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Token discount ({maxDiscountPercent}%):</span>
                    <span>-${(discountAmount / 100).toFixed(2)}</span>
                  </div>
                )}
                <p className="text-sm text-muted-foreground">
                  ≈ {totalInTokens} tokens
                </p>
              </div>
            </>
          )}
        </div>

        {cart.length > 0 && (
          <DrawerFooter>
            <Tabs value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as 'stripe' | 'tokens')} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="stripe">Card Payment</TabsTrigger>
                <TabsTrigger value="tokens">Token Payment</TabsTrigger>
              </TabsList>

              <TabsContent value="stripe" className="space-y-4">
                {stripeConfigLoading ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>Checking payment availability...</AlertDescription>
                  </Alert>
                ) : !isCardPaymentAvailable ? (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {isAdmin 
                        ? `Card payments are not available. Please configure the ${stripePublicConfig?.activeMode === StripeMode.test ? 'Test' : 'Live'} Stripe key in the Admin panel.`
                        : 'Card payments are temporarily unavailable. Please try token payment or contact support.'}
                    </AlertDescription>
                  </Alert>
                ) : (
                  <StripeCardCheckoutForm
                    total={finalTotal}
                    bonusTokens={bonusTokens}
                    onSuccess={handleCardCheckoutSuccess}
                    onError={handleCardCheckoutError}
                  />
                )}
              </TabsContent>

              <TabsContent value="tokens" className="space-y-4">
                {!isAuthenticated ? (
                  <Alert>
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
                ) : null}
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Your balance:</span>
                    <span className="font-medium flex items-center gap-1">
                      <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Token" className="h-4 w-4" />
                      {tokenBalance} tokens
                    </span>
                  </div>

                  <BuyerDetailsFields
                    name={tokenName}
                    phoneNumber={tokenPhone}
                    notes={tokenNotes}
                    onNameChange={setTokenName}
                    onPhoneNumberChange={setTokenPhone}
                    onNotesChange={setTokenNotes}
                    errors={tokenErrors}
                  />

                  <Button 
                    className="w-full gap-2" 
                    onClick={handleTokenCheckout}
                    disabled={!isAuthenticated || !hasEnoughTokens || spendTokens.isPending || savePurchaseOrder.isPending}
                  >
                    <Coins className="h-4 w-4" />
                    {spendTokens.isPending || savePurchaseOrder.isPending ? 'Processing...' : `Pay ${totalInTokens} Tokens`}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
