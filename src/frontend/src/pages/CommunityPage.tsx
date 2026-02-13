import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useListPosts, useGetPageSettings } from '../hooks/useQueries';
import { PageSettingsKey } from '../types';
import type { CommunityPost } from '../types';
import { Music, Plus, Loader2 } from 'lucide-react';
import ShareRecordingDialog from '../components/ShareRecordingDialog';
import ExternalBlobImage from '../components/ExternalBlobImage';

export default function CommunityPage() {
  const { data: posts = [], isLoading } = useListPosts();
  const { data: pageSettings } = useGetPageSettings(PageSettingsKey.community);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Use page settings or fallback to defaults
  const pageTitle = pageSettings?.title || 'Community';
  const pageSubtitle = pageSettings?.subtitle || 'Share your music and connect with others';
  const bannerImageUrl = pageSettings?.heroBanner.heroImage?.getDirectURL() || '/assets/generated/community-banner.dim_800x400.jpg';

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden">
        {pageSettings?.heroBanner.heroImage ? (
          <ExternalBlobImage
            blob={pageSettings.heroBanner.heroImage}
            alt={pageTitle}
            className="w-full h-[200px] object-cover"
          />
        ) : (
          <img
            src={bannerImageUrl}
            alt={pageTitle}
            className="w-full h-[200px] object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-transparent flex items-center">
          <div className="container">
            <h1 className="text-4xl font-bold">{pageTitle}</h1>
            <p className="text-lg text-muted-foreground mt-2">{pageSubtitle}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Shared Recordings</h2>
          <p className="text-muted-foreground">Discover music from the community</p>
        </div>
        <Button onClick={() => setShowShareDialog(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Share Recording
        </Button>
      </div>

      {/* Posts Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <Music className="h-24 w-24 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">No recordings shared yet</p>
          <Button onClick={() => setShowShareDialog(true)} className="mt-4 gap-2">
            <Plus className="h-4 w-4" />
            Be the first to share
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted flex items-center justify-center">
                {post.media.length > 0 && post.media[0].contentType.startsWith('video/') ? (
                  <video
                    src={post.media[0].blob.getDirectURL()}
                    className="w-full h-full object-cover"
                    controls
                  />
                ) : post.media.length > 0 && post.media[0].contentType.startsWith('audio/') ? (
                  <div className="w-full p-4">
                    <audio src={post.media[0].blob.getDirectURL()} controls className="w-full" />
                  </div>
                ) : (
                  <Music className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{post.title}</CardTitle>
                <CardDescription className="line-clamp-2">{post.content}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {Number(post.likes)} likes
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ShareRecordingDialog open={showShareDialog} onOpenChange={setShowShareDialog} />
    </div>
  );
}
