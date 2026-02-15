import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListPosts, useIsCallerAdmin, useGetPageSettings } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Play, Upload, Loader2, Users, Briefcase } from 'lucide-react';
import ShareRecordingDialog from '../components/ShareRecordingDialog';
import WorkWithUsDialog from '../components/WorkWithUsDialog';
import type { CommunityPost } from '../types';

export default function CommunityPage() {
  const { data: posts = [], isLoading } = useListPosts();
  const { data: isAdmin } = useIsCallerAdmin();
  const { identity } = useInternetIdentity();
  const { data: pageSettings } = useGetPageSettings();
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showWorkWithUsDialog, setShowWorkWithUsDialog] = useState(false);

  const isAuthenticated = !!identity;

  // Use page settings with fallbacks
  const title = pageSettings?.community?.title || 'Community';
  const subtitle = pageSettings?.community?.subtitle || 'Share your recordings and connect with others';
  const bannerImageUrl = pageSettings?.community?.bannerImage?.getDirectURL() || '/assets/generated/community-banner.dim_800x400.jpg';

  return (
    <div className="space-y-8">
      {/* Header with banner */}
      <div className="relative h-64 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
        <img 
          src={bannerImageUrl}
          alt="Community banner" 
          className="w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-4xl font-bold mb-2">{title}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {subtitle}
          </p>
        </div>
      </div>

      <div className="container">
        {/* Actions */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-muted-foreground" />
            <span className="text-muted-foreground">{posts.length} recordings shared</span>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setShowWorkWithUsDialog(true)} variant="outline" className="gap-2">
              <Briefcase className="h-4 w-4" />
              Work with us
            </Button>
            {isAuthenticated && (
              <Button onClick={() => setShowShareDialog(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Share Recording
              </Button>
            )}
          </div>
        </div>

        {/* Posts Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading community posts...</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <img 
              src="/assets/generated/empty-community.dim_400x300.jpg" 
              alt="No posts" 
              className="mx-auto h-48 w-auto opacity-50"
            />
            <p className="text-muted-foreground">No recordings shared yet</p>
            {isAuthenticated && (
              <Button onClick={() => setShowShareDialog(true)} className="gap-2">
                <Upload className="h-4 w-4" />
                Be the first to share!
              </Button>
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  {post.media.length > 0 && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-16 w-16 text-white opacity-80" />
                    </div>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{post.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{post.content}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary">{post.likes} likes</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(Number(post.createdAt) / 1000000).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ShareRecordingDialog open={showShareDialog} onOpenChange={setShowShareDialog} />
      <WorkWithUsDialog open={showWorkWithUsDialog} onOpenChange={setShowWorkWithUsDialog} />
    </div>
  );
}
