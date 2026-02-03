import { useState, useEffect } from 'react';
import { History, Receipt, ShoppingCart, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BillPayment {
  id: string;
  bill_amount: number;
  credits_used: number;
  credit_savings: number;
  cash_paid: number;
  created_at: string;
}

interface Transaction {
  id: string;
  buyer_id: string;
  seller_id: string;
  credits_amount: number;
  total_price: number;
  created_at: string;
}

interface CombinedTransaction {
  id: string;
  type: 'bill_payment' | 'purchase' | 'sale';
  amount: number;
  credits: number;
  savings?: number;
  date: Date;
  description: string;
}

export function TransactionHistory() {
  const { user } = useAuthContext();
  const [transactions, setTransactions] = useState<CombinedTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAllTransactions();
    }
  }, [user]);

  const fetchAllTransactions = async () => {
    if (!user) return;

    setLoading(true);
    
    // Fetch bill payments and marketplace transactions in parallel
    const [billPaymentsRes, transactionsRes] = await Promise.all([
      supabase
        .from('bill_payments')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('transactions')
        .select('*')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
    ]);

    const combined: CombinedTransaction[] = [];

    // Add bill payments
    if (billPaymentsRes.data) {
      billPaymentsRes.data.forEach((bp: BillPayment) => {
        combined.push({
          id: bp.id,
          type: 'bill_payment',
          amount: Number(bp.bill_amount),
          credits: Number(bp.credits_used),
          savings: Number(bp.credit_savings),
          date: new Date(bp.created_at),
          description: `Bill payment - Used ${bp.credits_used} credits, saved ₹${bp.credit_savings}`
        });
      });
    }

    // Add marketplace transactions
    if (transactionsRes.data) {
      transactionsRes.data.forEach((tx: Transaction) => {
        const isBuyer = tx.buyer_id === user.id;
        combined.push({
          id: tx.id,
          type: isBuyer ? 'purchase' : 'sale',
          amount: Number(tx.total_price),
          credits: Number(tx.credits_amount),
          date: new Date(tx.created_at),
          description: isBuyer 
            ? `Purchased ${tx.credits_amount} credits for ₹${tx.total_price}`
            : `Sold ${tx.credits_amount} credits for ₹${tx.total_price}`
        });
      });
    }

    // Sort by date descending
    combined.sort((a, b) => b.date.getTime() - a.date.getTime());
    
    setTransactions(combined);
    setLoading(false);
  };

  const getTransactionIcon = (type: CombinedTransaction['type']) => {
    switch (type) {
      case 'bill_payment':
        return <Receipt className="h-4 w-4" />;
      case 'purchase':
        return <ArrowDownLeft className="h-4 w-4" />;
      case 'sale':
        return <ArrowUpRight className="h-4 w-4" />;
    }
  };

  const getTransactionBadge = (type: CombinedTransaction['type']) => {
    switch (type) {
      case 'bill_payment':
        return <Badge variant="secondary">Bill Payment</Badge>;
      case 'purchase':
        return <Badge variant="default">Purchase</Badge>;
      case 'sale':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Sale</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Transaction History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Your bill payments and credit trades will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className={`p-2 rounded-full ${
                    tx.type === 'bill_payment' 
                      ? 'bg-primary/10 text-primary'
                      : tx.type === 'purchase'
                      ? 'bg-blue-500/10 text-blue-600'
                      : 'bg-green-500/10 text-green-600'
                  }`}>
                    {getTransactionIcon(tx.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {getTransactionBadge(tx.type)}
                      <span className="text-xs text-muted-foreground">
                        {format(tx.date, 'MMM d, yyyy • h:mm a')}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{tx.description}</p>
                    {tx.type === 'bill_payment' && (
                      <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                        <span>Bill: ₹{tx.amount.toLocaleString()}</span>
                        <span>Cash Paid: ₹{(tx.amount - (tx.savings || 0)).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${
                      tx.type === 'sale' ? 'text-green-600' : ''
                    }`}>
                      {tx.type === 'sale' ? '+' : '-'}₹{tx.amount.toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {tx.credits} credits
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
