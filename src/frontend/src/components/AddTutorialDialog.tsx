import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAddTutorial, useUploadMediaFile, useListMedia } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Difficulty, type Tutorial, type MediaFile } from '../backend';
import { ExternalBlob } from '../backend';
import { Upload, Video, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface AddTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddTutorialDialog({ open, onOpenChange }: AddTutorialDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.beginner);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [selectedMediaFile, setSelectedMediaFile] = useState<MediaFile | null>(null);
  const [uploadMode, setUploadMode] = useState<'existing' | 'new'>('existing');
  const [isFree, setIsFree] = useState(false);
  const [uploading, setUploading] = useState(false);

  const addTutorial = useAddTutorial();
  const uploadMedia = useUploadMediaFile();
  const { data: mediaFiles = [] } = useListMedia();
  const { identity } = useInternetIdentity();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/')) {
        setVideoFile(file);
      } else {
        toast.error('Please select a video file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !identity) {
      toast.error('Please fill all fields');
      return;
    }

    if (uploadMode === 'new' && !videoFile) {
      toast.error('Please select a video file');
      return;
    }

    if (uploadMode === 'existing' && !selectedMediaFile) {
      toast.error('Please select a media file from the library');
      return;
    }

    setUploading(true);
    try {
      let mediaFile: MediaFile;

      if (uploadMode === 'new' && videoFile) {
        const videoBytes = new Uint8Array(await videoFile.arrayBuffer());
        const videoBlob = ExternalBlob.fromBytes(videoBytes);

        mediaFile = {
          name: `tutorial-${Date.now()}-${videoFile.name}`,
          blob: videoBlob,
          contentType: videoFile.type,
          uploader: identity.getPrincipal(),
        };

        await uploadMedia.mutateAsync(mediaFile);
      } else if (selectedMediaFile) {
        mediaFile = selectedMediaFile;
      } else {
        throw new Error('No media file selected');
      }

      const tutorial: Tutorial = {
        id: `tutorial-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        difficulty: difficulty,
        video: mediaFile,
        creator: identity.getPrincipal(),
        createdAt: BigInt(Date.now() * 1000000),
        isFree: isFree,
      };

      await addTutorial.mutateAsync(tutorial);
      toast.success('Tutorial created successfully!');
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setDifficulty(Difficulty.beginner);
      setVideoFile(null);
      setSelectedMediaFile(null);
      setUploadMode('existing');
      setIsFree(false);
    } catch (error) {
      toast.error('Failed to create tutorial');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Tutorial</DialogTitle>
          <DialogDescription>Create a new learning tutorial for the community</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Tutorial title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what students will learn..."
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty *</Label>
            <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Difficulty)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={Difficulty.beginner}>Beginner</SelectItem>
                <SelectItem value={Difficulty.intermediate}>Intermediate</SelectItem>
                <SelectItem value={Difficulty.advanced}>Advanced</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFree"
              checked={isFree}
              onCheckedChange={(checked) => setIsFree(checked === true)}
            />
            <Label htmlFor="isFree" className="font-normal cursor-pointer">
              Make this tutorial free (accessible to all users without login)
            </Label>
          </div>

          <div className="space-y-3">
            <Label>Video Source *</Label>
            <RadioGroup value={uploadMode} onValueChange={(v) => setUploadMode(v as 'existing' | 'new')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing" />
                <Label htmlFor="existing" className="font-normal cursor-pointer">
                  Select from Media Library
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="new" id="new" />
                <Label htmlFor="new" className="font-normal cursor-pointer">
                  Upload New Video
                </Label>
              </div>
            </RadioGroup>
          </div>

          {uploadMode === 'existing' ? (
            <div className="space-y-2">
              <Label>Select Video from Library</Label>
              {mediaFiles.length === 0 ? (
                <Card>
                  <CardContent className="py-6 text-center text-muted-foreground">
                    <Video className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No media files available. Upload videos in the Media Library tab first.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                  {mediaFiles.map((media) => (
                    <Card
                      key={media.name}
                      className={`cursor-pointer transition-colors ${
                        selectedMediaFile?.name === media.name ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedMediaFile(media)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          <Video className="h-5 w-5 text-primary flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{media.name}</p>
                            <p className="text-xs text-muted-foreground">{media.contentType}</p>
                          </div>
                          {selectedMediaFile?.name === media.name && (
                            <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="video">Upload Video File *</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleFileChange}
                  className="flex-1"
                  required={uploadMode === 'new'}
                />
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
              {videoFile && <p className="text-sm text-muted-foreground">{videoFile.name}</p>}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Tutorial...
              </>
            ) : (
              'Create Tutorial'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
