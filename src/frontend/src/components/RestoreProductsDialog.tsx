import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAddProduct, useUploadMediaFile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, Package, CheckCircle2 } from 'lucide-react';
import type { Product, MediaFile } from '../backend';
import { ExternalBlob } from '../backend';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RestoreProductsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ProductTemplate {
  name: string;
  description: string;
  price: number;
  inventory: number;
  imageAssets: string[];
}

const VERSION_26_PRODUCTS: ProductTemplate[] = [
  {
    name: '12-Hole Alto C Ocarina',
    description: 'Professional quality ceramic ocarina in the key of C. Perfect for beginners and intermediate players. Includes fingering chart and carrying pouch.',
    price: 49.99,
    inventory: 15,
    imageAssets: ['/assets/IMG_20260205_123210968_MFNR.jpg', '/assets/IMG_20260205_123224927_MFNR.jpg']
  },
  {
    name: 'Triple Chamber Ocarina',
    description: 'Advanced triple chamber ocarina with extended range. Hand-crafted ceramic with beautiful glaze finish. Ideal for experienced players.',
    price: 129.99,
    inventory: 8,
    imageAssets: ['/assets/IMG_20260207_111204487_MFNR_HDR.jpg', '/assets/IMG_20260207_111207696_MFNR_HDR.jpg']
  },
  {
    name: 'Beginner Ocarina Set',
    description: 'Complete starter set including 6-hole ocarina, instruction booklet, and online tutorial access. Perfect gift for aspiring musicians.',
    price: 29.99,
    inventory: 25,
    imageAssets: ['/assets/IMG_20260207_125741148_MFNR.jpg', '/assets/IMG_20260207_125749201_MFNR_HDR.jpg']
  },
  {
    name: 'Ocarina Display Stand',
    description: 'Elegant wooden display stand for your ocarina collection. Holds up to 3 ocarinas. Handcrafted from premium wood with felt padding.',
    price: 24.99,
    inventory: 20,
    imageAssets: ['/assets/IMG_20260207_125741148_MFNR-1.jpg']
  },
  {
    name: 'Ocarina Songbook Collection',
    description: 'Comprehensive songbook with 50+ popular songs arranged for ocarina. Includes sheet music and tablature. Digital download included.',
    price: 19.99,
    inventory: 50,
    imageAssets: ['/assets/IMG_20260207_125741148_MFNR-2.jpg']
  },
  {
    name: 'Premium Leather Ocarina Case',
    description: 'Handcrafted leather case with soft interior lining. Protects your ocarina during travel. Fits most 12-hole ocarinas.',
    price: 34.99,
    inventory: 18,
    imageAssets: ['/assets/IMG_20260207_125741148_MFNR-3.jpg']
  }
];

export default function RestoreProductsDialog({ open, onOpenChange }: RestoreProductsDialogProps) {
  const [restoring, setRestoring] = useState(false);
  const [restoredCount, setRestoredCount] = useState(0);
  const [currentProduct, setCurrentProduct] = useState('');
  const { identity } = useInternetIdentity();
  const addProduct = useAddProduct();
  const uploadMediaFile = useUploadMediaFile();

  const handleRestore = async () => {
    if (!identity) {
      toast.error('Please login to restore products');
      return;
    }

    setRestoring(true);
    setRestoredCount(0);
    let successCount = 0;

    try {
      for (const template of VERSION_26_PRODUCTS) {
        setCurrentProduct(template.name);

        try {
          const uploadedImages: MediaFile[] = [];

          // Upload images for this product
          for (let i = 0; i < template.imageAssets.length; i++) {
            const assetPath = template.imageAssets[i];
            
            try {
              // Fetch the image from assets
              const response = await fetch(assetPath);
              if (!response.ok) {
                console.warn(`Failed to fetch image: ${assetPath}`);
                continue;
              }
              
              const arrayBuffer = await response.arrayBuffer();
              const bytes = new Uint8Array(arrayBuffer);
              const blob = ExternalBlob.fromBytes(bytes);

              const mediaFile: MediaFile = {
                name: `product-${Date.now()}-${i}-${assetPath.split('/').pop()}`,
                blob,
                contentType: 'image/jpeg',
                uploader: identity.getPrincipal(),
              };

              await uploadMediaFile.mutateAsync(mediaFile);
              uploadedImages.push(mediaFile);
            } catch (imgError) {
              console.warn(`Failed to upload image ${assetPath}:`, imgError);
            }
          }

          // Create product
          const product: Product = {
            id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: template.name,
            description: template.description,
            price: BigInt(Math.round(template.price * 100)),
            inventory: BigInt(template.inventory),
            images: uploadedImages,
          };

          await addProduct.mutateAsync(product);
          successCount++;
          setRestoredCount(successCount);
        } catch (productError) {
          console.error(`Failed to restore product ${template.name}:`, productError);
          // Continue with next product
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully restored ${successCount} product${successCount !== 1 ? 's' : ''}!`);
        onOpenChange(false);
      } else {
        toast.error('Failed to restore any products');
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      toast.error(error?.message || 'Failed to restore products');
    } finally {
      setRestoring(false);
      setCurrentProduct('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Restore Version 26 Products
          </DialogTitle>
          <DialogDescription>
            This will restore {VERSION_26_PRODUCTS.length} products from Version 26 with their original descriptions and pricing.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {VERSION_26_PRODUCTS.map((product, index) => (
              <Card key={index} className={restoring && currentProduct === product.name ? 'border-primary' : ''}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-base">{product.name}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2 mt-1">
                        {product.description}
                      </CardDescription>
                    </div>
                    {restoring && currentProduct === product.name && (
                      <Loader2 className="h-5 w-5 animate-spin text-primary ml-2 flex-shrink-0" />
                    )}
                    {restoring && restoredCount > index && (
                      <CheckCircle2 className="h-5 w-5 text-green-500 ml-2 flex-shrink-0" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline">${product.price.toFixed(2)}</Badge>
                    <Badge variant="secondary">{product.inventory} in stock</Badge>
                    <span className="text-muted-foreground">{product.imageAssets.length} image{product.imageAssets.length !== 1 ? 's' : ''}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        <div className="flex gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={restoring}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            disabled={restoring}
            className="flex-1"
          >
            {restoring ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Restoring... ({restoredCount}/{VERSION_26_PRODUCTS.length})
              </>
            ) : (
              <>
                <Package className="mr-2 h-4 w-4" />
                Restore All Products
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
