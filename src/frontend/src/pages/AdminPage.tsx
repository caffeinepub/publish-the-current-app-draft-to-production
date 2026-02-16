import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useIsCallerAdmin } from '../hooks/useQueries';
import { Shield, Settings, Image, Video, BookOpen, Package, CreditCard, Coins, ShoppingBag } from 'lucide-react';
import BrandingSection from '../components/admin/BrandingSection';
import MediaLibraryManager from '../components/MediaLibraryManager';
import AddTutorialDialog from '../components/AddTutorialDialog';
import AddProductDialog from '../components/AddProductDialog';
import MintTokensDialog from '../components/MintTokensDialog';
import RestoreProductsDialog from '../components/RestoreProductsDialog';
import PageSettingsSection from '../components/admin/PageSettingsSection';
import OrdersSection from '../components/admin/OrdersSection';
import PaymentSettingsSection from '../components/admin/PaymentSettingsSection';

export default function AdminPage() {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const [showAddTutorial, setShowAddTutorial] = useState(false);
  const [showAddProduct, setShowAddProduct] = useState(false);
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

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="branding" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Branding</span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2">
            <Settings className="h-4 w-4" />
            <span className="hidden sm:inline">Pages</span>
          </TabsTrigger>
          <TabsTrigger value="media" className="gap-2">
            <Image className="h-4 w-4" />
            <span className="hidden sm:inline">Media</span>
          </TabsTrigger>
          <TabsTrigger value="tutorials" className="gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Tutorials</span>
          </TabsTrigger>
          <TabsTrigger value="products" className="gap-2">
            <Package className="h-4 w-4" />
            <span className="hidden sm:inline">Products</span>
          </TabsTrigger>
          <TabsTrigger value="orders" className="gap-2">
            <ShoppingBag className="h-4 w-4" />
            <span className="hidden sm:inline">Orders</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <CreditCard className="h-4 w-4" />
            <span className="hidden sm:inline">Payments</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="gap-2">
            <Coins className="h-4 w-4" />
            <span className="hidden sm:inline">Tokens</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="branding">
          <BrandingSection />
        </TabsContent>

        <TabsContent value="pages">
          <PageSettingsSection />
        </TabsContent>

        <TabsContent value="media">
          <MediaLibraryManager />
        </TabsContent>

        <TabsContent value="tutorials">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                Tutorials
              </CardTitle>
              <CardDescription>Manage learning content and tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <AddTutorialDialog open={showAddTutorial} onOpenChange={setShowAddTutorial} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Products
              </CardTitle>
              <CardDescription>Manage store products and inventory</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} />
                <RestoreProductsDialog open={showRestoreProducts} onOpenChange={setShowRestoreProducts} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders">
          <OrdersSection />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentSettingsSection />
        </TabsContent>

        <TabsContent value="tokens">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Coins className="h-5 w-5" />
                Token Management
              </CardTitle>
              <CardDescription>Mint and distribute platform tokens</CardDescription>
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
