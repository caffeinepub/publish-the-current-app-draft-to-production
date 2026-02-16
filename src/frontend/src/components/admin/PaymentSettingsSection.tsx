import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useGetStripeAdminConfig, useSetStripeSecretKey, useSetStripeActiveMode } from '../../hooks/useQueries';
import { toast } from 'sonner';
import { CheckCircle2, AlertCircle, CreditCard } from 'lucide-react';
import { StripeMode } from '../../backend';

export default function PaymentSettingsSection() {
  const [testKey, setTestKey] = useState('');
  const [liveKey, setLiveKey] = useState('');
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { data: adminConfig, isLoading: configLoading, refetch } = useGetStripeAdminConfig();
  const setSecretKey = useSetStripeSecretKey();
  const setActiveMode = useSetStripeActiveMode();

  // Load existing configuration
  useEffect(() => {
    if (adminConfig) {
      setIsLiveMode(adminConfig.activeMode === StripeMode.live);
      // Don't pre-fill keys for security, but we know they exist
    }
  }, [adminConfig]);

  const handleSave = async () => {
    // Validate at least one key is provided
    if (!testKey.trim() && !liveKey.trim() && !adminConfig) {
      toast.error('Please enter at least one Stripe secret key');
      return;
    }

    setIsSaving(true);
    try {
      // Update test key if provided
      if (testKey.trim()) {
        await setSecretKey.mutateAsync({
          mode: StripeMode.test,
          secretKey: testKey.trim(),
        });
      }

      // Update live key if provided
      if (liveKey.trim()) {
        await setSecretKey.mutateAsync({
          mode: StripeMode.live,
          secretKey: liveKey.trim(),
        });
      }

      // Update active mode
      const targetMode = isLiveMode ? StripeMode.live : StripeMode.test;
      await setActiveMode.mutateAsync(targetMode);

      toast.success('Payment settings saved successfully!');
      
      // Clear input fields after successful save
      setTestKey('');
      setLiveKey('');
      
      // Refetch to get updated config
      await refetch();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to save payment settings';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (configLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Settings
          </CardTitle>
          <CardDescription>Configure Stripe payment processing</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center text-muted-foreground">
            Loading configuration...
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasTestKey = adminConfig?.testSecretKey && adminConfig.testSecretKey !== '';
  const hasLiveKey = adminConfig?.liveSecretKey && adminConfig.liveSecretKey !== '';
  const isConfigured = hasTestKey || hasLiveKey;
  const activeMode = adminConfig?.activeMode || StripeMode.test;
  const activeModeConfigured = activeMode === StripeMode.test ? hasTestKey : hasLiveKey;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Settings
        </CardTitle>
        <CardDescription>Configure Stripe payment processing with test and live keys</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isConfigured && activeModeConfigured ? (
          <Alert>
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-semibold">Stripe is currently configured</p>
                <p className="text-sm">
                  Active mode: <span className="font-medium">{activeMode === StripeMode.test ? 'Test' : 'Live'}</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Test key: {hasTestKey ? `••••••••${adminConfig.testSecretKey.slice(-4)}` : 'Not set'}
                </p>
                <p className="text-sm text-muted-foreground">
                  Live key: {hasLiveKey ? `••••••••${adminConfig.liveSecretKey.slice(-4)}` : 'Not set'}
                </p>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {!isConfigured 
                ? 'Stripe is not configured. Please enter your keys below.'
                : `Active mode (${activeMode === StripeMode.test ? 'Test' : 'Live'}) key is missing. Please configure it below.`
              }
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="testKey">Stripe Test Secret Key</Label>
            <Input
              id="testKey"
              type="password"
              value={testKey}
              onChange={(e) => setTestKey(e.target.value)}
              placeholder={hasTestKey ? "Enter new test key to update" : "sk_test_..."}
            />
            <p className="text-xs text-muted-foreground">
              {hasTestKey 
                ? 'Currently configured. Enter a new key to update.' 
                : 'Your Stripe test secret key from the dashboard'}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="liveKey">Stripe Live Secret Key</Label>
            <Input
              id="liveKey"
              type="password"
              value={liveKey}
              onChange={(e) => setLiveKey(e.target.value)}
              placeholder={hasLiveKey ? "Enter new live key to update" : "sk_live_..."}
            />
            <p className="text-xs text-muted-foreground">
              {hasLiveKey 
                ? 'Currently configured. Enter a new key to update.' 
                : 'Your Stripe live secret key from the dashboard'}
            </p>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="mode-toggle" className="text-base">
                {isLiveMode ? 'Live Mode' : 'Test Mode'}
              </Label>
              <p className="text-sm text-muted-foreground">
                {isLiveMode 
                  ? 'Using live Stripe key for real payments' 
                  : 'Using test Stripe key for testing'}
              </p>
            </div>
            <Switch
              id="mode-toggle"
              checked={isLiveMode}
              onCheckedChange={setIsLiveMode}
            />
          </div>

          <Button 
            onClick={handleSave} 
            className="w-full" 
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : isConfigured ? 'Update Settings' : 'Save Settings'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
