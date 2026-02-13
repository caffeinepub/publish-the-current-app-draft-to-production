import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles } from 'lucide-react';
import { useProvideAIResponse } from '../hooks/useQueries';
import type { AIRequest } from '../types';

interface AIAssistantPanelProps {
  tutorialId: string;
  videoTimestamp: number;
}

export default function AIAssistantPanel({ tutorialId, videoTimestamp }: AIAssistantPanelProps) {
  const [isEnabled, setIsEnabled] = useState(true);
  const [feedback, setFeedback] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const provideAIResponse = useProvideAIResponse();

  useEffect(() => {
    if (!isEnabled) return;

    // Fetch AI feedback every 10 seconds of video playback
    if (videoTimestamp % 10 === 0 && videoTimestamp > 0) {
      fetchAIFeedback();
    }
  }, [videoTimestamp, isEnabled]);

  const fetchAIFeedback = async () => {
    try {
      const request: AIRequest = {
        tutorialId,
        videoTimestamp,
        userAnswers: [],
      };
      const response = await provideAIResponse.mutateAsync(request);
      setFeedback(response.feedback);
      setSuggestions(response.suggestions);
    } catch (error) {
      console.error('Failed to fetch AI feedback:', error);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">AI Assistant</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEnabled(!isEnabled)}
          >
            {isEnabled ? 'Disable' : 'Enable'}
          </Button>
        </div>
        <CardDescription>Real-time guidance and feedback</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isEnabled ? (
          <p className="text-sm text-muted-foreground">AI Assistant is disabled</p>
        ) : provideAIResponse.isPending ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            <p className="text-sm text-muted-foreground">Analyzing...</p>
          </div>
        ) : feedback ? (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Feedback:</h4>
              <p className="text-sm text-muted-foreground">{feedback}</p>
            </div>
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Suggestions:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-muted-foreground">
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Play the video to receive AI-powered guidance
          </p>
        )}
      </CardContent>
    </Card>
  );
}
