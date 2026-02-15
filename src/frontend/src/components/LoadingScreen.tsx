import { Music } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5">
      <div className="text-center space-y-4">
        <Music className="h-16 w-16 mx-auto animate-pulse text-primary" />
        <p className="text-lg text-muted-foreground">Loading 3Docarinas...</p>
      </div>
    </div>
  );
}
