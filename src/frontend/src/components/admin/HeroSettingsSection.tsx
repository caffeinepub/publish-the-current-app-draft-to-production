import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useGetHeroSettings, useUpdateHeroSettings, useUploadMediaFile } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import type { HeroSettings } from '../../types';
import type { MediaFile } from '../../backend';
import { ExternalBlob } from '../../backend';
import ExternalBlobImage from '../ExternalBlobImage';

export default function HeroSettingsSection() {
  const { data: heroSettings, isLoading: settingsLoading } = useGetHeroSettings();
  const updateHeroSettings = useUpdateHeroSettings();
  const uploadMediaFile = useUploadMediaFile();
  const { identity } = useInternetIdentity();

  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [heroImageFile, setHeroImageFile] = useState<File | null>(null);
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [hasChanges, setHasChanges] = useState(false);
  const [savedHeroImageBlob, setSavedHeroImageBlob] = useState<ExternalBlob | undefined>(undefined);

  useEffect(() => {
    if (heroSettings) {
      setHeadline(heroSettings.heroHeadline);
      setSubheadline(heroSettings.heroSubheadline);
      
      if (heroSettings.heroImage) {
        setHeroImagePreview(heroSettings.heroImage.getDirectURL());
        setSavedHeroImageBlob(heroSettings.heroImage);
      } else {
        setHeroImagePreview(null);
        setSavedHeroImageBlob(undefined);
      }
    }
  }, [heroSettings]);

  const handleHeroImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setHeroImageFile(file);
      const url = URL.createObjectURL(file);
      setHeroImagePreview(url);
      setHasChanges(true);
    }
  };

  const handleRemoveHeroImage = () => {
    setHeroImageFile(null);
    setHeroImagePreview(null);
    setSavedHeroImageBlob(undefined);
    setHasChanges(true);
  };

  const handleCancel = () => {
    if (heroSettings) {
      setHeadline(heroSettings.heroHeadline);
      setSubheadline(heroSettings.heroSubheadline);
      setHeroImageFile(null);
      setHeroImagePreview(heroSettings.heroImage ? heroSettings.heroImage.getDirectURL() : null);
      setSavedHeroImageBlob(heroSettings.heroImage);
    }
    setHasChanges(false);
  };

  const handleSave = async () => {
    if (!identity) {
      toast.error('Please log in to save hero settings');
      return;
    }

    try {
      let heroImageBlob: ExternalBlob | undefined = savedHeroImageBlob;

      if (heroImageFile) {
        const imageBytes = new Uint8Array(await heroImageFile.arrayBuffer());
        const imageExternalBlob = ExternalBlob.fromBytes(imageBytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        const imageMedia: MediaFile = {
          name: `hero-image-${Date.now()}-${heroImageFile.name}`,
          blob: imageExternalBlob,
          contentType: heroImageFile.type,
          uploader: identity.getPrincipal(),
        };

        await uploadMediaFile.mutateAsync(imageMedia);
        heroImageBlob = imageExternalBlob;
      } else if (heroImagePreview === null) {
        heroImageBlob = undefined;
      }

      const newSettings: HeroSettings = {
        heroHeadline: headline,
        heroSubheadline: subheadline,
        heroImage: heroImageBlob,
      };

      await updateHeroSettings.mutateAsync(newSettings);
      toast.success('Hero settings updated successfully');
      setHasChanges(false);
      setHeroImageFile(null);
      setUploadProgress(undefined);
      setSavedHeroImageBlob(heroImageBlob);
    } catch (error: any) {
      console.error('Failed to update hero settings:', error);
      toast.error(error.message || 'Failed to update hero settings');
    }
  };

  if (settingsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Hero Section Settings</CardTitle>
          <CardDescription>Customize the homepage hero section</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Hero Section Settings</CardTitle>
        <CardDescription>Customize the homepage hero section</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="headline">Headline</Label>
          <Input
            id="headline"
            value={headline}
            onChange={(e) => {
              setHeadline(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Enter hero headline"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subheadline">Subheadline</Label>
          <Textarea
            id="subheadline"
            value={subheadline}
            onChange={(e) => {
              setSubheadline(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Enter hero subheadline"
            rows={2}
          />
        </div>

        <div className="space-y-2">
          <Label>Hero Image</Label>
          <div className="border-2 border-dashed rounded-lg p-4 space-y-4">
            {heroImagePreview ? (
              <div className="relative">
                {savedHeroImageBlob && !heroImageFile ? (
                  <ExternalBlobImage
                    blob={savedHeroImageBlob}
                    alt="Hero preview"
                    className="w-full h-48 object-cover rounded"
                  />
                ) : (
                  <img
                    src={heroImagePreview}
                    alt="Hero preview"
                    className="w-full h-48 object-cover rounded"
                  />
                )}
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveHeroImage}
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
                <Upload className="h-12 w-12 mb-2" />
                <p className="text-sm">No hero image selected</p>
              </div>
            )}
            <div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleHeroImageChange}
                className="hidden"
                id="hero-image-upload"
              />
              <Label htmlFor="hero-image-upload" className="cursor-pointer">
                <Button variant="outline" className="w-full" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    {heroImagePreview ? 'Change Hero Image' : 'Upload Hero Image'}
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateHeroSettings.isPending}
            className="flex-1"
          >
            {updateHeroSettings.isPending ? (
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
            disabled={!hasChanges || updateHeroSettings.isPending}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
