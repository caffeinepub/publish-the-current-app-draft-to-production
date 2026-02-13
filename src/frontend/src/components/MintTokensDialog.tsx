import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useMintTokens } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';
import { Coins } from 'lucide-react';

interface MintTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MintTokensDialog({ open, onOpenChange }: MintTokensDialogProps) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const mintTokens = useMintTokens();

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

    try {
      const recipientPrincipal = Principal.fromText(recipient.trim());
      await mintTokens.mutateAsync({
        recipient: recipientPrincipal,
        amount: BigInt(amountNum),
        description: description.trim() || 'Token minting',
      });
      toast.success('Tokens minted successfully!');
      onOpenChange(false);
      setRecipient('');
      setAmount('');
      setDescription('');
    } catch (error: any) {
      if (error.message?.includes('Invalid principal')) {
        toast.error('Invalid recipient principal');
      } else {
        toast.error('Failed to mint tokens');
      }
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Coins className="h-5 w-5" />
            Mint Tokens
          </DialogTitle>
          <DialogDescription>
            Create new tokens and distribute them to users (Admin only)
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
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount to mint"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Reason for minting..."
              rows={2}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={mintTokens.isPending}>
              {mintTokens.isPending ? 'Minting...' : 'Mint Tokens'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
