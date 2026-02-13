import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type CommunityPost } from '../types';
import type { MediaFile } from '../backend';
import { useAddPost, useUploadMediaFile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';
import { ExternalBlob } from '../backend';

interface ShareRecordingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ShareRecordingDialog({ open, onOpenChange }: ShareRecordingDialogProps) {
  const { identity } = useInternetIdentity();
  const addPost = useAddPost();
  const uploadMediaFile = useUploadMediaFile();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error('Please log in to share recordings');
      return;
    }

    if (!title.trim() || !content.trim() || !mediaFile) {
      toast.error('Please fill in all fields and select a file');
      return;
    }

    try {
      const principal = identity.getPrincipal();
      const mediaBytes = new Uint8Array(await mediaFile.arrayBuffer());
      const mediaBlob = ExternalBlob.fromBytes(mediaBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const media: MediaFile = {
        name: `recording-${Date.now()}-${mediaFile.name}`,
        blob: mediaBlob,
        contentType: mediaFile.type,
        uploader: principal,
      };

      await uploadMediaFile.mutateAsync(media);

      const post: CommunityPost = {
        id: `post-${Date.now()}`,
        title: title.trim(),
        content: content.trim(),
        media: [media],
        author: principal,
        createdAt: BigInt(Date.now() * 1000000),
        likes: BigInt(0),
      };

      await addPost.mutateAsync(post);
      toast.success('Recording shared successfully! You earned 10 tokens.');
      onOpenChange(false);
      setTitle('');
      setContent('');
      setMediaFile(null);
      setUploadProgress(undefined);
    } catch (error: any) {
      toast.error(error.message || 'Failed to share recording');
      console.error('Share recording error:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/') && !file.type.startsWith('audio/')) {
        toast.error('Please select a video or audio file');
        return;
      }
      setMediaFile(file);
    }
  };

  const isUploading = uploadProgress !== undefined && uploadProgress < 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Share Recording</DialogTitle>
          <DialogDescription>Share your music with the community and earn 10 tokens</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter recording title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Description</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your recording"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="media">Recording File</Label>
            <Input
              type="file"
              accept="video/*,audio/*"
              onChange={handleFileChange}
              className="hidden"
              id="media-upload"
            />
            <Label htmlFor="media-upload" className="cursor-pointer">
              <Button type="button" variant="outline" className="w-full" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  {mediaFile ? mediaFile.name : 'Select File'}
                </span>
              </Button>
            </Label>
            {isUploading && (
              <div className="text-sm text-muted-foreground">
                Uploading: {uploadProgress}%
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={addPost.isPending || isUploading}>
              {addPost.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sharing...
                </>
              ) : (
                'Share Recording'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
