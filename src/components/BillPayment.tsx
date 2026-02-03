import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Receipt, 
  Wallet, 
  Zap, 
  ArrowRight, 
  CheckCircle2,
  Coins,
  Minus,
  Plus,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';

interface BillPaymentProps {
  credits: number;
  cash: number;
  onPaymentComplete: (newCredits: number, newCash: number) => void;
  isConsumer?: boolean;
}

export function BillPayment({ credits, cash, onPaymentComplete, isConsumer = false }: BillPaymentProps) {
  const { toast } = useToast();
  const [billAmount, setBillAmount] = useState('');
  const [creditsToUse, setCreditsToUse] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [lastPayment, setLastPayment] = useState<{
    billAmount: number;
    creditsUsed: number;
    savings: number;
    cashPaid: number;
  } | null>(null);

  const savingsPerCredit = 2; // ₹2 per credit
  const billValue = parseFloat(billAmount) || 0;
  const maxCreditsForBill = Math.min(credits, Math.floor(billValue / savingsPerCredit));
  const creditSavings = creditsToUse * savingsPerCredit;
  const amountToPay = Math.max(0, billValue - creditSavings);
  const canAfford = amountToPay <= cash;

  const handlePayBill = async () => {
    if (!billAmount || billValue <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid bill amount',
        description: 'Please enter a valid electricity bill amount'
      });
      return;
    }

    if (!canAfford) {
      toast({
        variant: 'destructive',
        title: 'Insufficient balance',
        description: 'You don\'t have enough cash to pay this bill'
      });
      return;
    }

    setIsLoading(true);

    // Use the atomic pay_bill RPC function
    const { data, error } = await supabase.rpc('pay_bill', {
      p_bill_amount: billValue,
      p_credits_to_use: creditsToUse
    });

    if (error || !data?.[0]?.success) {
      toast({
        variant: 'destructive',
        title: 'Payment failed',
        description: data?.[0]?.message || error?.message || 'Could not process payment'
      });
      setIsLoading(false);
      return;
    }

    // Store last payment details for success screen
    setLastPayment({
      billAmount: billValue,
      creditsUsed: creditsToUse,
      savings: creditSavings,
      cashPaid: amountToPay
    });

    // Update parent state with values from RPC response
    onPaymentComplete(
      Number(data[0].credits_remaining),
      Number(data[0].cash_remaining)
    );
    
    setPaymentSuccess(true);
    setIsLoading(false);
    
    toast({
      title: 'Bill paid successfully!',
      description: creditSavings > 0 
        ? `You saved ₹${creditSavings} using ${creditsToUse} credits!`
        : 'Your electricity bill has been paid.'
    });
  };

  const resetPayment = () => {
    setBillAmount('');
    setCreditsToUse(0);
    setPaymentSuccess(false);
    setLastPayment(null);
  };

  if (paymentSuccess && lastPayment) {
    return (
      <Card className="border-primary/30">
        <CardContent className="pt-8 pb-6">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-10 w-10 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">Payment Successful!</h3>
              <p className="text-muted-foreground mt-1">Your electricity bill has been paid</p>
            </div>
            
            <div className="bg-muted rounded-xl p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bill Amount</span>
                <span className="font-medium">₹{lastPayment.billAmount.toLocaleString()}</span>
              </div>
              {lastPayment.creditsUsed > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Credits Used ({lastPayment.creditsUsed})</span>
                  <span className="font-medium">-₹{lastPayment.savings.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-border pt-3 flex justify-between">
                <span className="font-semibold">Cash Paid</span>
                <span className="font-bold text-lg">₹{lastPayment.cashPaid.toLocaleString()}</span>
              </div>
            </div>

            {lastPayment.savings > 0 && (
              <div className="bg-primary/10 rounded-lg p-3">
                <p className="text-primary font-semibold">
                  🎉 You saved ₹{lastPayment.savings.toLocaleString()} with solar credits!
                </p>
              </div>
            )}

            <Button className="w-full" onClick={resetPayment}>
              Pay Another Bill
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Pay Electricity Bill
        </CardTitle>
        <CardDescription>
          {isConsumer 
            ? 'Use your purchased credits to reduce your bill'
            : 'Use your earned credits to save on your electricity bill'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Bill Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="billAmount" className="flex items-center gap-2">
            <Receipt className="h-4 w-4" />
            Enter Bill Amount
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">₹</span>
            <Input
              id="billAmount"
              type="number"
              placeholder="0"
              className="pl-8 text-2xl h-14 font-bold"
              value={billAmount}
              onChange={(e) => {
                setBillAmount(e.target.value);
                setCreditsToUse(0); // Reset credits when bill changes
              }}
            />
          </div>
        </div>

        {billValue > 0 && (
          <>
            {/* Credit Usage Section */}
            <div className="rounded-xl bg-muted p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="font-medium">Use Credits to Save</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Available: {credits} credits
                </span>
              </div>

              {credits > 0 && maxCreditsForBill > 0 ? (
                <>
                  {/* Credit Slider */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCreditsToUse(Math.max(0, creditsToUse - 1))}
                        disabled={creditsToUse <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <Slider
                        value={[creditsToUse]}
                        onValueChange={(v) => setCreditsToUse(v[0])}
                        max={maxCreditsForBill}
                        step={1}
                        className="flex-1"
                      />
                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setCreditsToUse(Math.min(maxCreditsForBill, creditsToUse + 1))}
                        disabled={creditsToUse >= maxCreditsForBill}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Credits to use</span>
                      <span className="font-bold text-primary">{creditsToUse} credits = ₹{creditSavings} savings</span>
                    </div>
                  </div>

                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => setCreditsToUse(maxCreditsForBill)}
                  >
                    Use Maximum ({maxCreditsForBill} credits)
                  </Button>
                </>
              ) : credits === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-2">
                  {isConsumer 
                    ? 'No credits available. Buy credits from the marketplace to save on your bills!'
                    : 'No credits available. Earn credits by logging your solar energy!'}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Bill amount too low to use credits (minimum ₹{savingsPerCredit} per credit)
                </p>
              )}
            </div>

            {/* Bill Breakdown */}
            <div className="rounded-xl border border-border p-4 space-y-3">
              <h4 className="font-semibold flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Bill Summary
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Bill Amount</span>
                  <span>₹{billValue.toLocaleString()}</span>
                </div>
                {creditsToUse > 0 && (
                  <div className="flex justify-between text-sm text-primary">
                    <span>Credit Discount ({creditsToUse} × ₹{savingsPerCredit})</span>
                    <span>-₹{creditSavings.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-border pt-2 flex justify-between">
                  <span className="font-semibold">Amount to Pay</span>
                  <span className="font-bold text-xl">₹{amountToPay.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2">
                <Wallet className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Cash Balance</span>
              </div>
              <span className={`font-bold ${canAfford ? 'text-foreground' : 'text-destructive'}`}>
                ₹{cash.toLocaleString()}
              </span>
            </div>

            {/* Pay Button */}
            <Button 
              className="w-full h-12 text-lg"
              onClick={handlePayBill}
              disabled={isLoading || !canAfford || billValue <= 0}
            >
              {isLoading ? (
                'Processing...'
              ) : (
                <>
                  Pay ₹{amountToPay.toLocaleString()}
                  <ArrowRight className="h-5 w-5 ml-2" />
                </>
              )}
            </Button>

            {!canAfford && (
              <p className="text-sm text-destructive text-center">
                Insufficient cash balance. Add more credits to reduce the amount.
              </p>
            )}
          </>
        )}

        {billValue === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Enter your electricity bill amount to get started</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
