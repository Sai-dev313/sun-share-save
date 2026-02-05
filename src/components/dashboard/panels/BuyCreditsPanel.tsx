import { useState, useEffect } from 'react';
import { ShoppingCart, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';
import { PaymentPinFlow } from '@/components/PaymentPinFlow';

interface Listing {
  id: string;
  credits_available: number;
  price_per_credit: number;
}

interface BuyCreditsPanelProps {
  cash: number;
  onPurchaseComplete: (creditsGained: number, cashSpent: number) => void;
}

export function BuyCreditsPanel({ cash, onPurchaseComplete }: BuyCreditsPanelProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [showPinFlow, setShowPinFlow] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    const { data } = await supabase
      .from('marketplace_listings')
      .select('id, credits_available, price_per_credit')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) {
      // Filter out own listings using RPC
      const listingsWithOwnership = await Promise.all(
        data.map(async (l) => {
          const { data: isOwn } = await supabase.rpc('is_own_listing', { p_listing_id: l.id });
          return isOwn ? null : l;
        })
      );
      
      setListings(listingsWithOwnership.filter((l): l is Listing => l !== null));
    }
  };

  const handleBuyClick = (listing: Listing) => {
    const totalCost = listing.credits_available * listing.price_per_credit;
    
    if (totalCost > cash) {
      toast({
        variant: 'destructive',
        title: 'Insufficient funds',
        description: 'You do not have enough cash for this purchase'
      });
      return;
    }

    setSelectedListing(listing);
    setShowPinFlow(true);
  };

  const processPurchase = async () => {
    if (!selectedListing) return;

    const { data, error } = await supabase.rpc('purchase_listing', {
      p_listing_id: selectedListing.id
    });

    if (error || !data?.[0]?.success) {
      throw new Error(data?.[0]?.message || error?.message || 'Failed to complete purchase');
    }

    const totalCost = selectedListing.credits_available * selectedListing.price_per_credit;
    onPurchaseComplete(selectedListing.credits_available, totalCost);
    await fetchListings();

    toast({
      title: 'Purchase Complete!',
      description: `You bought ${selectedListing.credits_available} credits for ₹${totalCost.toFixed(2)}`
    });
  };

  if (showPinFlow && selectedListing) {
    const totalCost = selectedListing.credits_available * selectedListing.price_per_credit;
    return (
      <PaymentPinFlow
        amount={totalCost}
        onConfirm={async () => {
          await processPurchase();
          setShowPinFlow(false);
          setSelectedListing(null);
        }}
        onCancel={() => {
          setShowPinFlow(false);
          setSelectedListing(null);
        }}
        title="Enter UPI PIN"
        description={`Buy ${selectedListing.credits_available} credits`}
      />
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          Buy Credits
        </CardTitle>
        <CardDescription>Purchase credits from producers to save on your bills</CardDescription>
      </CardHeader>
      <CardContent>
        {listings.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No credits available for purchase</p>
            <p className="text-sm">Check back later when producers list their credits!</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your cash balance: <span className="font-semibold">₹{cash.toLocaleString()}</span>
            </p>
            {listings.map((listing) => {
              const totalCost = listing.credits_available * listing.price_per_credit;
              const canAfford = totalCost <= cash;
              
              return (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-full">
                      <UserIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold">{listing.credits_available} credits available</p>
                      <p className="text-sm text-muted-foreground">
                        @ ₹{listing.price_per_credit.toFixed(2)} each
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">
                      ₹{totalCost.toFixed(2)}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => handleBuyClick(listing)}
                      disabled={isLoading || !canAfford}
                    >
                      {canAfford ? 'Buy Now' : 'Insufficient Funds'}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
