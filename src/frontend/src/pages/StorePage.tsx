import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListProducts, useDeleteProduct, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ShoppingCart, Music, Trash2, Loader2, Plus, RefreshCw, AlertCircle, History, Edit } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../backend';
import AddProductDialog from '../components/AddProductDialog';
import EditProductDialog from '../components/EditProductDialog';
import RestoreProductsDialog from '../components/RestoreProductsDialog';
import ExternalBlobImage from '../components/ExternalBlobImage';
import { useCartStore } from '../lib/cartStore';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';

export default function StorePage() {
  const { data: products = [], isLoading, error, refetch } = useListProducts();
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteProduct = useDeleteProduct();
  const { identity } = useInternetIdentity();
  const addToCart = useCartStore(state => state.addToCart);
  const removeItem = useCartStore(state => state.removeItem);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [showRestoreProducts, setShowRestoreProducts] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success('Added to cart');
  };

  const handleEditClick = (product: Product) => {
    setProductToEdit(product);
    setShowEditProduct(true);
  };

  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      await deleteProduct.mutateAsync(productToDelete.id);
      toast.success('Product deleted successfully');
      setDeleteDialogOpen(false);
      setProductToDelete(null);
      // Remove from cart if present
      removeItem(productToDelete.id);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete product';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await refetch();
      toast.success('Product list refreshed');
    } catch (error) {
      toast.error('Failed to refresh products');
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Failed to load products</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>
              {error instanceof Error ? error.message : 'An error occurred while fetching products.'}
            </p>
            <p className="text-sm">
              This may occur after a canister rollback or upgrade. Try refreshing the page or restoring products from Version 26.
            </p>
            <div className="flex gap-2 mt-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Retry
              </Button>
              {isAdmin && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowRestoreProducts(true)}
                >
                  <History className="h-4 w-4 mr-2" />
                  Restore V26
                </Button>
              )}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.location.reload()}
              >
                Reload Page
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground">Browse our collection</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isRefreshing}
            title="Refresh product list"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          {isAdmin && (
            <Button onClick={() => setShowAddProduct(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Product
            </Button>
          )}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12 space-y-4">
          <AlertCircle className="h-24 w-24 mx-auto text-destructive opacity-50" />
          <p className="text-muted-foreground">Unable to display products at this time</p>
          {isAdmin && (
            <Button onClick={() => setShowRestoreProducts(true)} className="gap-2">
              <History className="h-4 w-4" />
              Restore Version 26 Products
            </Button>
          )}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Music className="h-24 w-24 mx-auto text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No products available yet</p>
          {isAdmin && (
            <div className="flex gap-2 justify-center">
              <Button onClick={() => setShowAddProduct(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Product
              </Button>
              <Button variant="outline" onClick={() => setShowRestoreProducts(true)} className="gap-2">
                <History className="h-4 w-4" />
                Restore V26 Products
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                {product.images.length > 0 ? (
                  <ExternalBlobImage
                    blob={product.images[0].blob}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    fallbackIcon={<Music className="h-16 w-16 text-muted-foreground" />}
                  />
                ) : (
                  <Music className="h-16 w-16 text-muted-foreground" />
                )}
                {isAdmin && (
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleEditClick(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDeleteClick(product)}
                      disabled={deleteProduct.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
                <div className="flex items-center justify-between pt-2">
                  <div className="text-2xl font-bold text-primary">
                    ${(Number(product.price) / 100).toFixed(2)}
                  </div>
                  <Badge variant={Number(product.inventory) > 0 ? 'default' : 'destructive'}>
                    {Number(product.inventory) > 0 ? `${product.inventory} in stock` : 'Out of stock'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button 
                  className="w-full gap-2" 
                  onClick={() => handleAddToCart(product)}
                  disabled={Number(product.inventory) === 0}
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} />
      {productToEdit && (
        <EditProductDialog 
          open={showEditProduct} 
          onOpenChange={setShowEditProduct}
          product={productToEdit}
        />
      )}
      <RestoreProductsDialog open={showRestoreProducts} onOpenChange={setShowRestoreProducts} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <img src="/assets/generated/warning-confirmation-icon-transparent.dim_32x32.png" alt="Warning" className="h-6 w-6" />
              Delete Product?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{productToDelete?.name}"? This action cannot be undone.
              All associated images will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProduct.isPending}
            >
              {deleteProduct.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
