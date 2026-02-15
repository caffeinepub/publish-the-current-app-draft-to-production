import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useMintTokens } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';

interface MintTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MintTokensDialog({ open, onOpenChange }: MintTokensDialogProps) {
  const [recipientInput, setRecipientInput] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const mintTokens = useMintTokens();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientInput.trim() || !amount || Number(amount) <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    try {
      const recipientPrincipal = Principal.fromText(recipientInput.trim());
      
      await mintTokens.mutateAsync({
        recipient: recipientPrincipal,
        amount: BigInt(amount),
        description: description.trim() || 'Token mint',
      });

      toast.success(`Successfully minted ${amount} tokens`);
      setRecipientInput('');
      setAmount('');
      setDescription('');
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to mint tokens';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mint Tokens</DialogTitle>
          <DialogDescription>
            Create new tokens and distribute them to a user (Admin only)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Recipient Principal</Label>
            <Input
              id="recipient"
              placeholder="Enter principal ID"
              value={recipientInput}
              onChange={(e) => setRecipientInput(e.target.value)}
              disabled={mintTokens.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={mintTokens.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={mintTokens.isPending}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mintTokens.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mintTokens.isPending}>
              {mintTokens.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Minting...
                </>
              ) : (
                'Mint Tokens'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
