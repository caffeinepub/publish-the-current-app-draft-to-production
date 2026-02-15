import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X } from 'lucide-react';
import { useGetHeroSettings, useUpdateHeroSettings, useUploadMediaFile } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { ExternalBlob } from '../../backend';
import type { MediaFile } from '../../backend';
import type { HeroSettings } from '../../types';

export default function HeroSettingsSection() {
  const { data: heroSettings, isLoading } = useGetHeroSettings();
  const updateHeroSettings = useUpdateHeroSettings();
  const uploadMedia = useUploadMediaFile();
  const { identity } = useInternetIdentity();

  const [headline, setHeadline] = useState('');
  const [subheadline, setSubheadline] = useState('');
  const [heroImagePreview, setHeroImagePreview] = useState<string | null>(null);
  const [savedHeroImageBlob, setSavedHeroImageBlob] = useState<ExternalBlob | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (heroSettings) {
      setHeadline(heroSettings.headline);
      setSubheadline(heroSettings.subheadline);
      if (heroSettings.heroImage) {
        setHeroImagePreview(heroSettings.heroImage.getDirectURL());
        setSavedHeroImageBlob(heroSettings.heroImage);
      }
    }
  }, [heroSettings]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !identity) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const preview = URL.createObjectURL(file);
      setHeroImagePreview(preview);

      const media: MediaFile = {
        name: `hero-${Date.now()}-${file.name}`,
        blob,
        contentType: file.type,
        uploader: identity.getPrincipal(),
      };

      await uploadMedia.mutateAsync(media);
      setSavedHeroImageBlob(blob);
      setHasChanges(true);
      toast.success('Hero image uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload hero image');
      setHeroImagePreview(savedHeroImageBlob?.getDirectURL() || null);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleSave = async () => {
    if (!heroSettings) return;

    try {
      const newSettings: HeroSettings = {
        headline: headline,
        subheadline: subheadline,
        heroImage: savedHeroImageBlob || undefined,
      };

      await updateHeroSettings.mutateAsync(newSettings);
      toast.success('Hero settings saved successfully');
      setHasChanges(false);
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to save hero settings');
    }
  };

  const handleCancel = () => {
    if (heroSettings) {
      setHeadline(heroSettings.headline);
      setSubheadline(heroSettings.subheadline);
      setHeroImagePreview(heroSettings.heroImage ? heroSettings.heroImage.getDirectURL() : null);
      setSavedHeroImageBlob(heroSettings.heroImage || null);
      setHasChanges(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
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
            placeholder="Master the Ocarina"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subheadline">Subheadline</Label>
          <Input
            id="subheadline"
            value={subheadline}
            onChange={(e) => {
              setSubheadline(e.target.value);
              setHasChanges(true);
            }}
            placeholder="Learn, create, and share beautiful music"
          />
        </div>

        <div className="space-y-2">
          <Label>Hero Image</Label>
          {heroImagePreview && (
            <div className="relative w-full h-48 rounded-lg overflow-hidden border">
              <img
                src={heroImagePreview}
                alt="Hero preview"
                className="w-full h-full object-cover"
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => {
                  setHeroImagePreview(null);
                  setSavedHeroImageBlob(null);
                  setHasChanges(true);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isUploading}
              className="flex-1"
            />
            {isUploading && (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">{uploadProgress}%</span>
              </div>
            )}
          </div>
        </div>

        {hasChanges && (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={updateHeroSettings.isPending}>
              {updateHeroSettings.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
