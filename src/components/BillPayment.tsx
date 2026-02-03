import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Receipt, 
  Zap, 
  CheckCircle2,
  Coins,
  Minus,
  Plus,
  Smartphone,
  Building2,
  FileText,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface BillPaymentProps {
  credits: number;
  cash: number;
  onPaymentComplete: (newCredits: number, newCash: number) => void;
  isConsumer?: boolean;
}

interface DemoBill {
  provider: string;
  consumerName: string;
  consumerNumber: string;
  billingMonth: string;
  meterNumber: string;
  unitsConsumed: number;
  ratePerUnit: number;
  totalAmount: number;
  dueDate: string;
}

interface PaymentReceipt {
  receiptId: string;
  dateTime: string;
  provider: string;
  consumerName: string;
  consumerNumber: string;
  billingMonth: string;
  totalBillAmount: number;
  creditsApplied: number;
  creditSavings: number;
  upiPaidAmount: number;
}

// Indian names for realistic demo
const INDIAN_NAMES = [
  'Ramesh Kulkarni', 'Priya Sharma', 'Suresh Patil', 'Anita Deshmukh',
  'Vijay Reddy', 'Meera Iyer', 'Rajesh Nair', 'Sunita Joshi',
  'Arun Kumar', 'Deepa Menon', 'Sanjay Gupta', 'Kavitha Rao',
  'Mohan Das', 'Lakshmi Krishnan', 'Prakash Hegde', 'Geeta Bhatt'
];

const ELECTRICITY_PROVIDERS = [
  { value: 'MSEDCL', label: 'MSEDCL (Maharashtra)' },
  { value: 'TATA_POWER', label: 'Tata Power' },
  { value: 'BSES_RAJDHANI', label: 'BSES Rajdhani (Delhi)' },
  { value: 'BESCOM', label: 'BESCOM (Karnataka)' },
  { value: 'TNEB', label: 'TNEB (Tamil Nadu)' },
  { value: 'WBSEDCL', label: 'WBSEDCL (West Bengal)' },
  { value: 'UPPCL', label: 'UPPCL (Uttar Pradesh)' },
  { value: 'PSPCL', label: 'PSPCL (Punjab)' },
];

