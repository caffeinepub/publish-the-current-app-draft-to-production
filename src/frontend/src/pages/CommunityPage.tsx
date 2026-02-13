import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useListPosts, useDeletePost, useIsCallerAdmin } from '../hooks/useQueries';
import ShareRecordingDialog from '../components/ShareRecordingDialog';
import { Plus, Music, Video, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import type { CommunityPost } from '../backend';
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

export default function CommunityPage() {
  const { identity } = useInternetIdentity();
  const { data: posts = [], isLoading } = useListPosts();
  const { data: isAdmin } = useIsCallerAdmin();
  const deletePost = useDeletePost();
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<CommunityPost | null>(null);

  const isAuthenticated = !!identity;

  const canDeletePost = (post: CommunityPost): boolean => {
    if (!identity) return false;
    return isAdmin || post.author.toString() === identity.getPrincipal().toString();
  };

  const handleDeleteClick = (post: CommunityPost) => {
    setPostToDelete(post);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!postToDelete) return;

    try {
      await deletePost.mutateAsync(postToDelete.id);
      toast.success('Post deleted successfully');
      setDeleteDialogOpen(false);
      setPostToDelete(null);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete post';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          src="/assets/generated/community-banner.dim_800x400.jpg"
          alt="Community"
          className="w-full h-[200px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-transparent flex items-center">
          <div className="container">
            <h1 className="text-4xl font-bold">Community</h1>
            <p className="text-lg text-muted-foreground mt-2">Share your music and connect with others</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Community Posts</h2>
          <p className="text-muted-foreground">Share your recordings and performances</p>
        </div>
        {isAuthenticated && (
          <Button className="gap-2" onClick={() => setShareDialogOpen(true)}>
            <Plus className="h-4 w-4" />
            Share Recording
          </Button>
        )}
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <img src="/assets/generated/empty-community.dim_400x300.jpg" alt="No posts" className="mx-auto h-48 opacity-50" />
          <p className="text-muted-foreground">No community posts yet</p>
          {isAuthenticated && (
            <Button variant="outline" className="gap-2" onClick={() => setShareDialogOpen(true)}>
              <Plus className="h-4 w-4" />
              Be the first to share
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => {
            const mediaItem = post.media[0];
            const isVideo = mediaItem?.contentType.startsWith('video/');
            const isAudio = mediaItem?.contentType.startsWith('audio/');
            const mediaUrl = mediaItem?.blob.getDirectURL();
            const createdDate = new Date(Number(post.createdAt) / 1000000);

            return (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-lg line-clamp-2 flex-1">{post.title}</CardTitle>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isVideo && <Video className="h-5 w-5 text-primary" />}
                      {isAudio && <Music className="h-5 w-5 text-primary" />}
                      {canDeletePost(post) && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteClick(post)}
                          disabled={deletePost.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <CardDescription className="text-xs">
                    {format(createdDate, 'MMM d, yyyy')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Media Preview */}
                  {mediaUrl && (
                    <div className="rounded-lg overflow-hidden bg-muted">
                      {isVideo ? (
                        <video
                          src={mediaUrl}
                          controls
                          className="w-full aspect-video object-cover"
                          preload="metadata"
                        />
                      ) : isAudio ? (
                        <div className="p-4 flex items-center justify-center min-h-[120px]">
                          <audio src={mediaUrl} controls className="w-full" preload="metadata" />
                        </div>
                      ) : null}
                    </div>
                  )}
                  {/* Description */}
                  <p className="text-sm text-muted-foreground line-clamp-3">{post.content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Share Recording Dialog */}
      <ShareRecordingDialog open={shareDialogOpen} onOpenChange={setShareDialogOpen} />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <img src="/assets/generated/warning-confirmation-icon-transparent.dim_32x32.png" alt="Warning" className="h-6 w-6" />
              Delete Post?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{postToDelete?.title}"? This action cannot be undone.
              All associated media files will also be removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletePost.isPending}
            >
              {deletePost.isPending ? (
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
