import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetAllOrdersAdmin } from '../../hooks/useQueries';
import { Package, Loader2 } from 'lucide-react';
import type { EnhancedOrder } from '../../backend';

export default function OrdersSection() {
  const { data: orders, isLoading } = useGetAllOrdersAdmin();

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status: EnhancedOrder['status']) => {
    const statusKey = Object.keys(status)[0] as 'pending' | 'completed' | 'cancelled';
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      pending: 'secondary',
      completed: 'default',
      cancelled: 'destructive',
    };
    return (
      <Badge variant={variants[statusKey] || 'default'}>
        {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
      </Badge>
    );
  };

  const getPaymentTypeBadge = (paymentType: EnhancedOrder['paymentType']) => {
    const typeKey = Object.keys(paymentType)[0] as 'card' | 'token';
    return (
      <Badge variant="outline">
        {typeKey === 'card' ? 'Card' : 'Token'}
      </Badge>
    );
  };

  const getItemsSummary = (order: EnhancedOrder) => {
    const totalItems = order.products.reduce((sum, p) => sum + Number(p.quantity), 0);
    const itemNames = order.products.map(p => `${p.quantity}x ${p.name}`).join(', ');
    return `${totalItems} item${totalItems > 1 ? 's' : ''}: ${itemNames}`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders
          </CardTitle>
          <CardDescription>Loading orders...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Orders
          </CardTitle>
          <CardDescription>No orders yet</CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No orders have been placed yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Orders
        </CardTitle>
        <CardDescription>
          {orders.length} order{orders.length > 1 ? 's' : ''} total
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Buyer</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-xs">
                    {order.id.slice(0, 12)}...
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(order.createdAt)}
                  </TableCell>
                  <TableCell className="font-medium">
                    {order.buyerDetails.name || 'N/A'}
                  </TableCell>
                  <TableCell className="text-sm">
                    {order.buyerDetails.phoneNumber || 'N/A'}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm truncate" title={getItemsSummary(order)}>
                      {getItemsSummary(order)}
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">
                    ${(Number(order.total) / 100).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    {getPaymentTypeBadge(order.paymentType)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(order.status)}
                  </TableCell>
                  <TableCell className="max-w-xs">
                    <div className="text-sm text-muted-foreground truncate" title={order.buyerDetails.notes}>
                      {order.buyerDetails.notes || '-'}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
