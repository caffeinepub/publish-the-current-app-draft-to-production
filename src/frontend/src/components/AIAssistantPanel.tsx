import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Lightbulb, MessageSquare, Loader2 } from 'lucide-react';
import { useProvideAIResponse, useIsAIAssistantEnabled, useToggleAIAssistant, useUpdateAIHistory } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import type { AIRequest } from '../backend';

interface AIAssistantPanelProps {
  tutorialId: string;
  tutorialTitle: string;
  videoTimestamp: number;
  isPlaying: boolean;
}

export default function AIAssistantPanel({ 
  tutorialId, 
  tutorialTitle, 
  videoTimestamp,
  isPlaying 
}: AIAssistantPanelProps) {
  const { identity } = useInternetIdentity();
  const { data: isEnabled = false, isLoading: isLoadingEnabled } = useIsAIAssistantEnabled();
  const toggleAssistant = useToggleAIAssistant();
  const provideAIResponse = useProvideAIResponse();
  const updateAIHistory = useUpdateAIHistory();
  
  const [feedback, setFeedback] = useState<string>('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [lastCheckedTimestamp, setLastCheckedTimestamp] = useState<number>(0);

  const isAuthenticated = !!identity;

  // Fetch AI feedback at specific intervals during playback
  useEffect(() => {
    if (!isEnabled || !isAuthenticated || !isPlaying) return;

    const checkInterval = 10; // Check every 10 seconds
    const currentInterval = Math.floor(videoTimestamp / checkInterval);
    const intervalTimestamp = currentInterval * checkInterval;

    if (intervalTimestamp !== lastCheckedTimestamp && intervalTimestamp > 0) {
      setLastCheckedTimestamp(intervalTimestamp);
      fetchAIFeedback(intervalTimestamp);
    }
  }, [videoTimestamp, isEnabled, isAuthenticated, isPlaying]);

  const fetchAIFeedback = async (timestamp: number) => {
    try {
      const request: AIRequest = {
        tutorialId,
        videoTimestamp: BigInt(timestamp),
        userAnswers: [],
      };

      const response = await provideAIResponse.mutateAsync(request);
      
      if (response.feedback && response.feedback.trim() !== '' && !response.feedback.includes('No feedback available')) {
        setFeedback(response.feedback);
        setSuggestions(response.suggestions || []);

        // Update AI history
        await updateAIHistory.mutateAsync({
          tutorialId,
          timestamp: BigInt(Date.now() * 1000000), // Convert to nanoseconds
          feedback: response.feedback,
        });
      }
    } catch (error) {
      console.error('Error fetching AI feedback:', error);
    }
  };

  const handleToggle = async (checked: boolean) => {
    try {
      await toggleAssistant.mutateAsync(checked);
      toast.success(checked ? 'AI Assistant enabled' : 'AI Assistant disabled');
      
      if (!checked) {
        setFeedback('');
        setSuggestions([]);
      }
    } catch (error) {
      toast.error('Failed to toggle AI Assistant');
      console.error(error);
    }
  };

  if (!isAuthenticated) {
    return (
      <Card className="h-full">
        <CardHeader>
          <div className="flex items-center gap-2">
            <img 
              src="/assets/generated/ai-assistant-icon-transparent.dim_64x64.png" 
              alt="AI Assistant" 
              className="h-8 w-8"
            />
            <CardTitle>AI Learning Assistant</CardTitle>
          </div>
          <CardDescription>Login to access AI-powered guidance</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Please login to enable the AI assistant and receive personalized feedback during your learning sessions.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img 
              src="/assets/generated/ai-assistant-icon-transparent.dim_64x64.png" 
              alt="AI Assistant" 
              className="h-8 w-8"
            />
            <div>
              <CardTitle className="text-lg">AI Learning Assistant</CardTitle>
              <CardDescription className="text-xs">{tutorialTitle}</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="ai-toggle" className="text-xs cursor-pointer">
              {isLoadingEnabled ? 'Loading...' : isEnabled ? 'On' : 'Off'}
            </Label>
            <Switch
              id="ai-toggle"
              checked={isEnabled}
              onCheckedChange={handleToggle}
              disabled={toggleAssistant.isPending || isLoadingEnabled}
            />
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col min-h-0">
        {!isEnabled ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-8">
            <img 
              src="/assets/generated/ai-feedback-panel.dim_300x200.png" 
              alt="AI Assistant" 
              className="h-32 opacity-50"
            />
            <div>
              <p className="text-sm font-medium mb-1">AI Assistant is disabled</p>
              <p className="text-xs text-muted-foreground">
                Enable the assistant to receive real-time feedback and guidance during your lesson
              </p>
            </div>
          </div>
        ) : (
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {provideAIResponse.isPending && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Analyzing your progress...</span>
                </div>
              )}

              {feedback ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-1">AI Feedback</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {feedback}
                      </p>
                    </div>
                  </div>

                  {suggestions.length > 0 && (
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-semibold mb-2">Suggestions</h4>
                        <ul className="space-y-1">
                          {suggestions.map((suggestion, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                              <span className="text-primary">•</span>
                              <span>{suggestion}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  <Badge variant="outline" className="text-xs">
                    <MessageSquare className="h-3 w-3 mr-1" />
                    Timestamp: {Math.floor(videoTimestamp)}s
                  </Badge>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50" />
                  <div>
                    <p className="text-sm font-medium mb-1">Watching for feedback moments</p>
                    <p className="text-xs text-muted-foreground">
                      The AI assistant will provide guidance at key points during the tutorial
                    </p>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