export function BillPayment({ credits, onPaymentComplete, isConsumer = false }: BillPaymentProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'input' | 'bill' | 'payment' | 'receipt'>('input');
  const [provider, setProvider] = useState('');
  const [consumerNumber, setConsumerNumber] = useState('');
  const [demoBill, setDemoBill] = useState<DemoBill | null>(null);
  const [creditsToUse, setCreditsToUse] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);

  const savingsPerCredit = 2; // ₹2 per credit

  const generateDemoBill = () => {
    if (!provider || !consumerNumber) {
      toast({
        variant: 'destructive',
        title: 'Missing information',
        description: 'Please select a provider and enter your consumer number'
      });
      return;
    }

    // Generate realistic demo bill
    const randomName = INDIAN_NAMES[Math.floor(Math.random() * INDIAN_NAMES.length)];
    const units = Math.floor(Math.random() * 181) + 120; // 120-300 units
    const rate = 6; // ₹6/unit
    const totalAmount = units * rate;
    const currentDate = new Date();
    const billingMonth = format(currentDate, 'MMMM yyyy');
    const dueDate = format(new Date(currentDate.getTime() + 15 * 24 * 60 * 60 * 1000), 'dd MMM yyyy');
    
    // Generate realistic meter number
    const meterNumber = `MR${Math.floor(Math.random() * 9000000) + 1000000}`;

    setDemoBill({
      provider: ELECTRICITY_PROVIDERS.find(p => p.value === provider)?.label || provider,
      consumerName: randomName,
      consumerNumber: consumerNumber,
      billingMonth: billingMonth,
      meterNumber: meterNumber,
      unitsConsumed: units,
      ratePerUnit: rate,
      totalAmount: totalAmount,
      dueDate: dueDate
    });
    setStep('bill');
  };

  const handlePayBill = async () => {
    if (!demoBill) return;

    setIsLoading(true);

    const creditSavings = creditsToUse * savingsPerCredit;
    const upiAmount = Math.max(0, demoBill.totalAmount - creditSavings);

    // Use the atomic pay_bill RPC function
    const { data, error } = await supabase.rpc('pay_bill', {
      p_bill_amount: demoBill.totalAmount,
      p_credits_to_use: creditsToUse,
      p_provider: provider,
      p_consumer_number: consumerNumber,
      p_consumer_name: demoBill.consumerName,
      p_billing_month: demoBill.billingMonth,
      p_meter_number: demoBill.meterNumber,
      p_units_consumed: demoBill.unitsConsumed
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

    // Create receipt
    setReceipt({
      receiptId: data[0].receipt_id || `RCP${Date.now()}`,
      dateTime: format(new Date(), 'dd MMM yyyy • hh:mm a'),
      provider: demoBill.provider,
      consumerName: demoBill.consumerName,
      consumerNumber: demoBill.consumerNumber,
      billingMonth: demoBill.billingMonth,
      totalBillAmount: demoBill.totalAmount,
      creditsApplied: creditsToUse,
      creditSavings: creditSavings,
      upiPaidAmount: upiAmount
    });

    // Update parent state
    onPaymentComplete(
      Number(data[0].credits_remaining),
      Number(data[0].cash_remaining)
    );
    
    setStep('receipt');
    setIsLoading(false);
    
    toast({
      title: 'Bill paid successfully!',
      description: creditSavings > 0 
        ? `You saved ₹${creditSavings} using ${creditsToUse} credits!`
        : 'Your electricity bill has been paid.'
    });
  };

  const resetPayment = () => {
    setStep('input');
    setProvider('');
    setConsumerNumber('');
    setDemoBill(null);
    setCreditsToUse(0);
    setReceipt(null);
  };

  const maxCreditsForBill = demoBill 
    ? Math.min(credits, Math.floor(demoBill.totalAmount / savingsPerCredit))
    : 0;
  const creditSavings = creditsToUse * savingsPerCredit;
  const remainingAmount = demoBill ? Math.max(0, demoBill.totalAmount - creditSavings) : 0;

  // Receipt View
  if (step === 'receipt' && receipt) {
    return (
      <Card className="border-primary/30">
        <CardHeader className="text-center bg-primary/5 rounded-t-lg">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Zap className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-xl">Electricity Bill Payment Receipt</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Receipt Details */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">Receipt ID</p>
                <p className="font-mono font-medium">{receipt.receiptId.slice(0, 8).toUpperCase()}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Date & Time</p>
                <p className="font-medium">{receipt.dateTime}</p>
              </div>
            </div>

            <div className="border-t border-b border-border py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Provider Name</span>
                <span className="font-medium">{receipt.provider}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consumer Name</span>
                <span className="font-medium">{receipt.consumerName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Consumer Number</span>
                <span className="font-mono font-medium">{receipt.consumerNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Billing Month</span>
                <span className="font-medium">{receipt.billingMonth}</span>
              </div>
            </div>

            {/* Payment Breakdown */}
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Payment Breakdown</h4>
              <div className="flex justify-between text-sm">
                <span>Total Bill Amount</span>
                <span className="font-medium">₹{receipt.totalBillAmount.toLocaleString()}</span>
              </div>
              {receipt.creditsApplied > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Credits Applied ({receipt.creditsApplied})</span>
                  <span className="font-medium">-₹{receipt.creditSavings.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-border pt-3">
                <span className="font-semibold">UPI Paid Amount</span>
                <span className="font-bold text-lg">₹{receipt.upiPaidAmount.toLocaleString()}</span>
              </div>
            </div>

            {/* Status */}
            <div className="bg-primary/10 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
              <div>
                <p className="font-semibold text-primary">✅ Paid Successfully</p>
                {receipt.creditSavings > 0 && (
                  <p className="text-sm text-muted-foreground">
                    You saved ₹{receipt.creditSavings} with solar credits!
                  </p>
                )}
              </div>
            </div>

            <p className="text-xs text-center text-muted-foreground italic">
              This is a system-generated receipt
            </p>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="w-full">
              <Download className="h-4 w-4 mr-2" />
              Download Receipt
            </Button>
            <Button className="w-full" onClick={resetPayment}>
              Back to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Bill View with Credit Selection
  if (step === 'bill' && demoBill) {
    return (
      <Card className="border-primary/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Electricity Bill
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Bill Card */}
          <div className="rounded-xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span className="font-semibold">{demoBill.provider}</span>
              </div>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                {demoBill.billingMonth}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Consumer Name</p>
                <p className="font-medium">{demoBill.consumerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Consumer Number</p>
                <p className="font-mono font-medium">{demoBill.consumerNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Meter Number</p>
                <p className="font-mono font-medium">{demoBill.meterNumber}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Units Consumed</p>
                <p className="font-medium">{demoBill.unitsConsumed} kWh</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <div>
                <p className="text-muted-foreground text-xs">Total Amount Due</p>
                <p className="text-2xl font-bold text-foreground">₹{demoBill.totalAmount.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Due Date</p>
                <p className="font-medium text-destructive">{demoBill.dueDate}</p>
              </div>
            </div>
          </div>

          {/* Apply Credits Section */}
          <div className="rounded-xl bg-muted p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <span className="font-medium">Apply Solar Credits</span>
              </div>
              <span className="text-sm text-muted-foreground">
                Available: {credits} credits
              </span>
            </div>

            {credits > 0 && maxCreditsForBill > 0 ? (
              <>
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
            ) : null}
          </div>

          {/* Payment Summary */}
          <div className="rounded-xl border border-border p-4 space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Payment Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Bill Amount</span>
                <span>₹{demoBill.totalAmount.toLocaleString()}</span>
              </div>
              {creditsToUse > 0 && (
                <div className="flex justify-between text-sm text-primary">
                  <span>Credit Discount ({creditsToUse} × ₹{savingsPerCredit})</span>
                  <span>-₹{creditSavings.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-border pt-2 flex justify-between">
                <span className="font-semibold">Remaining via UPI</span>
                <span className="font-bold text-xl">₹{remainingAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" onClick={() => setStep('input')}>
              Change Details
            </Button>
            <Button 
              onClick={handlePayBill}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : `Pay Bill ₹${remainingAmount.toLocaleString()}`}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Input View (Default)
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
        {/* Provider Selection */}
        <div className="space-y-2">
          <Label htmlFor="provider" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Electricity Provider
          </Label>
          <Select value={provider} onValueChange={setProvider}>
            <SelectTrigger id="provider">
              <SelectValue placeholder="Select your provider" />
            </SelectTrigger>
            <SelectContent>
              {ELECTRICITY_PROVIDERS.map((p) => (
                <SelectItem key={p.value} value={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Consumer Number */}
        <div className="space-y-2">
          <Label htmlFor="consumerNumber" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Consumer Number
          </Label>
          <Input
            id="consumerNumber"
            type="text"
            placeholder="Enter your consumer number"
            value={consumerNumber}
            onChange={(e) => setConsumerNumber(e.target.value)}
          />
        </div>

        {/* Fetch Bill Button */}
        <Button 
          className="w-full h-12 text-lg"
          onClick={generateDemoBill}
          disabled={!provider || !consumerNumber}
        >
          <Receipt className="h-5 w-5 mr-2" />
          Fetch Bill
        </Button>

        {(!provider || !consumerNumber) && (
          <div className="text-center py-4 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Select your provider and enter consumer number to fetch your bill</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
