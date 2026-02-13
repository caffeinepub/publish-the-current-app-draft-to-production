import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useListTutorials, useCompleteTutorial } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Play, Plus, CheckCircle2, Award, X, AlertCircle, Bot, Gift } from 'lucide-react';
import { Difficulty, Tutorial } from '../backend';
import AddTutorialDialog from '../components/AddTutorialDialog';
import AIAssistantPanel from '../components/AIAssistantPanel';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LearningPage() {
  const { data: tutorials = [], isLoading } = useListTutorials();
  const { identity } = useInternetIdentity();
  const completeTutorial = useCompleteTutorial();
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | Difficulty>('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [showRewardDialog, setShowRewardDialog] = useState(false);
  const [earnedTokens, setEarnedTokens] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [videoTimestamp, setVideoTimestamp] = useState(0);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const isAuthenticated = !!identity;

  const filteredTutorials = selectedDifficulty === 'all' 
    ? tutorials 
    : tutorials.filter(t => t.difficulty === selectedDifficulty);

  // Sort tutorials: free first, then by difficulty
  const sortedTutorials = [...filteredTutorials].sort((a, b) => {
    if (a.isFree && !b.isFree) return -1;
    if (!a.isFree && b.isFree) return 1;
    return 0;
  });

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.beginner: return 'bg-green-500/10 text-green-700 dark:text-green-400';
      case Difficulty.intermediate: return 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400';
      case Difficulty.advanced: return 'bg-red-500/10 text-red-700 dark:text-red-400';
    }
  };

  const getRewardAmount = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.beginner: return 10;
      case Difficulty.intermediate: return 25;
      case Difficulty.advanced: return 50;
    }
  };

  const handleWatchTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setVideoError(false);
    setVideoTimestamp(0);
    setIsVideoPlaying(false);
  };

  const handleCloseVideo = () => {
    setSelectedTutorial(null);
    setVideoError(false);
    setVideoTimestamp(0);
    setIsVideoPlaying(false);
  };

  const handleVideoError = () => {
    setVideoError(true);
    toast.error('Failed to load video. Please try again.');
  };

  const handleCompleteTutorial = async (tutorialId: string, difficulty: Difficulty) => {
    if (!isAuthenticated) {
      toast.error('Please login to complete tutorials');
      return;
    }

    try {
      await completeTutorial.mutateAsync(tutorialId);
      const reward = getRewardAmount(difficulty);
      setEarnedTokens(reward);
      setShowRewardDialog(true);
      toast.success('Tutorial completed!');
    } catch (error: any) {
      if (error.message?.includes('already completed')) {
        toast.info('You have already completed this tutorial');
      } else {
        toast.error('Failed to complete tutorial');
        console.error(error);
      }
    }
  };

  const getVideoUrl = (tutorial: Tutorial): string => {
    try {
      return tutorial.video.blob.getDirectURL();
    } catch (error) {
      console.error('Error getting video URL:', error);
      return '';
    }
  };

  // Update video timestamp
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setVideoTimestamp(video.currentTime);
    };

    const handlePlay = () => {
      setIsVideoPlaying(true);
    };

    const handlePause = () => {
      setIsVideoPlaying(false);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [selectedTutorial]);

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden">
        <img
          src="/assets/generated/learning-section-banner.dim_800x400.jpg"
          alt="Learning"
          className="w-full h-[200px] object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/95 to-transparent flex items-center">
          <div className="container">
            <h1 className="text-4xl font-bold">Learning Center</h1>
            <p className="text-lg text-muted-foreground mt-2">Master the ocarina with AI-powered guidance</p>
          </div>
        </div>
      </div>

      {/* Reward Info Banner */}
      <Card className="bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <img 
              src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" 
              alt="Rewards" 
              className="h-16 w-16"
            />
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Earn Tokens by Learning!</h3>
              <p className="text-sm text-muted-foreground">
                Complete tutorials to earn tokens: Beginner (10 tokens) • Intermediate (25 tokens) • Advanced (50 tokens)
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
              <Bot className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium">AI Assistant Available</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between items-center">
        <Tabs value={selectedDifficulty} onValueChange={(v) => setSelectedDifficulty(v as any)} className="w-auto">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value={Difficulty.beginner}>
              Beginner
              <Badge variant="outline" className="ml-2 text-xs">+10</Badge>
            </TabsTrigger>
            <TabsTrigger value={Difficulty.intermediate}>
              Intermediate
              <Badge variant="outline" className="ml-2 text-xs">+25</Badge>
            </TabsTrigger>
            <TabsTrigger value={Difficulty.advanced}>
              Advanced
              <Badge variant="outline" className="ml-2 text-xs">+50</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {isAuthenticated && (
          <Button onClick={() => setShowAddDialog(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Tutorial
          </Button>
        )}
      </div>

      {/* Tutorials Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading tutorials...</p>
        </div>
      ) : sortedTutorials.length === 0 ? (
        <div className="text-center py-12 space-y-4">
          <img src="/assets/generated/empty-tutorials.dim_400x300.jpg" alt="No tutorials" className="mx-auto h-48 opacity-50" />
          <p className="text-muted-foreground">No tutorials available yet</p>
          {isAuthenticated && (
            <Button onClick={() => setShowAddDialog(true)} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Be the first to add a tutorial
            </Button>
          )}
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedTutorials.map((tutorial) => (
            <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="relative aspect-video bg-muted">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="h-12 w-12 text-primary" />
                </div>
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-16 w-16 text-white drop-shadow-lg" />
                </div>
                <Badge className={`absolute top-2 right-2 ${getDifficultyColor(tutorial.difficulty)}`}>
                  {tutorial.difficulty}
                </Badge>
                {tutorial.isFree ? (
                  <Badge className="absolute top-2 left-2 bg-green-600 text-white gap-1">
                    <Gift className="h-3 w-3" />
                    FREE
                  </Badge>
                ) : (
                  <Badge className="absolute top-2 left-2 bg-primary/90 text-primary-foreground gap-1">
                    <img src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" alt="Reward" className="h-3 w-3" />
                    +{getRewardAmount(tutorial.difficulty)}
                  </Badge>
                )}
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{tutorial.title}</CardTitle>
                <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full gap-2"
                  onClick={() => handleWatchTutorial(tutorial)}
                >
                  <Play className="h-4 w-4" />
                  Watch Tutorial
                </Button>
                {isAuthenticated && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={() => handleCompleteTutorial(tutorial.id, tutorial.difficulty)}
                    disabled={completeTutorial.isPending}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {completeTutorial.isPending ? 'Completing...' : 'Mark as Complete'}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Player Dialog with AI Assistant */}
      <Dialog open={!!selectedTutorial} onOpenChange={(open) => !open && handleCloseVideo()}>
        <DialogContent className="max-w-7xl p-0 h-[90vh]">
          {selectedTutorial && (
            <div className="flex flex-col h-full">
              <DialogHeader className="p-6 pb-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <DialogTitle className="text-2xl">{selectedTutorial.title}</DialogTitle>
                    <DialogDescription className="mt-2">
                      {selectedTutorial.description}
                    </DialogDescription>
                    <div className="flex items-center gap-2 mt-3">
                      <Badge className={getDifficultyColor(selectedTutorial.difficulty)}>
                        {selectedTutorial.difficulty}
                      </Badge>
                      {selectedTutorial.isFree ? (
                        <Badge className="bg-green-600 text-white gap-1">
                          <Gift className="h-3 w-3" />
                          FREE
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1">
                          <img 
                            src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" 
                            alt="Reward" 
                            className="h-3 w-3" 
                          />
                          +{getRewardAmount(selectedTutorial.difficulty)} tokens
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DialogHeader>
              
              <div className="flex-1 flex gap-4 p-6 overflow-hidden">
                {/* Video Section */}
                <div className="flex-1 flex flex-col min-w-0">
                  {videoError ? (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Failed to load video. The video file may be corrupted or unavailable.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="relative aspect-video bg-black rounded-lg overflow-hidden">
                      <video
                        ref={videoRef}
                        key={selectedTutorial.id}
                        controls
                        className="w-full h-full"
                        onError={handleVideoError}
                        controlsList="nodownload"
                      >
                        <source 
                          src={getVideoUrl(selectedTutorial)} 
                          type={selectedTutorial.video.contentType || 'video/mp4'} 
                        />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                  
                  {isAuthenticated && !videoError && (
                    <div className="mt-4 flex gap-2">
                      <Button 
                        className="flex-1 gap-2"
                        onClick={() => {
                          handleCompleteTutorial(selectedTutorial.id, selectedTutorial.difficulty);
                          handleCloseVideo();
                        }}
                        disabled={completeTutorial.isPending}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        {completeTutorial.isPending ? 'Completing...' : 'Mark as Complete'}
                      </Button>
                    </div>
                  )}
                </div>

                {/* AI Assistant Panel */}
                <div className="w-80 flex-shrink-0">
                  <AIAssistantPanel
                    tutorialId={selectedTutorial.id}
                    tutorialTitle={selectedTutorial.title}
                    videoTimestamp={videoTimestamp}
                    isPlaying={isVideoPlaying}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Reward Dialog */}
      <Dialog open={showRewardDialog} onOpenChange={setShowRewardDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <img 
                src="/assets/generated/completion-celebration-transparent.dim_200x200.png" 
                alt="Celebration" 
                className="h-32 w-32"
              />
            </div>
            <DialogTitle className="text-center text-2xl">Congratulations!</DialogTitle>
            <DialogDescription className="text-center">
              You've completed the tutorial and earned tokens!
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <div className="flex items-center gap-3 text-4xl font-bold text-primary">
              <img src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" alt="Tokens" className="h-12 w-12" />
              +{earnedTokens}
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Tokens have been added to your wallet
            </p>
            <div className="flex gap-2 w-full">
              <Button onClick={() => setShowRewardDialog(false)} variant="outline" className="flex-1">
                Continue Learning
              </Button>
              <Button onClick={() => { setShowRewardDialog(false); window.location.href = '/wallet'; }} className="flex-1">
                View Wallet
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {showAddDialog && <AddTutorialDialog open={showAddDialog} onOpenChange={setShowAddDialog} />}
    </div>
  );
}
