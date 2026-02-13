import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAddPost, useUploadMediaFile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { type CommunityPost, type MediaFile } from '../backend';
import { ExternalBlob } from '../backend';
import { Upload, Coins } from 'lucide-react';

interface ShareRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareRecordingDialog({ open, onOpenChange }: ShareRecordingDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const addPost = useAddPost();
  const uploadMedia = useUploadMediaFile();
  const { identity } = useInternetIdentity();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/') || file.type.startsWith('audio/')) {
        setMediaFile(file);
      } else {
        toast.error('Please select a video or audio file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !mediaFile || !identity) {
      toast.error('Please fill all fields and select a file');
      return;
    }

    setUploading(true);
    try {
      const mediaBytes = new Uint8Array(await mediaFile.arrayBuffer());
      const mediaBlob = ExternalBlob.fromBytes(mediaBytes);

      const media: MediaFile = {
        name: `recording-${Date.now()}-${mediaFile.name}`,
        blob: mediaBlob,
        contentType: mediaFile.type,
        uploader: identity.getPrincipal(),
      };

      await uploadMedia.mutateAsync(media);

      const post: CommunityPost = {
        id: `post-${Date.now()}`,
        title: title.trim(),
        content: description.trim(),
        media: [media],
        author: identity.getPrincipal(),
        createdAt: BigInt(Date.now() * 1000000),
        likes: BigInt(0),
      };

      await addPost.mutateAsync(post);
      
      toast.success(
        <div className="flex items-center gap-2">
          <Coins className="h-5 w-5 text-yellow-500" />
          <div>
            <div className="font-semibold">Recording shared successfully!</div>
            <div className="text-sm text-muted-foreground">You've earned 10 tokens for sharing your recording!</div>
          </div>
        </div>,
        { duration: 5000 }
      );
      
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setMediaFile(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to share recording';
      toast.error(errorMessage);
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Share Recording</DialogTitle>
          <DialogDescription>Share your music with the community and earn 10 tokens!</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Recording title"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell us about your recording..."
              rows={3}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="media">Recording File (Video or Audio) *</Label>
            <div className="flex items-center gap-2">
              <Input
                id="media"
                type="file"
                accept="video/*,audio/*"
                onChange={handleFileChange}
                className="flex-1"
                required
              />
              <Upload className="h-5 w-5 text-muted-foreground" />
            </div>
            {mediaFile && <p className="text-sm text-muted-foreground">{mediaFile.name}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={uploading}>
            {uploading ? 'Uploading...' : 'Share Recording'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
