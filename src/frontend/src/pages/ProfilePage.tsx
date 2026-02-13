import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Music, ShoppingBag, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ProfilePage() {
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();

  if (!identity) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Please login to view your profile</p>
        <Button onClick={() => navigate({ to: '/' })} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  const initials = profile.username.slice(0, 2).toUpperCase();
  const tokenBalance = Number(profile.tokenBalance);

  return (
    <div className="container py-8 space-y-8">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-3xl">{profile.username}</CardTitle>
              <CardDescription>{profile.bio || 'No bio yet'}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid md:grid-cols-3 gap-6">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate({ to: '/wallet' })}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Tokens" className="h-5 w-5" />
                <span className="text-sm text-muted-foreground">Tokens</span>
              </div>
              <p className="text-2xl font-bold text-primary">{tokenBalance}</p>
            </div>
            <p className="text-sm text-muted-foreground mt-2">Click to view wallet</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Uploaded Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {profile.uploadedContent.length} items uploaded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Purchased Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {profile.purchasedContent.length} items purchased
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
