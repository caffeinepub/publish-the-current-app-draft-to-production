import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useTransferTokens } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';
import { Send } from 'lucide-react';

interface SendTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}

export default function SendTokensDialog({ open, onOpenChange, currentBalance }: SendTokensDialogProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const transferTokens = useTransferTokens();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient.trim()) {
      toast.error('Please enter a recipient principal');
      return;
    }

    const amountNum = parseInt(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (amountNum > currentBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const recipientPrincipal = Principal.fromText(recipient.trim());
      await transferTokens.mutateAsync({
        to: recipientPrincipal,
        amount: BigInt(amountNum),
        description: description.trim() || 'Token transfer',
      });
      toast.success('Tokens sent successfully!');
      onOpenChange(false);
      setRecipient('');
      setAmount('');
      setDescription('');
    } catch (error: any) {
      if (error.message?.includes('Invalid principal')) {
        toast.error('Invalid recipient principal');
      } else {
        toast.error('Failed to send tokens');
      }
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Send Tokens
          </DialogTitle>
          <DialogDescription>
            Transfer tokens to another user. Current balance: {currentBalance} tokens
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Principal *</Label>
            <Input
              id="recipient"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Enter principal ID"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a note..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={transferTokens.isPending}>
              {transferTokens.isPending ? 'Sending...' : 'Send Tokens'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
