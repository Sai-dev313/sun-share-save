import { useState, useEffect } from 'react';
import { Store, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/contexts/AuthContext';

interface Listing {
  id: string;
  credits_available: number;
  price_per_credit: number;
  status: string;
  created_at: string;
}

interface ProducerMarketplacePanelProps {
  credits: number;
  onListingCreated: (creditsUsed: number) => void;
}

export function ProducerMarketplacePanel({ credits, onListingCreated }: ProducerMarketplacePanelProps) {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [creditsToSell, setCreditsToSell] = useState('');
  const [pricePerCredit, setPricePerCredit] = useState('0.85');
  const priceValue = parseFloat(pricePerCredit);
  const isPriceOutOfRange = pricePerCredit !== '' && (isNaN(priceValue) || priceValue < 0.5 || priceValue > 2.5);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyListings();
    }
  }, [user]);

  const fetchMyListings = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('marketplace_listings')
      .select('id, credits_available, price_per_credit, status, created_at')
      .eq('seller_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setMyListings(data);
    }
  };

  const handleCreateListing = async () => {
    const creditsNum = parseFloat(creditsToSell);
    const price = parseFloat(pricePerCredit);

    if (!creditsNum || creditsNum <= 0 || creditsNum > credits) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Please enter a valid number of credits'
      });
      return;
    }

    if (!price || price <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid price',
        description: 'Please enter a valid price per credit'
      });
      return;
    }

    setIsLoading(true);

    const { data, error } = await supabase.rpc('create_listing', {
      p_credits: creditsNum,
      p_price_per_credit: price
    });

    if (error || !data?.[0]?.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: data?.[0]?.message || error?.message || 'Failed to create listing'
      });
      setIsLoading(false);
      return;
    }

    onListingCreated(creditsNum);
    setCreditsToSell('');
    await fetchMyListings();
    setIsLoading(false);

    toast({
      title: 'Listed!',
      description: `${creditsNum} credits listed at ₹${price} each`
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Store className="h-5 w-5 text-primary" />
          Your Marketplace Listings
        </CardTitle>
        <CardDescription>Create and manage your credit listings</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Create New Listing */}
        <div className="rounded-lg border border-border p-4 space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create New Listing
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="sell-credits">Credits to Sell</Label>
              <Input
                id="sell-credits"
                type="number"
                placeholder="e.g., 50"
                value={creditsToSell}
                onChange={(e) => setCreditsToSell(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Available: {credits}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price">Price per Credit (₹0.50 - ₹2.50)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0.50"
                max="2.50"
                placeholder="e.g., 0.85"
                value={pricePerCredit}
                onChange={(e) => setPricePerCredit(e.target.value)}
              />
              {isPriceOutOfRange && (
                <p className="text-xs text-destructive">Price must be between ₹0.50 and ₹2.50</p>
              )}
            </div>
            <div className="flex items-end">
              <Button
                className="w-full"
                onClick={handleCreateListing}
                disabled={isLoading || !creditsToSell || parseFloat(creditsToSell) <= 0 || parseFloat(creditsToSell) > credits || isPriceOutOfRange || !pricePerCredit}
              >
                List for Sale
              </Button>
            </div>
          </div>
          {creditsToSell && pricePerCredit && (
            <p className="text-sm text-muted-foreground">
              Total value: <span className="font-semibold">₹{(parseFloat(creditsToSell) * parseFloat(pricePerCredit)).toFixed(2)}</span>
            </p>
          )}
        </div>

        {/* My Listings */}
        <div className="space-y-3">
          <h4 className="font-medium">Your Active Listings</h4>
          {myListings.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Store className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No listings yet</p>
              <p className="text-sm">Create your first listing above</p>
            </div>
          ) : (
            <div className="space-y-2">
              {myListings.map((listing) => (
                <div
                  key={listing.id}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card"
                >
                  <div>
                    <p className="font-medium">{listing.credits_available} credits</p>
                    <p className="text-sm text-muted-foreground">
                      @ ₹{listing.price_per_credit} each = ₹{(listing.credits_available * listing.price_per_credit).toFixed(2)}
                    </p>
                  </div>
                  <Badge variant={listing.status === 'active' ? 'default' : 'secondary'}>
                    {listing.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
