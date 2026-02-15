import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useGetPageSettings, useUpdatePageSettings, useGetStoreBanner, useUpdateStoreBanner, useUploadMediaFile } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { ExternalBlob } from '../../backend';
import type { PageSettings } from '../../types';
import type { MediaFile, StoreBanner } from '../../backend';
import ExternalBlobImage from '../ExternalBlobImage';

type PageKey = 'community' | 'learning';

interface PageSettingsFormProps {
  pageKey: PageKey;
  defaultTitle: string;
  defaultSubtitle: string;
  defaultBannerPath: string;
}

function PageSettingsForm({ pageKey, defaultTitle, defaultSubtitle, defaultBannerPath }: PageSettingsFormProps) {
  const { data: allPageSettings, isLoading: settingsLoading } = useGetPageSettings();
  const updatePageSettings = useUpdatePageSettings();
  const uploadMediaFile = useUploadMediaFile();
  const { identity } = useInternetIdentity();

  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedBannerBlob, setSavedBannerBlob] = useState<ExternalBlob | undefined>(undefined);

  const pageSettings = allPageSettings?.[pageKey];

  // Load current page settings values
  useEffect(() => {
    if (pageSettings) {
      setTitle(pageSettings.title);
      setSubtitle(pageSettings.subtitle);
      
      if (pageSettings.bannerImage) {
        setBannerPreview(pageSettings.bannerImage.getDirectURL());
        setSavedBannerBlob(pageSettings.bannerImage);
      } else {
        setBannerPreview(null);
        setSavedBannerBlob(undefined);
      }
    } else {
      // Use defaults if no settings saved
      setTitle(defaultTitle);
      setSubtitle(defaultSubtitle);
      setBannerPreview(null);
      setSavedBannerBlob(undefined);
    }
  }, [pageSettings, defaultTitle, defaultSubtitle]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setBannerFile(file);
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
      setHasChanges(true);
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setSavedBannerBlob(undefined);
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (pageSettings) {
      setTitle(pageSettings.title);
      setSubtitle(pageSettings.subtitle);
      setBannerFile(null);
      setBannerPreview(pageSettings.bannerImage ? pageSettings.bannerImage.getDirectURL() : null);
      setSavedBannerBlob(pageSettings.bannerImage);
    } else {
      setTitle(defaultTitle);
      setSubtitle(defaultSubtitle);
      setBannerFile(null);
      setBannerPreview(null);
      setSavedBannerBlob(undefined);
    }
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!identity) {
      toast.error('Please log in to save page settings');
      return;
    }

    try {
      let bannerBlob: ExternalBlob | undefined = savedBannerBlob;

      // Upload banner if changed
      if (bannerFile) {
        const bannerBytes = new Uint8Array(await bannerFile.arrayBuffer());
        const bannerExternalBlob = ExternalBlob.fromBytes(bannerBytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        const bannerMedia: MediaFile = {
          name: `${pageKey}-banner-${Date.now()}-${bannerFile.name}`,
          blob: bannerExternalBlob,
          contentType: bannerFile.type,
          uploader: identity.getPrincipal(),
        };

        await uploadMediaFile.mutateAsync(bannerMedia);
        bannerBlob = bannerExternalBlob;
      } else if (bannerPreview === null) {
        bannerBlob = undefined;
      }

      const newSettings: PageSettings = {
        title,
        subtitle,
        bannerImage: bannerBlob,
      };

      // Update all page settings with the new one for this page
      const updatedSettings = {
        community: allPageSettings?.community || { title: 'Community', subtitle: 'Share your recordings and connect with others' },
        learning: allPageSettings?.learning || { title: 'Learning Center', subtitle: 'Master the ocarina with AI-powered guidance' },
        store: allPageSettings?.store || { title: 'Store', subtitle: 'Browse our collection' },
        [pageKey]: newSettings,
      };

      await updatePageSettings.mutateAsync(updatedSettings);
      toast.success('Page settings updated successfully');
      setHasChanges(false);
      setBannerFile(null);
      setUploadProgress(undefined);
      setSavedBannerBlob(bannerBlob);
    } catch (error: any) {
      console.error('Failed to update page settings:', error);
      toast.error(error.message || 'Failed to update page settings');
    }
  };

  if (settingsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor={`${pageKey}-title`}>Page Title</Label>
        <Input
          id={`${pageKey}-title`}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Enter page title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`${pageKey}-subtitle`}>Page Subtitle</Label>
        <Textarea
          id={`${pageKey}-subtitle`}
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Enter page subtitle"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Banner Image</Label>
        <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
          {bannerPreview ? (
            <div className="relative">
              {savedBannerBlob && !bannerFile ? (
                <ExternalBlobImage
                  blob={savedBannerBlob}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded"
                />
              ) : (
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded"
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveBanner}
              >
                <X className="h-4 w-4" />
              </Button>
              {uploadProgress !== undefined && uploadProgress < 100 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                  <div className="text-white text-sm">Uploading: {uploadProgress}%</div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p className="text-sm">No banner image selected</p>
              <p className="text-xs text-muted-foreground mt-1">Will use default: {defaultBannerPath}</p>
            </div>
          )}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
              id={`${pageKey}-banner-upload`}
            />
            <Label htmlFor={`${pageKey}-banner-upload`} className="cursor-pointer">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {bannerPreview ? 'Change Banner' : 'Upload Banner'}
                </span>
              </Button>
            </Label>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updatePageSettings.isPending}
          className="flex-1"
        >
          {updatePageSettings.isPending ? (
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
          disabled={!hasChanges || updatePageSettings.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

interface StoreBannerFormProps {
  defaultTitle: string;
  defaultSubtitle: string;
  defaultBannerPath: string;
}

function StoreBannerForm({ defaultTitle, defaultSubtitle, defaultBannerPath }: StoreBannerFormProps) {
  const { data: storeBanner, isLoading: bannerLoading } = useGetStoreBanner();
  const updateStoreBanner = useUpdateStoreBanner();
  const uploadMediaFile = useUploadMediaFile();
  const { identity } = useInternetIdentity();

  const [title, setTitle] = useState(defaultTitle);
  const [subtitle, setSubtitle] = useState(defaultSubtitle);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedBannerBlob, setSavedBannerBlob] = useState<ExternalBlob | undefined>(undefined);

  // Load current store banner values
  useEffect(() => {
    if (storeBanner) {
      setTitle(storeBanner.title);
      setSubtitle(storeBanner.subtitle);
      
      if (storeBanner.bannerImage) {
        setBannerPreview(storeBanner.bannerImage.getDirectURL());
        setSavedBannerBlob(storeBanner.bannerImage);
      } else {
        setBannerPreview(null);
        setSavedBannerBlob(undefined);
      }
    } else {
      // Use defaults if no settings saved
      setTitle(defaultTitle);
      setSubtitle(defaultSubtitle);
      setBannerPreview(null);
      setSavedBannerBlob(undefined);
    }
  }, [storeBanner, defaultTitle, defaultSubtitle]);

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setBannerFile(file);
      const url = URL.createObjectURL(file);
      setBannerPreview(url);
      setHasChanges(true);
    }
  };

  const handleRemoveBanner = () => {
    setBannerFile(null);
    setBannerPreview(null);
    setSavedBannerBlob(undefined);
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (storeBanner) {
      setTitle(storeBanner.title);
      setSubtitle(storeBanner.subtitle);
      setBannerFile(null);
      setBannerPreview(storeBanner.bannerImage ? storeBanner.bannerImage.getDirectURL() : null);
      setSavedBannerBlob(storeBanner.bannerImage);
    } else {
      setTitle(defaultTitle);
      setSubtitle(defaultSubtitle);
      setBannerFile(null);
      setBannerPreview(null);
      setSavedBannerBlob(undefined);
    }
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!identity) {
      toast.error('Please log in to save store banner');
      return;
    }

    try {
      let bannerBlob: ExternalBlob | undefined = savedBannerBlob;

      // Upload banner if changed
      if (bannerFile) {
        const bannerBytes = new Uint8Array(await bannerFile.arrayBuffer());
        const bannerExternalBlob = ExternalBlob.fromBytes(bannerBytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        const bannerMedia: MediaFile = {
          name: `store-banner-${Date.now()}-${bannerFile.name}`,
          blob: bannerExternalBlob,
          contentType: bannerFile.type,
          uploader: identity.getPrincipal(),
        };

        await uploadMediaFile.mutateAsync(bannerMedia);
        bannerBlob = bannerExternalBlob;
      } else if (bannerPreview === null) {
        bannerBlob = undefined;
      }

      const newBanner: StoreBanner = {
        title,
        subtitle,
        bannerImage: bannerBlob,
      };

      await updateStoreBanner.mutateAsync(newBanner);
      toast.success('Store banner updated successfully');
      setHasChanges(false);
      setBannerFile(null);
      setUploadProgress(undefined);
      setSavedBannerBlob(bannerBlob);
    } catch (error: any) {
      console.error('Failed to update store banner:', error);
      toast.error(error.message || 'Failed to update store banner');
    }
  };

  if (bannerLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="store-title">Page Title</Label>
        <Input
          id="store-title"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Enter page title"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="store-subtitle">Page Subtitle</Label>
        <Textarea
          id="store-subtitle"
          value={subtitle}
          onChange={(e) => {
            setSubtitle(e.target.value);
            setHasChanges(true);
          }}
          placeholder="Enter page subtitle"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Banner Image</Label>
        <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
          {bannerPreview ? (
            <div className="relative">
              {savedBannerBlob && !bannerFile ? (
                <ExternalBlobImage
                  blob={savedBannerBlob}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded"
                />
              ) : (
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-48 object-cover rounded"
                />
              )}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={handleRemoveBanner}
              >
                <X className="h-4 w-4" />
              </Button>
              {uploadProgress !== undefined && uploadProgress < 100 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
                  <div className="text-white text-sm">Uploading: {uploadProgress}%</div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
              <ImageIcon className="h-12 w-12 mb-2" />
              <p className="text-sm">No banner image selected</p>
              <p className="text-xs text-muted-foreground mt-1">Will use default: {defaultBannerPath}</p>
            </div>
          )}
          <div>
            <Input
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
              id="store-banner-upload"
            />
            <Label htmlFor="store-banner-upload" className="cursor-pointer">
              <Button variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {bannerPreview ? 'Change Banner' : 'Upload Banner'}
                </span>
              </Button>
            </Label>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateStoreBanner.isPending}
          className="flex-1"
        >
          {updateStoreBanner.isPending ? (
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
          disabled={!hasChanges || updateStoreBanner.isPending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

export default function PageSettingsSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Page Settings</CardTitle>
        <CardDescription>Customize Community, Learning, and Store page headers, titles, and banner images</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="community" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="community">Community Page</TabsTrigger>
            <TabsTrigger value="learning">Learning Page</TabsTrigger>
            <TabsTrigger value="store">Store Page</TabsTrigger>
          </TabsList>
          <TabsContent value="community" className="mt-6">
            <PageSettingsForm
              pageKey="community"
              defaultTitle="Community"
              defaultSubtitle="Share your recordings and connect with others"
              defaultBannerPath="/assets/generated/community-banner.dim_800x400.jpg"
            />
          </TabsContent>
          <TabsContent value="learning" className="mt-6">
            <PageSettingsForm
              pageKey="learning"
              defaultTitle="Learning Center"
              defaultSubtitle="Master the ocarina with AI-powered guidance"
              defaultBannerPath="/assets/generated/learning-section-banner.dim_800x400.jpg"
            />
          </TabsContent>
          <TabsContent value="store" className="mt-6">
            <StoreBannerForm
              defaultTitle="Store"
              defaultSubtitle="Browse our collection"
              defaultBannerPath="/assets/generated/store-banner.dim_800x400.jpg"
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
