import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddProduct, useUploadMediaFile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import type { Product, MediaFile } from '../backend';
import { ExternalBlob } from '../backend';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddProductDialog({ open, onOpenChange }: AddProductDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [inventory, setInventory] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number[]>([]);

  const { identity } = useInternetIdentity();
  const addProduct = useAddProduct();
  const uploadMediaFile = useUploadMediaFile();

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Filter for image files only
    const imageFilesOnly = files.filter(file => file.type.startsWith('image/'));
    if (imageFilesOnly.length !== files.length) {
      toast.error('Only image files are allowed');
    }

    // Add new files to existing ones (fixed: removed duplication)
    setImageFiles(prev => [...prev, ...imageFilesOnly]);

    // Create previews
    const newPreviews = imageFilesOnly.map(file => URL.createObjectURL(file));
    setImagePreviews(prev => [...prev, ...newPreviews]);

    // Initialize progress for new images
    setUploadProgress(prev => [...prev, ...imageFilesOnly.map(() => 0)]);
  };

  const removeImage = (index: number) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    const newProgress = uploadProgress.filter((_, i) => i !== index);
    
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
    setUploadProgress(newProgress);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price || !inventory) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!identity) {
      toast.error('Please login to add products');
      return;
    }

    const priceInCents = Math.round(parseFloat(price) * 100);
    if (isNaN(priceInCents) || priceInCents <= 0) {
      toast.error('Please enter a valid price');
      return;
    }

    const inventoryNum = parseInt(inventory);
    if (isNaN(inventoryNum) || inventoryNum < 0) {
      toast.error('Please enter a valid inventory count');
      return;
    }

    try {
      setUploadingImages(true);
      const uploadedImages: MediaFile[] = [];

      // Upload all images
      for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
          setUploadProgress(prev => {
            const newProgress = [...prev];
            newProgress[i] = percentage;
            return newProgress;
          });
        });

        const mediaFile: MediaFile = {
          name: `product-image-${Date.now()}-${i}-${file.name}`,
          blob,
          contentType: file.type,
          uploader: identity.getPrincipal(),
        };

        await uploadMediaFile.mutateAsync(mediaFile);
        uploadedImages.push(mediaFile);
      }

      // Create product with uploaded images
      const product: Product = {
        id: `product-${Date.now()}`,
        name: name.trim(),
        description: description.trim(),
        price: BigInt(priceInCents),
        inventory: BigInt(inventoryNum),
        images: uploadedImages,
      };

      await addProduct.mutateAsync(product);
      toast.success('Product added successfully!');
      
      // Clean up
      imagePreviews.forEach(url => URL.revokeObjectURL(url));
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add product';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setUploadingImages(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setInventory('');
    setImageFiles([]);
    setImagePreviews([]);
    setUploadProgress([]);
  };

  const isUploading = uploadingImages || addProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open && !isUploading) {
        imagePreviews.forEach(url => URL.revokeObjectURL(url));
        resetForm();
      }
      onOpenChange(open);
    }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Add Product</DialogTitle>
          <DialogDescription>Add a new product to the store with images</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-120px)] pr-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., 12-Hole Ocarina"
                required
                disabled={isUploading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Product description..."
                rows={3}
                required
                disabled={isUploading}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (USD) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="29.99"
                  required
                  disabled={isUploading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inventory">Inventory *</Label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  value={inventory}
                  onChange={(e) => setInventory(e.target.value)}
                  placeholder="10"
                  required
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Image Upload Section */}
            <div className="space-y-2">
              <Label>Product Images</Label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  disabled={isUploading}
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center gap-2"
                >
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <div className="text-sm text-muted-foreground">
                    Click to upload product images
                  </div>
                  <div className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 10MB each
                  </div>
                </label>
              </div>

              {/* Image Previews */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-3 gap-4 mt-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden bg-muted border">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      {!isUploading && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {uploadingImages && uploadProgress[index] !== undefined && (
                        <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                          <div className="text-center">
                            <Loader2 className="h-6 w-6 animate-spin mx-auto mb-1" />
                            <div className="text-xs font-medium">
                              {uploadProgress[index]}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {imagePreviews.length === 0 && (
                <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground">
                  <ImageIcon className="h-5 w-5" />
                  <span className="text-sm">No images selected</span>
                </div>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadingImages ? 'Uploading Images...' : 'Adding Product...'}
                </>
              ) : (
                'Add Product'
              )}
            </Button>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
