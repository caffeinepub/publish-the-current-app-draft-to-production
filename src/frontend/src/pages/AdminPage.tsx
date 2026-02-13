import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIsCallerAdmin, useIsStripeConfigured, useClearTutorials, useListTutorials } from '../hooks/useQueries';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Shield, Package, CreditCard, Coins, Video, BookOpen, Trash2 } from 'lucide-react';
import AddProductDialog from '../components/AddProductDialog';
import StripeConfigDialog from '../components/StripeConfigDialog';
import MintTokensDialog from '../components/MintTokensDialog';
import AddTutorialDialog from '../components/AddTutorialDialog';
import MediaLibraryManager from '../components/MediaLibraryManager';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function AdminPage() {
  const { data: isAdmin, isLoading } = useIsCallerAdmin();
  const { data: stripeConfigured } = useIsStripeConfigured();
  const { data: tutorials = [] } = useListTutorials();
  const clearTutorials = useClearTutorials();
  const navigate = useNavigate();
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showStripeConfig, setShowStripeConfig] = useState(false);
  const [showMintTokens, setShowMintTokens] = useState(false);
  const [showAddTutorial, setShowAddTutorial] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const handleClearTutorials = async () => {
    try {
      await clearTutorials.mutateAsync();
      toast.success('All tutorials have been deleted successfully');
      setShowClearConfirm(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete tutorials');
      console.error('Clear tutorials error:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="container py-16 text-center space-y-4">
        <Shield className="h-16 w-16 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">You don't have permission to access this page</p>
        <Button onClick={() => navigate({ to: '/' })}>Go Home</Button>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Admin Panel</h1>
        <p className="text-muted-foreground mt-2">Manage your platform</p>
      </div>

      <Tabs defaultValue="media" className="space-y-6">
        <TabsList>
          <TabsTrigger value="media">Media Library</TabsTrigger>
          <TabsTrigger value="tutorials">Tutorials</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="tokens">Tokens</TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Media Library
              </CardTitle>
              <CardDescription>Upload and manage video files for tutorials</CardDescription>
            </CardHeader>
            <CardContent>
              <MediaLibraryManager />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tutorials" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Tutorial Management
                  </CardTitle>
                  <CardDescription>Create and manage learning tutorials</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setShowAddTutorial(true)}>Create Tutorial</Button>
                  {tutorials.length > 0 && (
                    <Button 
                      variant="destructive" 
                      onClick={() => setShowClearConfirm(true)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div>
                    <h3 className="font-semibold">Total Tutorials</h3>
                    <p className="text-2xl font-bold text-primary">{tutorials.length}</p>
                  </div>
                  <BookOpen className="h-12 w-12 text-muted-foreground" />
                </div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• Create new tutorials by linking uploaded video files</p>
                  <p>• Set difficulty levels and pricing for each tutorial</p>
                  <p>• Mark tutorials as free for public access</p>
                  <p>• Clear all tutorials to reset the learning library</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Product Management
                  </CardTitle>
                  <CardDescription>Add and manage store products</CardDescription>
                </div>
                <Button onClick={() => setShowAddProduct(true)}>Add Product</Button>
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Stripe Configuration
                  </CardTitle>
                  <CardDescription>
                    {stripeConfigured ? 'Stripe is configured' : 'Configure Stripe to accept payments'}
                  </CardDescription>
                </div>
                <Button onClick={() => setShowStripeConfig(true)}>
                  {stripeConfigured ? 'Update Config' : 'Configure Stripe'}
                </Button>
              </div>
            </CardHeader>
          </Card>
        </TabsContent>

        <TabsContent value="tokens" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Coins className="h-5 w-5" />
                    Token Management
                  </CardTitle>
                  <CardDescription>
                    Mint and distribute tokens to users
                  </CardDescription>
                </div>
                <Button onClick={() => setShowMintTokens(true)}>Mint Tokens</Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-muted/50">
                  <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Tokens" className="h-12 w-12" />
                  <div>
                    <h3 className="font-semibold">In-App Currency</h3>
                    <p className="text-sm text-muted-foreground">
                      Users can earn, transfer, and spend tokens within the platform
                    </p>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>• Mint tokens to reward users or provide initial balances</p>
                  <p>• Users can transfer tokens to each other</p>
                  <p>• Tokens can be used to purchase products and content</p>
                  <p>• Conversion rate: 1 token = $0.01 USD</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialogs */}
      {showAddProduct && <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} />}
      {showStripeConfig && <StripeConfigDialog open={showStripeConfig} onOpenChange={setShowStripeConfig} />}
      {showMintTokens && <MintTokensDialog open={showMintTokens} onOpenChange={setShowMintTokens} />}
      {showAddTutorial && <AddTutorialDialog open={showAddTutorial} onOpenChange={setShowAddTutorial} />}

      {/* Clear Tutorials Confirmation Dialog */}
      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <img 
                src="/assets/generated/warning-confirmation-icon-transparent.dim_32x32.png" 
                alt="Warning" 
                className="h-6 w-6"
              />
              Clear All Tutorials?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>This action will permanently delete:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>All {tutorials.length} tutorial entries</li>
                <li>Associated video files and metadata</li>
                <li>Tutorial completion records</li>
                <li>AI feedback data</li>
                <li>User purchase records for tutorials</li>
              </ul>
              <p className="font-semibold text-destructive pt-2">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={clearTutorials.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearTutorials}
              disabled={clearTutorials.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {clearTutorials.isPending ? 'Deleting...' : 'Delete All Tutorials'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
