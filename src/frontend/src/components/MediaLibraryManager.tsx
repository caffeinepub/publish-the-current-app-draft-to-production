import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUploadMediaFile, useListMedia, useDeleteMedia, useIsCallerAdmin } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { ExternalBlob, type MediaFile } from '../backend';
import { Upload, Video, Loader2, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function MediaLibraryManager() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState<MediaFile | null>(null);

  const uploadMedia = useUploadMediaFile();
  const deleteMedia = useDeleteMedia();
  const { data: mediaFiles = [], isLoading, refetch } = useListMedia();
  const { data: isAdmin } = useIsCallerAdmin();
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

  const handleUpload = async () => {
    if (!videoFile || !identity) {
      toast.error('Please select a video file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    try {
      const videoBytes = new Uint8Array(await videoFile.arrayBuffer());
      const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress((percentage) => {
        setUploadProgress(percentage);
      });

      const mediaFile: MediaFile = {
        name: `video-${Date.now()}-${videoFile.name}`,
        blob: videoBlob,
        contentType: videoFile.type,
        uploader: identity.getPrincipal(),
      };

      await uploadMedia.mutateAsync(mediaFile);
      toast.success('Video uploaded successfully!');
      setVideoFile(null);
      setUploadProgress(0);
      refetch();
    } catch (error) {
      toast.error('Failed to upload video');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteClick = (media: MediaFile) => {
    setMediaToDelete(media);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!mediaToDelete) return;

    try {
      await deleteMedia.mutateAsync(mediaToDelete.name);
      toast.success('Media file deleted successfully');
      setDeleteDialogOpen(false);
      setMediaToDelete(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete media file';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  const canDeleteMedia = (media: MediaFile): boolean => {
    if (!identity) return false;
    return isAdmin || media.uploader.toString() === identity.getPrincipal().toString();
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-upload">Upload Video</Label>
          <div className="flex items-center gap-2">
            <Input
              id="video-upload"
              type="file"
              accept="video/*"
              onChange={handleFileChange}
              className="flex-1"
              disabled={uploading}
            />
            <Button onClick={handleUpload} disabled={!videoFile || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
          {videoFile && <p className="text-sm text-muted-foreground">{videoFile.name}</p>}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-4">Uploaded Media Files</h3>
        {isLoading ? (
          <div className="text-center py-8">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
          </div>
        ) : mediaFiles.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No media files uploaded yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mediaFiles.map((media) => (
              <Card key={media.name}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Video className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{media.name}</p>
                      <p className="text-xs text-muted-foreground">{media.contentType}</p>
                    </div>
                    {canDeleteMedia(media) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteClick(media)}
                        disabled={deleteMedia.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <img src="/assets/generated/warning-confirmation-icon-transparent.dim_32x32.png" alt="Warning" className="h-6 w-6" />
              Delete Media File?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{mediaToDelete?.name}"? This action cannot be undone. 
              If this media is used in tutorials or posts, those references will be cleaned up automatically.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteMedia.isPending}
            >
              {deleteMedia.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
