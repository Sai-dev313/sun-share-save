 import { useState, useEffect } from 'react';
 import { Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
 import {
   InputOTP,
   InputOTPGroup,
   InputOTPSlot,
 } from "@/components/ui/input-otp";
 
 interface PaymentPinFlowProps {
   amount: number;
   onConfirm: () => Promise<void>;
   onCancel: () => void;
   title?: string;
   description?: string;
 }
 
 type FlowStep = 'pin' | 'processing' | 'success';
 
 export function PaymentPinFlow({ 
   amount, 
   onConfirm, 
   onCancel,
   title = 'Enter UPI PIN',
   description = 'Enter your 4-digit UPI PIN to complete the payment'
 }: PaymentPinFlowProps) {
   const [step, setStep] = useState<FlowStep>('pin');
   const [pin, setPin] = useState('');
   const [error, setError] = useState('');
 
   const handlePinComplete = async (value: string) => {
     if (value.length === 4) {
       setStep('processing');
       setError('');
       
       // Simulate processing delay
       await new Promise(resolve => setTimeout(resolve, 1500));
       
       try {
         await onConfirm();
         setStep('success');
       } catch (err) {
         setStep('pin');
         setPin('');
         setError('Payment failed. Please try again.');
       }
     }
   };
 
   useEffect(() => {
     if (pin.length === 4) {
       handlePinComplete(pin);
     }
   }, [pin]);
 
   if (step === 'success') {
     return (
       <Card className="border-primary/30">
         <CardContent className="pt-8 pb-8">
           <div className="flex flex-col items-center text-center space-y-4">
             <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-300">
               <CheckCircle2 className="h-12 w-12 text-primary" />
             </div>
             <div className="space-y-2">
               <h3 className="text-2xl font-bold text-primary">Payment Successful!</h3>
               <p className="text-muted-foreground">₹{amount.toLocaleString()} paid successfully</p>
             </div>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   if (step === 'processing') {
     return (
       <Card className="border-primary/30">
         <CardContent className="pt-8 pb-8">
           <div className="flex flex-col items-center text-center space-y-4">
             <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
               <Loader2 className="h-12 w-12 text-primary animate-spin" />
             </div>
             <div className="space-y-2">
               <h3 className="text-xl font-semibold">Processing Payment</h3>
               <p className="text-muted-foreground">Please wait while we process your payment...</p>
               <p className="text-lg font-bold">₹{amount.toLocaleString()}</p>
             </div>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="border-primary/30">
       <CardHeader className="text-center">
         <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
           <ShieldCheck className="h-8 w-8 text-primary" />
         </div>
         <CardTitle>{title}</CardTitle>
         <CardDescription>{description}</CardDescription>
       </CardHeader>
       <CardContent className="space-y-6">
         <div className="text-center">
           <p className="text-sm text-muted-foreground mb-1">Amount to pay</p>
           <p className="text-3xl font-bold text-primary">₹{amount.toLocaleString()}</p>
         </div>
 
         <div className="flex justify-center">
           <InputOTP
             maxLength={4}
             value={pin}
             onChange={setPin}
             className="gap-3"
           >
             <InputOTPGroup>
               <InputOTPSlot index={0} className="w-14 h-14 text-2xl" />
               <InputOTPSlot index={1} className="w-14 h-14 text-2xl" />
               <InputOTPSlot index={2} className="w-14 h-14 text-2xl" />
               <InputOTPSlot index={3} className="w-14 h-14 text-2xl" />
             </InputOTPGroup>
           </InputOTP>
         </div>
 
         {error && (
           <p className="text-destructive text-center text-sm">{error}</p>
         )}
 
         <p className="text-xs text-center text-muted-foreground">
           This is a simulated UPI PIN for demo purposes
         </p>
 
         <Button 
           variant="outline" 
           className="w-full"
           onClick={onCancel}
         >
           Cancel
         </Button>
       </CardContent>
     </Card>
   );
 }