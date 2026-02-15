import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { useTransferTokens } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Principal } from '@icp-sdk/core/principal';

interface SendTokensDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBalance: number;
}

export default function SendTokensDialog({ open, onOpenChange, currentBalance }: SendTokensDialogProps) {
  const [recipientInput, setRecipientInput] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const transferTokens = useTransferTokens();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipientInput.trim() || !amount || Number(amount) <= 0) {
      toast.error('Please fill in all fields with valid values');
      return;
    }

    if (Number(amount) > currentBalance) {
      toast.error('Insufficient balance');
      return;
    }

    try {
      const recipientPrincipal = Principal.fromText(recipientInput.trim());
      
      await transferTokens.mutateAsync({
        to: recipientPrincipal,
        amount: BigInt(amount),
        description: description.trim() || 'Token transfer',
      });

      toast.success(`Successfully sent ${amount} tokens`);
      setRecipientInput('');
      setAmount('');
      setDescription('');
      onOpenChange(false);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to transfer tokens';
      toast.error(errorMessage);
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Send Tokens</DialogTitle>
          <DialogDescription>
            Transfer tokens to another user. Current balance: {currentBalance} tokens
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
              disabled={transferTokens.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={currentBalance}
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={transferTokens.isPending}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter description (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={transferTokens.isPending}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={transferTokens.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={transferTokens.isPending}>
              {transferTokens.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Tokens'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
