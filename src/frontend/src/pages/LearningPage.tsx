import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useListTutorials, useCompleteTutorial, useGetPageSettings } from '../hooks/useQueries';
import { Difficulty, Tutorial, PageSettingsKey } from '../types';
import { Play, Award, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import AIAssistantPanel from '../components/AIAssistantPanel';
import ExternalBlobImage from '../components/ExternalBlobImage';

export default function LearningPage() {
  const { data: tutorials = [], isLoading } = useListTutorials();
  const { data: pageSettings } = useGetPageSettings(PageSettingsKey.learning);
  const completeTutorial = useCompleteTutorial();
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [videoDialogOpen, setVideoDialogOpen] = useState(false);
  const [celebrationOpen, setCelebrationOpen] = useState(false);
  const [earnedTokens, setEarnedTokens] = useState<number>(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');
  const [videoTimestamp, setVideoTimestamp] = useState<number>(0);

  // Use page settings or fallback to defaults
  const pageTitle = pageSettings?.title || 'Learning Center';
  const pageSubtitle = pageSettings?.subtitle || 'Master the ocarina with AI-powered guidance';
  const bannerImageUrl = pageSettings?.heroBanner.heroImage?.getDirectURL() || '/assets/generated/learning-section-banner.dim_800x400.jpg';

  const handlePlayTutorial = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setVideoDialogOpen(true);
    setVideoTimestamp(0);
  };

  const handleCompleteTutorial = async () => {
    if (!selectedTutorial) return;

    try {
      const reward = await completeTutorial.mutateAsync(selectedTutorial.id);
      setEarnedTokens(Number(reward) || 0);
      setCelebrationOpen(true);
      setVideoDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to complete tutorial');
    }
  };

  const filteredTutorials = selectedDifficulty === 'all'
    ? tutorials
    : tutorials.filter(t => t.difficulty === selectedDifficulty);

  const getDifficultyColor = (difficulty: Difficulty) => {
    switch (difficulty) {
      case Difficulty.beginner:
        return 'bg-green-500';
      case Difficulty.intermediate:
        return 'bg-yellow-500';
      case Difficulty.advanced:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

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

      {/* Difficulty Filter */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
          onClick={() => setSelectedDifficulty('all')}
        >
          All Levels
        </Button>
        <Button
          variant={selectedDifficulty === Difficulty.beginner ? 'default' : 'outline'}
          onClick={() => setSelectedDifficulty(Difficulty.beginner)}
        >
          Beginner
        </Button>
        <Button
          variant={selectedDifficulty === Difficulty.intermediate ? 'default' : 'outline'}
          onClick={() => setSelectedDifficulty(Difficulty.intermediate)}
        >
          Intermediate
        </Button>
        <Button
          variant={selectedDifficulty === Difficulty.advanced ? 'default' : 'outline'}
          onClick={() => setSelectedDifficulty(Difficulty.advanced)}
        >
          Advanced
        </Button>
      </div>

      {/* Tutorials Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Loading tutorials...</p>
        </div>
      ) : filteredTutorials.length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-24 w-24 mx-auto text-muted-foreground opacity-50 mb-4" />
          <p className="text-muted-foreground">No tutorials available yet</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTutorials.map((tutorial) => (
            <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                <video
                  src={tutorial.video.blob.getDirectURL()}
                  className="w-full h-full object-cover"
                  preload="metadata"
                />
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Button
                    size="lg"
                    className="rounded-full h-16 w-16"
                    onClick={() => handlePlayTutorial(tutorial)}
                  >
                    <Play className="h-8 w-8" />
                  </Button>
                </div>
                {tutorial.isFree && (
                  <Badge className="absolute top-2 left-2 bg-green-600">FREE</Badge>
                )}
                <Badge className={`absolute top-2 right-2 ${getDifficultyColor(tutorial.difficulty)}`}>
                  {tutorial.difficulty}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle className="line-clamp-1">{tutorial.title}</CardTitle>
                <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full gap-2" onClick={() => handlePlayTutorial(tutorial)}>
                  <Play className="h-4 w-4" />
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Video Player Dialog */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{selectedTutorial?.title}</DialogTitle>
            <DialogDescription>{selectedTutorial?.description}</DialogDescription>
          </DialogHeader>
          <div className="grid lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              {selectedTutorial && (
                <video
                  src={selectedTutorial.video.blob.getDirectURL()}
                  controls
                  className="w-full rounded-lg"
                  autoPlay
                  onTimeUpdate={(e) => {
                    const video = e.target as HTMLVideoElement;
                    setVideoTimestamp(Math.floor(video.currentTime));
                  }}
                  onError={(e) => {
                    console.error('Video playback error:', e);
                    toast.error('Failed to load video. Please try again.');
                  }}
                />
              )}
              <div className="mt-4">
                <Button
                  onClick={handleCompleteTutorial}
                  disabled={completeTutorial.isPending}
                  className="w-full gap-2"
                >
                  {completeTutorial.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <Award className="h-4 w-4" />
                      Mark as Complete
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="lg:col-span-1">
              {selectedTutorial && (
                <AIAssistantPanel 
                  tutorialId={selectedTutorial.id} 
                  videoTimestamp={videoTimestamp}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Celebration Dialog */}
      <Dialog open={celebrationOpen} onOpenChange={setCelebrationOpen}>
        <DialogContent className="text-center">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <img
                src="/assets/generated/completion-celebration-transparent.dim_200x200.png"
                alt="Celebration"
                className="h-32 w-32"
              />
            </div>
            <DialogTitle className="text-2xl">Congratulations!</DialogTitle>
            <DialogDescription className="text-lg">
              You've completed the tutorial and earned <strong>{earnedTokens} tokens</strong>!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center gap-4 mt-4">
            <Button onClick={() => setCelebrationOpen(false)}>Continue Learning</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
