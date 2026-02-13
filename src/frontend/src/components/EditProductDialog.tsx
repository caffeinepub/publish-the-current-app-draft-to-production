import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useUpdateProduct, useUploadMediaFile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, Upload, X, Image as ImageIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Product, MediaFile } from '../backend';
import { ExternalBlob } from '../backend';
import ExternalBlobImage from './ExternalBlobImage';

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Product;
}

export default function EditProductDialog({ open, onOpenChange, product }: EditProductDialogProps) {
  const { identity } = useInternetIdentity();
  const updateProduct = useUpdateProduct();
  const uploadMediaFile = useUploadMediaFile();
  const [name, setName] = useState(product.name);
  const [description, setDescription] = useState(product.description);
  const [price, setPrice] = useState((Number(product.price) / 100).toString());
  const [inventory, setInventory] = useState(product.inventory.toString());
  const [images, setImages] = useState<MediaFile[]>(product.images);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    if (open) {
      setName(product.name);
      setDescription(product.description);
      setPrice((Number(product.price) / 100).toString());
      setInventory(product.inventory.toString());
      setImages(product.images);
      setNewImages([]);
      setNewImagePreviews([]);
      setUploadProgress({});
    }
  }, [open, product]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      toast.error('Only image files are allowed');
    }

    setNewImages((prev) => [...prev, ...imageFiles]);
    const previews = imageFiles.map(file => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveExistingImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleRemoveNewImage = (index: number) => {
    URL.revokeObjectURL(newImagePreviews[index]);
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleMoveExistingImageLeft = (index: number) => {
    if (index === 0) return;
    setImages((prev) => {
      const newImages = [...prev];
      [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
      return newImages;
    });
  };

  const handleMoveExistingImageRight = (index: number) => {
    if (index === images.length - 1) return;
    setImages((prev) => {
      const newImages = [...prev];
      [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
      return newImages;
    });
  };

  const handleMoveNewImageLeft = (index: number) => {
    if (index === 0) return;
    setNewImages((prev) => {
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr;
    });
    setNewImagePreviews((prev) => {
      const newArr = [...prev];
      [newArr[index - 1], newArr[index]] = [newArr[index], newArr[index - 1]];
      return newArr;
    });
  };

  const handleMoveNewImageRight = (index: number) => {
    if (index === newImages.length - 1) return;
    setNewImages((prev) => {
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr;
    });
    setNewImagePreviews((prev) => {
      const newArr = [...prev];
      [newArr[index], newArr[index + 1]] = [newArr[index + 1], newArr[index]];
      return newArr;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error('Please log in to update products');
      return;
    }

    if (!name.trim() || !description.trim() || !price || !inventory) {
      toast.error('Please fill in all fields');
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
      const principal = identity.getPrincipal();
      const allImages: MediaFile[] = [...images];

      // Upload new images with progress tracking
      for (let i = 0; i < newImages.length; i++) {
        const file = newImages[i];
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
          setUploadProgress((prev) => ({ ...prev, [file.name]: percentage }));
        });

        const mediaFile: MediaFile = {
          name: `product-image-${Date.now()}-${i}-${file.name}`,
          blob,
          contentType: file.type,
          uploader: principal,
        };

        await uploadMediaFile.mutateAsync(mediaFile);
        allImages.push(mediaFile);
      }

      const updatedProduct: Product = {
        id: product.id,
        name: name.trim(),
        description: description.trim(),
        price: BigInt(priceInCents),
        inventory: BigInt(inventoryNum),
        images: allImages,
      };

      await updateProduct.mutateAsync(updatedProduct);
      toast.success('Product updated successfully');
      
      // Clean up previews
      newImagePreviews.forEach(url => URL.revokeObjectURL(url));
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update product');
      console.error('Update product error:', error);
    }
  };

  const isUploading = Object.keys(uploadProgress).length > 0 && Object.values(uploadProgress).some(p => p < 100);
  const isSaving = updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={(open) => {
      if (!open) {
        newImagePreviews.forEach(url => URL.revokeObjectURL(url));
      }
      onOpenChange(open);
    }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>Update product details and images</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter product name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter product description"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price (USD)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inventory">Inventory</Label>
              <Input
                id="inventory"
                type="number"
                min="0"
                value={inventory}
                onChange={(e) => setInventory(e.target.value)}
                placeholder="0"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
              {/* Existing Images */}
              {images.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Current Images</p>
                  <div className="grid grid-cols-2 gap-4">
                    {images.map((img, index) => (
                      <div key={`existing-${index}`} className="relative group">
                        <ExternalBlobImage
                          blob={img.blob}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                          fallbackIcon={<ImageIcon className="h-8 w-8 text-muted-foreground" />}
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleMoveExistingImageLeft(index)}
                            disabled={index === 0}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleMoveExistingImageRight(index)}
                            disabled={index === images.length - 1}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveExistingImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Images */}
              {newImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium">New Images</p>
                  <div className="grid grid-cols-2 gap-4">
                    {newImages.map((file, index) => (
                      <div key={`new-${index}`} className="relative group">
                        <img
                          src={newImagePreviews[index]}
                          alt={`New image ${index + 1}`}
                          className="w-full h-32 object-cover rounded"
                        />
                        <div className="absolute top-2 right-2 flex gap-1">
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleMoveNewImageLeft(index)}
                            disabled={index === 0}
                          >
                            <ChevronLeft className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleMoveNewImageRight(index)}
                            disabled={index === newImages.length - 1}
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Button>
                          <Button
                            type="button"
                            variant="destructive"
                            size="icon"
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => handleRemoveNewImage(index)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                        {uploadProgress[file.name] !== undefined && uploadProgress[file.name] < 100 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                            <div className="text-white text-sm">{uploadProgress[file.name]}%</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload Button */}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" className="w-full" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      Add More Images
                    </span>
                  </Button>
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving || isUploading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isUploading}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Update Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
