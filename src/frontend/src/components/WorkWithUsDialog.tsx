import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Briefcase } from 'lucide-react';
import { useSubmitWorkWithUsApplication } from '../hooks/useQueries';
import { toast } from 'sonner';
import type { WorkWithUsApplication } from '../types';

interface WorkWithUsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function WorkWithUsDialog({ open, onOpenChange }: WorkWithUsDialogProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const submitApplication = useSubmitWorkWithUsApplication();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    const application: WorkWithUsApplication = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
    };

    try {
      await submitApplication.mutateAsync(application);
      toast.success('Application submitted successfully! We\'ll be in touch soon.');
      
      // Reset form
      setName('');
      setEmail('');
      setMessage('');
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to submit application';
      toast.error(errorMessage);
      console.error('Application submission error:', error);
    }
  };

  const handleCancel = () => {
    setName('');
    setEmail('');
    setMessage('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Work with us
          </DialogTitle>
          <DialogDescription>
            Interested in joining our team or collaborating? Fill out the form below and we'll get back to you.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={submitApplication.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={submitApplication.isPending}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              placeholder="Tell us about yourself and why you'd like to work with us..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={submitApplication.isPending}
              rows={6}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={submitApplication.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitApplication.isPending}>
              {submitApplication.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Application'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
