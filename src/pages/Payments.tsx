import { useState, useEffect } from 'react';
import { Receipt, ArrowUpRight, ArrowDownLeft, ShoppingCart, Zap, FileText, CheckCircle2, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface BillPayment {
  id: string;
  bill_amount: number;
  credits_used: number;
  credit_savings: number;
  cash_paid: number;
  provider: string;
  consumer_number: string;
  consumer_name: string;
  billing_month: string;
  meter_number: string;
  units_consumed: number;
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

export default function Payments() {
  const { user } = useAuthContext();
  const [billPayments, setBillPayments] = useState<BillPayment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBill, setSelectedBill] = useState<BillPayment | null>(null);

  useEffect(() => {
    if (user) {
      fetchAllData();
    }
  }, [user]);

  const fetchAllData = async () => {
    if (!user) return;

    setLoading(true);
    
    const [billsRes, transactionsRes] = await Promise.all([
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

    if (billsRes.data) {
      setBillPayments(billsRes.data as BillPayment[]);
    }

    if (transactionsRes.data) {
      setTransactions(transactionsRes.data as Transaction[]);
    }

    setLoading(false);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payments</h1>
          <p className="text-muted-foreground mt-1">View your payment history and transactions</p>
        </div>

        <Tabs defaultValue="electricity" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="electricity" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Electricity Bills
            </TabsTrigger>
            <TabsTrigger value="credits" className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Credit Transactions
            </TabsTrigger>
          </TabsList>

          {/* Electricity Bills Tab */}
          <TabsContent value="electricity" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Electricity Bill Payments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : billPayments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No electricity bill payments yet</p>
                    <p className="text-sm">Pay your first bill to see it here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {billPayments.map((bill) => (
                        <div
                          key={bill.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => setSelectedBill(bill)}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-full bg-primary/10 text-primary">
                              <Zap className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium">{bill.provider || 'Electricity Bill'}</p>
                              <p className="text-sm text-muted-foreground">
                                {bill.consumer_number} • {bill.billing_month || format(new Date(bill.created_at), 'MMM yyyy')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">₹{Number(bill.bill_amount).toLocaleString()}</p>
                            <Badge variant="secondary" className="text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Paid
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Credit Transactions Tab */}
          <TabsContent value="credits" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Credit Transactions
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
                    <p>No credit transactions yet</p>
                    <p className="text-sm">Buy or sell credits to see transactions here</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {transactions.map((tx) => {
                        const isBuyer = tx.buyer_id === user?.id;
                        return (
                          <div
                            key={tx.id}
                            className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-full ${
                                isBuyer 
                                  ? 'bg-blue-500/10 text-blue-600' 
                                  : 'bg-green-500/10 text-green-600'
                              }`}>
                                {isBuyer ? (
                                  <ArrowDownLeft className="h-4 w-4" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium">
                                  {isBuyer ? 'Purchased Credits' : 'Sold Credits'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {format(new Date(tx.created_at), 'dd MMM yyyy • hh:mm a')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${isBuyer ? '' : 'text-green-600'}`}>
                                {isBuyer ? '-' : '+'}₹{Number(tx.total_price).toLocaleString()}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {tx.credits_amount} credits
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bill Receipt Dialog */}
        <Dialog open={!!selectedBill} onOpenChange={() => setSelectedBill(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Electricity Bill Receipt
              </DialogTitle>
            </DialogHeader>
            {selectedBill && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Receipt ID</p>
                    <p className="font-mono font-medium">{selectedBill.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{format(new Date(selectedBill.created_at), 'dd MMM yyyy • hh:mm a')}</p>
                  </div>
                </div>

                <div className="border-t border-b border-border py-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Provider</span>
                    <span className="font-medium">{selectedBill.provider || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consumer Name</span>
                    <span className="font-medium">{selectedBill.consumer_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Consumer Number</span>
                    <span className="font-mono font-medium">{selectedBill.consumer_number || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Billing Month</span>
                    <span className="font-medium">{selectedBill.billing_month || 'N/A'}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Payment Breakdown</h4>
                  <div className="flex justify-between text-sm">
                    <span>Total Bill Amount</span>
                    <span className="font-medium">₹{Number(selectedBill.bill_amount).toLocaleString()}</span>
                  </div>
                  {Number(selectedBill.credits_used) > 0 && (
                    <div className="flex justify-between text-sm text-primary">
                      <span>Credits Applied ({selectedBill.credits_used})</span>
                      <span className="font-medium">-₹{Number(selectedBill.credit_savings).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm border-t border-border pt-3">
                    <span className="font-semibold">UPI Paid</span>
                    <span className="font-bold text-lg">₹{Number(selectedBill.cash_paid).toLocaleString()}</span>
                  </div>
                </div>

                <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="font-medium text-primary">✅ Paid Successfully</span>
                </div>

                <Button variant="outline" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
}
