import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Shield, Settings, Image, Video, BookOpen, Package, CreditCard, Coins } from 'lucide-react';
import BrandingSection from '../components/admin/BrandingSection';
import MediaLibraryManager from '../components/MediaLibraryManager';
import AddTutorialDialog from '../components/AddTutorialDialog';
import AddProductDialog from '../components/AddProductDialog';
import StripeConfigDialog from '../components/StripeConfigDialog';
import MintTokensDialog from '../components/MintTokensDialog';
import RestoreProductsDialog from '../components/RestoreProductsDialog';
import PageSettingsSection from '../components/admin/PageSettingsSection';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [showAddTutorial, setShowAddTutorial] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStripeConfig, setShowStripeConfig] = useState(false);
  const [showMintTokens, setShowMintTokens] = useState(false);
  const [showRestoreProducts, setShowRestoreProducts] = useState(false);

  if (!identity) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Panel
            </CardTitle>
            <CardDescription>Please log in to access the admin panel</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (adminLoading) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Admin Panel
            </CardTitle>
            <CardDescription>Checking permissions...</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
            <CardDescription>You do not have permission to access the admin panel</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Shield className="h-8 w-8" />
          Admin Panel
        </h1>
        <p className="text-muted-foreground mt-2">Manage your platform settings and content</p>
      </div>

      <Tabs defaultValue="branding" className="w-full">
        <TabsList className="grid w-full grid-cols-7 h-auto">
          <TabsTrigger value="branding" className="gap-2 flex-col py-3">
            <Settings className="h-4 w-4" />
            <span className="text-xs">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2 flex-col py-3">
            <Image className="h-4 w-4" />
            <span className="text-xs">Pages</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2 flex-col py-3">
            <Video className="h-4 w-4" />
            <span className="text-xs">Media</span>
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="gap-2 flex-col py-3">
            <BookOpen className="h-4 w-4" />
            <span className="text-xs">Tutorials</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2 flex-col py-3">
            <Package className="h-4 w-4" />
            <span className="text-xs">Products</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2 flex-col py-3">
            <CreditCard className="h-4 w-4" />
            <span className="text-xs">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="gap-2 flex-col py-3">
            <Coins className="h-4 w-4" />
            <span className="text-xs">Tokens</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6 mt-6">
          <BrandingSection />
        </TabsContent>

        <TabsContent value="pages" className="space-y-6 mt-6">
          <PageSettingsSection />
        </TabsContent>

        <TabsContent value="media" className="space-y-6 mt-6">
          <MediaLibraryManager />
        </TabsContent>

        <TabsContent value="tutorials" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Tutorial Management</CardTitle>
              <CardDescription>Add and manage video tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <AddTutorialDialog open={showAddTutorial} onOpenChange={setShowAddTutorial} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Management</CardTitle>
              <CardDescription>Add and manage store products</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} />
              <RestoreProductsDialog open={showRestoreProducts} onOpenChange={setShowRestoreProducts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Configuration</CardTitle>
              <CardDescription>Configure Stripe payment settings</CardDescription>
            </CardHeader>
            <CardContent>
              <StripeConfigDialog open={showStripeConfig} onOpenChange={setShowStripeConfig} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Token Management</CardTitle>
              <CardDescription>Mint and distribute tokens to users</CardDescription>
            </CardHeader>
            <CardContent>
              <MintTokensDialog open={showMintTokens} onOpenChange={setShowMintTokens} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
