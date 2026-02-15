import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useListTutorials, useCompleteTutorial, useGetPageSettings } from '../hooks/useQueries';
import { Difficulty, Tutorial } from '../types';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { Play, Loader2, Filter } from 'lucide-react';
import ExternalBlobImage from '../components/ExternalBlobImage';

export default function LearningPage() {
  const { data: tutorials = [], isLoading } = useListTutorials();
  const { data: pageSettings } = useGetPageSettings();
  const { identity } = useInternetIdentity();
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'all'>('all');

  const isAuthenticated = !!identity;

  // Use page settings with fallbacks
  const pageTitle = pageSettings?.learning?.title || 'Learning Center';
  const pageSubtitle = pageSettings?.learning?.subtitle || 'Master the ocarina with AI-powered guidance';
  const bannerImageUrl = pageSettings?.learning?.bannerImage?.getDirectURL() || '/assets/generated/learning-section-banner.dim_800x400.jpg';

  const filteredTutorials = selectedDifficulty === 'all' 
    ? tutorials 
    : tutorials.filter(t => t.difficulty === selectedDifficulty);

  return (
    <div className="space-y-8">
      {/* Header with banner */}
      <div className="relative h-64 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg overflow-hidden">
        {pageSettings?.learning?.bannerImage ? (
          <ExternalBlobImage
            blob={pageSettings.learning.bannerImage}
            alt="Learning banner"
            className="w-full h-full object-cover opacity-50"
          />
        ) : (
          <img 
            src={bannerImageUrl}
            alt="Learning banner" 
            className="w-full h-full object-cover opacity-50"
          />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
          <h1 className="text-4xl font-bold mb-2">{pageTitle}</h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            {pageSubtitle}
          </p>
        </div>
      </div>

      <div className="container">
        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <Filter className="h-5 w-5 text-muted-foreground" />
          <div className="flex gap-2">
            <Button
              variant={selectedDifficulty === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty('all')}
            >
              All
            </Button>
            <Button
              variant={selectedDifficulty === Difficulty.beginner ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(Difficulty.beginner)}
            >
              Beginner
            </Button>
            <Button
              variant={selectedDifficulty === Difficulty.intermediate ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(Difficulty.intermediate)}
            >
              Intermediate
            </Button>
            <Button
              variant={selectedDifficulty === Difficulty.advanced ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedDifficulty(Difficulty.advanced)}
            >
              Advanced
            </Button>
          </div>
        </div>

        {/* Tutorials Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Loading tutorials...</p>
          </div>
        ) : filteredTutorials.length === 0 ? (
          <div className="text-center py-12 space-y-4">
            <img 
              src="/assets/generated/empty-tutorials.dim_400x300.jpg" 
              alt="No tutorials" 
              className="mx-auto h-48 w-auto opacity-50"
            />
            <p className="text-muted-foreground">No tutorials available for this difficulty level</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTutorials.map((tutorial) => (
              <Card key={tutorial.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted flex items-center justify-center relative">
                  <Play className="h-16 w-16 text-muted-foreground" />
                  {tutorial.isFree && (
                    <Badge className="absolute top-2 right-2 bg-green-500">FREE</Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{tutorial.title}</CardTitle>
                  <CardDescription className="line-clamp-2">{tutorial.description}</CardDescription>
                  <div className="flex items-center justify-between pt-2">
                    <Badge variant="outline">{tutorial.difficulty}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(Number(tutorial.createdAt) / 1000000).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <Button className="w-full gap-2">
                    <Play className="h-4 w-4" />
                    Start Tutorial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
