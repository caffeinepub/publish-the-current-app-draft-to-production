import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListProducts, useDeleteProduct, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { ShoppingCart, Music, Trash2, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '../backend';
import AddProductDialog from '../components/AddProductDialog';
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

export default function StorePage() {
  const { data: products = [], isLoading } = useListProducts();
  const { data: isAdmin } = useIsCallerAdmin();
  const deleteProduct = useDeleteProduct();
  const { identity } = useInternetIdentity();
  const addToCart = useCartStore(state => state.addToCart);
  const removeItem = useCartStore(state => state.removeItem);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  const isAuthenticated = !!identity;

  const handleAddToCart = (product: Product) => {
    addToCart(product);
    toast.success('Added to cart');
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

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          src="/assets/generated/store-banner.dim_800x400.jpg"
          alt="Store"
          className="w-full h-[200px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-transparent flex items-center">
          <div className="container">
            <h1 className="text-4xl font-bold">Store</h1>
            <p className="text-lg text-muted-foreground mt-2">Quality ocarinas and accessories</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Products</h2>
          <p className="text-muted-foreground">Browse our collection</p>
        </div>
        {isAuthenticated && (
          <Button onClick={() => setShowAddProduct(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Product
          </Button>
        )}
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <Music className="h-24 w-24 mx-auto text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">No products available yet</p>
          {isAuthenticated && (
            <Button onClick={() => setShowAddProduct(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add First Product
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[0].blob.getDirectURL()}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music className="h-16 w-16 text-muted-foreground" />
                )}
                {isAdmin && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8"
                    onClick={() => handleDeleteClick(product)}
                    disabled={deleteProduct.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
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
                  disabled={Number(product.inventory) === 0 || !isAuthenticated}
                >
                  <ShoppingCart className="h-4 w-4" />
                  {!isAuthenticated ? 'Login to Purchase' : 'Add to Cart'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddProductDialog open={showAddProduct} onOpenChange={setShowAddProduct} />

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
