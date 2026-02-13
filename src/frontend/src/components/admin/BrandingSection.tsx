import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGetBranding, useUpdateBranding, useUploadMediaFile } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { ExternalBlob } from '../../backend';
import type { Branding, MediaFile } from '../../backend';
import HeroSettingsSection from './HeroSettingsSection';

export default function BrandingSection() {
  const { data: branding, isLoading: brandingLoading } = useGetBranding();
  const updateBranding = useUpdateBranding();
  const uploadMediaFile = useUploadMediaFile();
  const { identity } = useInternetIdentity();

  const [siteName, setSiteName] = useState('');
  const [slogan, setSlogan] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [iconPreview, setIconPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<{ logo?: number; icon?: number }>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Load current branding values
  useEffect(() => {
    if (branding) {
      setSiteName(branding.siteName);
      setSlogan(branding.slogan);
      
      if (branding.logo) {
        setLogoPreview(branding.logo.getDirectURL());
      }
      if (branding.icon) {
        setIconPreview(branding.icon.getDirectURL());
      }
    }
  }, [branding]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setLogoFile(file);
      const url = URL.createObjectURL(file);
      setLogoPreview(url);
      setHasChanges(true);
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setIconFile(file);
      const url = URL.createObjectURL(file);
      setIconPreview(url);
      setHasChanges(true);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
    setHasChanges(true);
  };

  const handleRemoveIcon = () => {
    setIconFile(null);
    setIconPreview(null);
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (branding) {
      setSiteName(branding.siteName);
      setSlogan(branding.slogan);
      setLogoFile(null);
      setIconFile(null);
      setLogoPreview(branding.logo ? branding.logo.getDirectURL() : null);
      setIconPreview(branding.icon ? branding.icon.getDirectURL() : null);
      setHasChanges(false);
    }
  };

  const handleSave = async () => {
    if (!identity) {
      toast.error('Please log in to save branding');
      return;
    }

    try {
      let logoBlob: ExternalBlob | undefined = branding?.logo || undefined;
      let iconBlob: ExternalBlob | undefined = branding?.icon || undefined;

      // Upload logo if changed
      if (logoFile) {
        const logoBytes = new Uint8Array(await logoFile.arrayBuffer());
        const logoExternalBlob = ExternalBlob.fromBytes(logoBytes).withUploadProgress((percentage) => {
          setUploadProgress(prev => ({ ...prev, logo: percentage }));
        });

        const logoMedia: MediaFile = {
          name: `logo-${Date.now()}-${logoFile.name}`,
          blob: logoExternalBlob,
          contentType: logoFile.type,
          uploader: identity.getPrincipal(),
        };

        await uploadMediaFile.mutateAsync(logoMedia);
        logoBlob = logoExternalBlob;
      } else if (logoPreview === null) {
        logoBlob = undefined;
      }

      // Upload icon if changed
      if (iconFile) {
        const iconBytes = new Uint8Array(await iconFile.arrayBuffer());
        const iconExternalBlob = ExternalBlob.fromBytes(iconBytes).withUploadProgress((percentage) => {
          setUploadProgress(prev => ({ ...prev, icon: percentage }));
        });

        const iconMedia: MediaFile = {
          name: `icon-${Date.now()}-${iconFile.name}`,
          blob: iconExternalBlob,
          contentType: iconFile.type,
          uploader: identity.getPrincipal(),
        };

        await uploadMediaFile.mutateAsync(iconMedia);
        iconBlob = iconExternalBlob;
      } else if (iconPreview === null) {
        iconBlob = undefined;
      }

      const newBranding: Branding = {
        siteName,
        slogan,
        logo: logoBlob,
        icon: iconBlob,
      };

      await updateBranding.mutateAsync(newBranding);
      toast.success('Branding updated successfully');
      setHasChanges(false);
      setLogoFile(null);
      setIconFile(null);
      setUploadProgress({});
    } catch (error: any) {
      console.error('Failed to update branding:', error);
      toast.error(error.message || 'Failed to update branding');
    }
  };

  if (brandingLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Site Branding</CardTitle>
            <CardDescription>Loading branding settings...</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Site Branding</CardTitle>
          <CardDescription>Customize your site's name, slogan, logo, and icon</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteName">Site Name</Label>
            <Input
              id="siteName"
              value={siteName}
              onChange={(e) => {
                setSiteName(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Enter site name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="slogan">Slogan</Label>
            <Textarea
              id="slogan"
              value={slogan}
              onChange={(e) => {
                setSlogan(e.target.value);
                setHasChanges(true);
              }}
              placeholder="Enter site slogan"
              rows={3}
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-40 object-contain rounded"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveLogo}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {uploadProgress.logo !== undefined && uploadProgress.logo < 100 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                        <div className="text-white text-sm">Uploading: {uploadProgress.logo}%</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <p className="text-sm">No logo selected</p>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <Label htmlFor="logo-upload" className="cursor-pointer">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {logoPreview ? 'Change Logo' : 'Upload Logo'}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>

            {/* Icon Upload */}
            <div className="space-y-2">
              <Label>Icon (Favicon)</Label>
              <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
                {iconPreview ? (
                  <div className="relative">
                    <img
                      src={iconPreview}
                      alt="Icon preview"
                      className="w-full h-40 object-contain rounded"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveIcon}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                    {uploadProgress.icon !== undefined && uploadProgress.icon < 100 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                        <div className="text-white text-sm">Uploading: {uploadProgress.icon}%</div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                    <ImageIcon className="h-12 w-12 mb-2" />
                    <p className="text-sm">No icon selected</p>
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleIconChange}
                    className="hidden"
                    id="icon-upload"
                  />
                  <Label htmlFor="icon-upload" className="cursor-pointer">
                    <Button variant="outline" className="w-full" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-2" />
                        {iconPreview ? 'Change Icon' : 'Upload Icon'}
                      </span>
                    </Button>
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleSave}
              disabled={!hasChanges || updateBranding.isPending}
              className="flex-1"
            >
              {updateBranding.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={!hasChanges || updateBranding.isPending}
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      <HeroSettingsSection />
    </div>
  );
}
