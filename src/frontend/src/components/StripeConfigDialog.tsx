import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSetStripeConfiguration, useGetStripeConfigurationAdmin, useIsStripeConfigured } from '../hooks/useQueries';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface StripeConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function StripeConfigDialog({ open, onOpenChange }: StripeConfigDialogProps) {
  const [secretKey, setSecretKey] = useState('');
  const [countries, setCountries] = useState('US,CA,GB');

  const { data: stripeConfig, isLoading: configLoading } = useGetStripeConfigurationAdmin();
  const { data: isConfigured } = useIsStripeConfigured();
  const setConfig = useSetStripeConfiguration();

  // Pre-fill form with existing configuration
  useEffect(() => {
    if (stripeConfig) {
      setCountries(stripeConfig.allowedCountries.join(','));
      // Don't pre-fill secret key for security, but show it's configured
    }
  }, [stripeConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secretKey.trim()) {
      toast.error('Please enter your Stripe secret key');
      return;
    }

    const allowedCountries = countries.split(',').map(c => c.trim()).filter(c => c);
    if (allowedCountries.length === 0) {
      toast.error('Please enter at least one country code');
      return;
    }

    try {
      await setConfig.mutateAsync({ secretKey: secretKey.trim(), allowedCountries });
      toast.success('Stripe configured successfully!');
      onOpenChange(false);
      setSecretKey('');
    } catch (error) {
      toast.error('Failed to configure Stripe');
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Configure Stripe (Legacy)</DialogTitle>
          <DialogDescription>
            This is the legacy configuration method. For full test/live mode support, use the Payment Settings in the Payments tab.
          </DialogDescription>
        </DialogHeader>

        {configLoading ? (
          <div className="py-4 text-center text-muted-foreground">
            Loading configuration...
          </div>
        ) : (
          <>
            {isConfigured && stripeConfig && (
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <p className="font-semibold">Stripe is currently configured</p>
                    <p className="text-sm">
                      Allowed countries: {stripeConfig.allowedCountries.join(', ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Secret key: ••••••••{stripeConfig.secretKey.slice(-4)}
                    </p>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {!isConfigured && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Stripe is not configured. Please enter your configuration below.
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="secretKey">Stripe Secret Key *</Label>
                <Input
                  id="secretKey"
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  placeholder={isConfigured ? "Enter new key to update" : "sk_test_..."}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {isConfigured ? 'Leave blank to keep existing key' : 'Your Stripe secret key from the dashboard'}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="countries">Allowed Countries *</Label>
                <Input
                  id="countries"
                  value={countries}
                  onChange={(e) => setCountries(e.target.value)}
                  placeholder="US,CA,GB"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Comma-separated country codes (e.g., US,CA,GB)
                </p>
              </div>
              <Button type="submit" className="w-full" disabled={setConfig.isPending}>
                {setConfig.isPending ? 'Configuring...' : isConfigured ? 'Update Configuration' : 'Configure Stripe'}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
