import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Role } from '../types';
import type { UserProfile } from '../backend';

interface ProfileSetupModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ProfileSetupModal({ open, onOpenChange }: ProfileSetupModalProps) {
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!identity) {
      toast.error('Please log in first');
      return;
    }

    if (!username.trim()) {
      toast.error('Please enter a username');
      return;
    }

    try {
      const profile: UserProfile = {
        username: username.trim(),
        bio: bio.trim(),
        uploadedContent: [],
        purchasedContent: [],
        createdAt: BigInt(Date.now() * 1000000),
        role: Role.user,
        tokenBalance: BigInt(0),
        transactionHistory: [],
        aiAssistantEnabled: true,
        aiInteractionHistory: [],
      };

      await saveProfile.mutateAsync(profile);
      toast.success('Profile created successfully');
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create profile';
      toast.error(errorMessage);
      console.error('Profile setup error:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Welcome! Set up your profile</DialogTitle>
          <DialogDescription>
            Please provide your information to get started
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter your username"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bio">Bio (optional)</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={3}
            />
          </div>

          <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
            {saveProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Profile...
              </>
            ) : (
              'Create Profile'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
