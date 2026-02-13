import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Difficulty, type Tutorial } from '../types';
import type { MediaFile } from '../backend';
import { useAddTutorial, useListMedia, useUploadMediaFile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { ExternalBlob } from '../backend';

interface AddTutorialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddTutorialDialog({ open, onOpenChange }: AddTutorialDialogProps) {
  const { identity } = useInternetIdentity();
  const addTutorial = useAddTutorial();
  const uploadMediaFile = useUploadMediaFile();
  const { data: mediaFiles = [] } = useListMedia();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.beginner);
  const [selectedMediaId, setSelectedMediaId] = useState<string>('');
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);
  const [isFree, setIsFree] = useState(false);

  const videoFiles = mediaFiles.filter(m => m.contentType.startsWith('video/'));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error('Please log in to add tutorials');
      return;
    }

    if (!title.trim() || !description.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const principal = identity.getPrincipal();
      let videoMedia: MediaFile;

      if (videoFile) {
        const videoBytes = new Uint8Array(await videoFile.arrayBuffer());
        const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress((percentage) => {
          setUploadProgress(percentage);
        });

        videoMedia = {
          name: `tutorial-video-${Date.now()}-${videoFile.name}`,
          blob: videoBlob,
          contentType: videoFile.type,
          uploader: principal,
        };

        await uploadMediaFile.mutateAsync(videoMedia);
      } else if (selectedMediaId) {
        const selectedMedia = videoFiles.find(m => m.name === selectedMediaId);
        if (!selectedMedia) {
          toast.error('Selected video not found');
          return;
        }
        videoMedia = selectedMedia;
      } else {
        toast.error('Please select or upload a video');
        return;
      }

      const tutorial: Tutorial = {
        id: `tutorial-${Date.now()}`,
        title: title.trim(),
        description: description.trim(),
        difficulty,
        video: videoMedia,
        creator: principal,
        createdAt: BigInt(Date.now() * 1000000),
        isFree,
      };

      await addTutorial.mutateAsync(tutorial);
      toast.success('Tutorial added successfully');
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setDifficulty(Difficulty.beginner);
      setSelectedMediaId('');
      setVideoFile(null);
      setUploadProgress(undefined);
      setIsFree(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to add tutorial');
      console.error('Add tutorial error:', error);
    }
  };

  const handleVideoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error('Please select a video file');
        return;
      }
      setVideoFile(file);
      setSelectedMediaId('');
    }
  };

  const isUploading = uploadProgress !== undefined && uploadProgress < 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Tutorial</DialogTitle>
          <DialogDescription>Create a new learning tutorial</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter tutorial title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter tutorial description"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty</Label>
            <Select value={difficulty} onValueChange={(value) => setDifficulty(value as Difficulty)}>
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

          <div className="space-y-2">
            <Label>Video</Label>
            <div className="space-y-2">
              {videoFiles.length > 0 && (
                <Select value={selectedMediaId} onValueChange={setSelectedMediaId} disabled={!!videoFile}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select from library" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoFiles.map((video) => (
                      <SelectItem key={video.name} value={video.name}>
                        {video.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoFileChange}
                  className="hidden"
                  id="video-upload"
                  disabled={!!selectedMediaId}
                />
                <Label htmlFor="video-upload" className="cursor-pointer flex-1">
                  <Button type="button" variant="outline" className="w-full" asChild disabled={!!selectedMediaId}>
                    <span>
                      <Upload className="h-4 w-4 mr-2" />
                      {videoFile ? videoFile.name : 'Upload New Video'}
                    </span>
                  </Button>
                </Label>
                {videoFile && (
                  <Button type="button" variant="ghost" onClick={() => setVideoFile(null)}>
                    Clear
                  </Button>
                )}
              </div>
              {isUploading && (
                <div className="text-sm text-muted-foreground">
                  Uploading: {uploadProgress}%
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isFree"
              checked={isFree}
              onCheckedChange={(checked) => setIsFree(checked as boolean)}
            />
            <Label htmlFor="isFree" className="cursor-pointer">
              Mark as free (accessible to all users)
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addTutorial.isPending || isUploading}>
              {addTutorial.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Tutorial'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
