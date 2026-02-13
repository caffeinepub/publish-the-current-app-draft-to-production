import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { useGetChatHistory, useSendChatMessage, useSendAIChatResponse } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';

export default function AIChatTutor() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { identity } = useInternetIdentity();
  
  const { data: chatHistory = [], refetch } = useGetChatHistory();
  const sendMessage = useSendChatMessage();
  const sendAIResponse = useSendAIChatResponse();

  const isAuthenticated = !!identity;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isTyping]);

  const handleSendMessage = async () => {
    if (!message.trim() || !isAuthenticated) return;

    const userMessage = message.trim();
    setMessage('');

    try {
      // Send user message
      await sendMessage.mutateAsync(userMessage);
      await refetch();

      // Simulate AI thinking
      setIsTyping(true);

      // Generate AI response based on user query
      const aiResponse = generateAIResponse(userMessage);
      
      // Simulate delay for realistic chat experience
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

      // Send AI response
      await sendAIResponse.mutateAsync(aiResponse);
      await refetch();
      setIsTyping(false);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
      setIsTyping(false);
    }
  };

  const generateAIResponse = (userQuery: string): string => {
    const query = userQuery.toLowerCase();

    // Ocarina learning responses
    if (query.includes('breath') || query.includes('breathing')) {
      return "Great question about breathing! For ocarina playing, use diaphragmatic breathing - breathe deeply from your belly, not your chest. Take steady, controlled breaths and maintain consistent air pressure. Practice long tones to develop breath control.";
    }
    
    if (query.includes('finger') || query.includes('fingering')) {
      return "Fingering technique is crucial! Keep your fingers curved and relaxed, covering the holes completely with your finger pads. Practice slowly at first, focusing on clean transitions between notes. Use a fingering chart as reference until muscle memory develops.";
    }

    if (query.includes('beginner') || query.includes('start')) {
      return "Welcome to ocarina learning! Start with simple songs like 'Mary Had a Little Lamb' or 'Hot Cross Buns'. Focus on proper breath control and finger placement first. Practice 15-20 minutes daily for best results. Check out our beginner tutorials!";
    }

    if (query.includes('song') || query.includes('music') || query.includes('play')) {
      return "When learning songs, break them into small phrases. Master each phrase before combining them. Use a metronome to maintain steady tempo. Start slowly and gradually increase speed as you become comfortable. Our tutorial library has many songs to practice!";
    }

    if (query.includes('tone') || query.includes('sound')) {
      return "To improve your tone quality: ensure proper embouchure (mouth position), maintain steady air pressure, and cover all holes completely. The ocarina should be angled slightly downward. Practice long tones daily to develop consistency.";
    }

    if (query.includes('practice') || query.includes('improve')) {
      return "Effective practice tips: 1) Warm up with scales and long tones, 2) Practice difficult passages slowly, 3) Use a metronome, 4) Record yourself to identify areas for improvement, 5) Take breaks to avoid fatigue. Consistency is key - daily practice is better than long irregular sessions!";
    }

    if (query.includes('tutorial') || query.includes('lesson')) {
      return "Our learning section has tutorials organized by difficulty level. Start with beginner tutorials to build fundamentals, then progress to intermediate and advanced lessons. Each tutorial includes video demonstrations and practice exercises. You can earn tokens by completing tutorials!";
    }

    if (query.includes('help') || query.includes('stuck')) {
      return "I'm here to help! You can ask me about: breathing techniques, fingering patterns, song recommendations, practice strategies, tone improvement, or any ocarina-related questions. What specific aspect would you like guidance on?";
    }

    if (query.includes('token') || query.includes('reward')) {
      return "You can earn tokens by completing tutorials, sharing recordings in the community, and making purchases! Tokens can be used to unlock premium content or transferred to other users. Check your wallet to see your balance and transaction history.";
    }

    // Default response
    return "That's an interesting question about ocarina learning! I can help you with breathing techniques, fingering patterns, song selection, practice strategies, and more. Could you tell me more specifically what you'd like to learn or improve?";
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:scale-110 transition-transform z-50"
        >
          <img 
            src="/assets/generated/chat-tutor-button-transparent.dim_64x64.png" 
            alt="AI Tutor" 
            className="h-8 w-8"
          />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl flex flex-col z-50 border-2">
          {/* Header */}
          <div 
            className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10"
            style={{ backgroundImage: 'url(/assets/generated/chat-header-background.dim_400x60.png)', backgroundSize: 'cover' }}
          >
            <div className="flex items-center gap-3">
              <img 
                src="/assets/generated/ai-tutor-avatar-transparent.dim_80x80.png" 
                alt="AI Tutor" 
                className="h-10 w-10 rounded-full"
              />
              <div>
                <h3 className="font-semibold text-sm">AI Ocarina Tutor</h3>
                <p className="text-xs text-muted-foreground">Always here to help!</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4" ref={scrollRef}>
            <div className="space-y-4">
              {chatHistory.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  <img 
                    src="/assets/generated/ai-tutor-avatar-transparent.dim_80x80.png" 
                    alt="AI Tutor" 
                    className="h-16 w-16 mx-auto mb-4 opacity-50"
                  />
                  <p>Hello! I'm your AI ocarina tutor.</p>
                  <p className="mt-2">Ask me anything about ocarina playing, techniques, or practice tips!</p>
                </div>
              )}
              
              {chatHistory.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.isAI ? 'justify-start' : 'justify-end'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.isAI
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-primary text-primary-foreground'
                    }`}
                  >
                    {msg.isAI && (
                      <div className="flex items-center gap-2 mb-1">
                        <img 
                          src="/assets/generated/ai-tutor-avatar-transparent.dim_80x80.png" 
                          alt="AI" 
                          className="h-4 w-4"
                        />
                        <span className="text-xs font-semibold">AI Tutor</span>
                      </div>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(Number(msg.timestamp) / 1000000).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-secondary text-secondary-foreground rounded-lg p-3 max-w-[80%]">
                    <div className="flex items-center gap-2">
                      <img 
                        src="/assets/generated/typing-indicator-transparent.dim_60x20.png" 
                        alt="Typing" 
                        className="h-4 w-12 opacity-70"
                      />
                      <span className="text-xs text-muted-foreground">AI Tutor is typing...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask about ocarina techniques..."
                disabled={sendMessage.isPending || isTyping}
                className="flex-1"
              />
              <Button
                type="submit"
                size="icon"
                disabled={!message.trim() || sendMessage.isPending || isTyping}
              >
                {sendMessage.isPending || isTyping ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </Card>
      )}
    </>
  );
}
