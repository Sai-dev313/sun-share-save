import { useState, useEffect } from 'react';
import { ShoppingCart, Tag, User as UserIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  credits: number;
  cash: number;
}

interface Listing {
  id: string;
  credits_available: number;
  price_per_credit: number;
  is_own: boolean;
}

export default function Marketplace() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile>({ credits: 0, cash: 5000 });
  const [listings, setListings] = useState<Listing[]>([]);
  const [creditsToSell, setCreditsToSell] = useState('');
  const [pricePerCredit, setPricePerCredit] = useState('0.85');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;

    // Fetch profile
    const { data: profileData } = await supabase
      .from('profiles')
      .select('credits, cash')
      .eq('id', user.id)
      .maybeSingle();

    if (profileData) {
      setProfile({
        credits: Number(profileData.credits) || 0,
        cash: Number(profileData.cash) || 5000
      });
    }

    // Fetch listings from public view (no seller_id exposed)
    const { data: listingsData } = await supabase
      .from('marketplace_listings_public')
      .select('id, credits_available, price_per_credit')
      .order('created_at', { ascending: false });

    if (listingsData) {
      // Check which listings belong to current user
      const listingsWithOwnership = await Promise.all(
        listingsData.map(async (l) => {
          const { data: isOwn } = await supabase.rpc('is_own_listing', { p_listing_id: l.id });
          return {
            id: l.id,
            credits_available: Number(l.credits_available),
            price_per_credit: Number(l.price_per_credit),
            is_own: isOwn || false
          };
        })
      );
      
      setListings(listingsWithOwnership);
    }
  };

  const handleListCredits = async () => {
    if (!user) return;

    const credits = parseFloat(creditsToSell);
    const price = parseFloat(pricePerCredit);

    if (!credits || credits <= 0 || credits > profile.credits) {
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

    // Use atomic RPC function - auth.uid() used server-side
    const { data, error } = await supabase.rpc('create_listing', {
      p_credits: credits,
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

    setProfile(prev => ({ ...prev, credits: prev.credits - credits }));
    setCreditsToSell('');
    await fetchData();
    setIsLoading(false);

    toast({
      title: 'Listed!',
      description: `${credits} credits listed at ₹${price} each`
    });
  };

  const handleBuy = async (listing: Listing) => {
    if (!user) return;
    if (listing.is_own) {
      toast({
        variant: 'destructive',
        title: 'Cannot buy own listing',
        description: 'You cannot buy your own credits'
      });
      return;
    }

    const totalCost = listing.credits_available * listing.price_per_credit;
    if (totalCost > profile.cash) {
      toast({
        variant: 'destructive',
        title: 'Insufficient funds',
        description: 'You do not have enough cash'
      });
      return;
    }

    setIsLoading(true);

    // Use atomic RPC function - auth.uid() used server-side
    const { data, error } = await supabase.rpc('purchase_listing', {
      p_listing_id: listing.id
    });

    if (error || !data?.[0]?.success) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: data?.[0]?.message || error?.message || 'Failed to complete purchase'
      });
      setIsLoading(false);
      return;
    }

    setProfile(prev => ({
      credits: prev.credits + listing.credits_available,
      cash: prev.cash - totalCost
    }));

    await fetchData();
    setIsLoading(false);

    toast({
      title: 'Purchase Complete!',
      description: `You bought ${listing.credits_available} credits for ₹${totalCost.toFixed(2)}`
    });
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
          <p className="text-muted-foreground mt-1">Buy and sell solar credits</p>
        </div>

        {/* Wallet Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Your Credits</p>
                  <p className="text-2xl font-bold">{profile.credits}</p>
                </div>
                <div className="p-3 bg-primary/10 rounded-lg">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Cash Balance</p>
                  <p className="text-2xl font-bold">₹{profile.cash.toLocaleString()}</p>
                </div>
                <div className="p-3 bg-secondary/30 rounded-lg">
                  <ShoppingCart className="h-6 w-6 text-secondary-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sell Credits */}
        <Card>
          <CardHeader>
            <CardTitle>List Your Credits for Sale</CardTitle>
            <CardDescription>Set your price and list credits on the marketplace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
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
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">Price per Credit (₹)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="e.g., 0.85"
                  value={pricePerCredit}
                  onChange={(e) => setPricePerCredit(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  className="w-full"
                  onClick={handleListCredits}
                  disabled={isLoading || !creditsToSell || parseFloat(creditsToSell) <= 0 || parseFloat(creditsToSell) > profile.credits}
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
          </CardContent>
        </Card>

        {/* Available Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Available Credits</CardTitle>
            <CardDescription>Browse and buy credits from other users</CardDescription>
          </CardHeader>
          <CardContent>
            {listings.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No credits available for purchase</p>
                <p className="text-sm">Check back later or list your own!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map((listing) => (
                  <div
                    key={listing.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-muted rounded-full">
                        <UserIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{listing.is_own ? 'Your Listing' : 'Available'}</p>
                        <p className="text-sm text-muted-foreground">
                          {listing.credits_available} credits at ₹{listing.price_per_credit.toFixed(2)} each
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        ₹{(listing.credits_available * listing.price_per_credit).toFixed(2)}
                      </p>
                      <Button
                        size="sm"
                        onClick={() => handleBuy(listing)}
                        disabled={isLoading || listing.is_own}
                      >
                        {listing.is_own ? 'Your Listing' : 'Buy Now'}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
