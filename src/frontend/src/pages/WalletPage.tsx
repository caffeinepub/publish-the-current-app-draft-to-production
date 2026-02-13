import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useNavigate } from '@tanstack/react-router';
import { Coins, Send, ArrowUpRight, ArrowDownRight, TrendingUp, Wallet } from 'lucide-react';
import SendTokensDialog from '../components/SendTokensDialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Variant_earn_mint_spend_transfer } from '../backend';

export default function WalletPage() {
  const { data: profile, isLoading } = useGetCallerUserProfile();
  const { identity } = useInternetIdentity();
  const navigate = useNavigate();
  const [showSendDialog, setShowSendDialog] = useState(false);

  if (!identity) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Please login to view your wallet</p>
        <Button onClick={() => navigate({ to: '/' })} className="mt-4">
          Go Home
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container py-16 text-center">
        <p className="text-muted-foreground">Loading wallet...</p>
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

  const tokenBalance = Number(profile.tokenBalance);
  const transactions = profile.transactionHistory || [];

  const getTransactionIcon = (type: Variant_earn_mint_spend_transfer) => {
    switch (type) {
      case Variant_earn_mint_spend_transfer.mint:
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case Variant_earn_mint_spend_transfer.transfer:
        return <Send className="h-4 w-4 text-blue-500" />;
      case Variant_earn_mint_spend_transfer.spend:
        return <ArrowUpRight className="h-4 w-4 text-red-500" />;
      case Variant_earn_mint_spend_transfer.earn:
        return <ArrowDownRight className="h-4 w-4 text-green-500" />;
      default:
        return <Coins className="h-4 w-4" />;
    }
  };

  const getTransactionColor = (type: Variant_earn_mint_spend_transfer) => {
    switch (type) {
      case Variant_earn_mint_spend_transfer.mint:
      case Variant_earn_mint_spend_transfer.earn:
        return 'text-green-600 dark:text-green-400';
      case Variant_earn_mint_spend_transfer.spend:
        return 'text-red-600 dark:text-red-400';
      case Variant_earn_mint_spend_transfer.transfer:
        return 'text-blue-600 dark:text-blue-400';
      default:
        return 'text-foreground';
    }
  };

  const getTransactionSign = (type: Variant_earn_mint_spend_transfer) => {
    switch (type) {
      case Variant_earn_mint_spend_transfer.spend:
      case Variant_earn_mint_spend_transfer.transfer:
        return '-';
      default:
        return '+';
    }
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="container py-8 space-y-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 via-primary/10 to-accent/20 p-8">
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <Wallet className="h-12 w-12" />
            <h1 className="text-4xl font-bold">Token Wallet</h1>
          </div>
          <p className="text-muted-foreground mb-6">Manage your local tokens</p>
          
          {/* Token Balance Display */}
          <div className="bg-background/50 backdrop-blur rounded-xl p-6 border border-border/50 max-w-md">
            <div className="flex items-center gap-2 mb-2">
              <img src="/assets/generated/token-coin-icon-transparent.dim_64x64.png" alt="Tokens" className="h-6 w-6" />
              <span className="text-sm text-muted-foreground">Local Tokens</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{tokenBalance}</span>
              <span className="text-lg text-muted-foreground">tokens</span>
            </div>
          </div>
        </div>
        <img 
          src="/assets/generated/token-wallet-interface.dim_400x300.png" 
          alt="Wallet" 
          className="absolute right-0 bottom-0 h-48 opacity-20"
        />
      </div>

      {/* Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <Button onClick={() => setShowSendDialog(true)} size="lg" className="gap-2">
          <Send className="h-5 w-5" />
          Send Tokens
        </Button>
        <Button onClick={() => navigate({ to: '/store' })} size="lg" variant="outline" className="gap-2">
          <Coins className="h-5 w-5" />
          Spend Tokens
        </Button>
        <Button onClick={() => navigate({ to: '/learning' })} size="lg" variant="outline" className="gap-2">
          <img src="/assets/generated/reward-token-icon-transparent.dim_64x64.png" alt="Earn" className="h-5 w-5" />
          Earn Tokens
        </Button>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            {transactions.length === 0 ? 'No transactions yet' : `${transactions.length} transactions`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <img 
                src="/assets/generated/token-transfer-illustration.dim_300x200.png" 
                alt="No transactions" 
                className="mx-auto h-32 opacity-50"
              />
              <p className="text-muted-foreground mt-4">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Complete tutorials to earn tokens or make purchases to see your transaction history
              </p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-4">
                {transactions.map((tx, index) => {
                  const txType = tx.transactionType;
                  return (
                    <div key={index}>
                      <div className="flex items-start gap-4">
                        <div className="mt-1">{getTransactionIcon(txType)}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{tx.description}</p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(tx.timestamp)}
                              </p>
                            </div>
                            <div className={`font-semibold whitespace-nowrap ${getTransactionColor(txType)}`}>
                              {getTransactionSign(txType)}
                              {Number(tx.amount)} tokens
                            </div>
                          </div>
                          {tx.from && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              From: {tx.from.toString()}
                            </p>
                          )}
                          {tx.to && (
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              To: {tx.to.toString()}
                            </p>
                          )}
                        </div>
                      </div>
                      {index < transactions.length - 1 && <Separator className="mt-4" />}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <SendTokensDialog 
        open={showSendDialog} 
        onOpenChange={setShowSendDialog}
        currentBalance={tokenBalance}
      />
    </div>
  );
}
