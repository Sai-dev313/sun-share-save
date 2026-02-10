 import { Info, Sun, Coins, ShoppingCart, Zap } from 'lucide-react';
 import { Card, CardContent } from '@/components/ui/card';
 
 interface DashboardInfoCardProps {
   role: 'producer' | 'consumer';
 }
 
 export function DashboardInfoCard({ role }: DashboardInfoCardProps) {
   if (role === 'producer') {
     return (
       <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
         <CardContent className="pt-4 pb-4">
           <div className="flex gap-3">
             <div className="flex-shrink-0">
               <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                 <Info className="h-5 w-5 text-primary" />
               </div>
             </div>
             <div className="space-y-2">
               <h4 className="font-semibold text-foreground">How It Works</h4>
               <ul className="text-sm text-muted-foreground space-y-1.5">
                 <li className="flex items-center gap-2">
                   <Sun className="h-4 w-4 text-primary flex-shrink-0" />
                   <span><strong>Log Energy</strong> – Record your daily solar generation & usage</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <Coins className="h-4 w-4 text-primary flex-shrink-0" />
                   <span><strong>Convert to Credits</strong> – 1 kWh sent to grid = 1 Credit</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <ShoppingCart className="h-4 w-4 text-primary flex-shrink-0" />
                   <span><strong>Sell or Use</strong> – Sell credits in marketplace or use to pay bills</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                   <span><strong>Pay Bills</strong> – 1 Credit = ₹3 savings on electricity bill</span>
                 </li>
               </ul>
             </div>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   return (
     <Card className="bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
       <CardContent className="pt-4 pb-4">
         <div className="flex gap-3">
           <div className="flex-shrink-0">
             <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
               <Info className="h-5 w-5 text-primary" />
             </div>
           </div>
           <div className="space-y-2">
             <h4 className="font-semibold text-foreground">How It Works</h4>
             <ul className="text-sm text-muted-foreground space-y-1.5">
               <li className="flex items-center gap-2">
                 <ShoppingCart className="h-4 w-4 text-primary flex-shrink-0" />
                 <span><strong>Buy Credits</strong> – Purchase solar credits from producers</span>
               </li>
               <li className="flex items-center gap-2">
                 <Zap className="h-4 w-4 text-primary flex-shrink-0" />
                 <span><strong>Pay Bills</strong> – 1 Credit = ₹3 savings on your electricity bill</span>
               </li>
               <li className="flex items-center gap-2">
                 <Coins className="h-4 w-4 text-primary flex-shrink-0" />
                 <span><strong>Save Money</strong> – The more credits you use, the more you save!</span>
               </li>
             </ul>
           </div>
         </div>
       </CardContent>
     </Card>
   );
 }