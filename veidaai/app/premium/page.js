"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
import CheckoutButton from './checkoutbutton';
import CancelButton from './cancelbutton';
import './premium.css';

const PremiumPage = () => {
  const { userId, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [isPremium, setIsPremium] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/sign-in');
    } else if (userId) {
      fetchPremiumStatus();
    }
  }, [isLoaded, isSignedIn, userId, router]);

  const fetchPremiumStatus = async () => {
    try {
        const response = await fetch(`http://localhost:8080/api/check_premium_status?clerk_id=${userId}`);
        if (response.ok) {
            const data = await response.json();
            setIsPremium(data.premium);
        }
    } catch (error) {
        console.error('Error fetching premium status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isPremium) {
    return (
      <div className="premium-page">
        <h1 className="premium-title">Cancel Premium Subscription</h1>
        <p className="premium-description">
          You are currently subscribed to the premium plan. Warning, clicking the following button will cancel the subscription TODAY, and you will not have access to premium features.
        </p>
        <CancelButton clerkId={userId} className="cancel-button" />
      </div>
    );
  } else {
    return (
      <div className="premium-page">
        <h1 className="premium-title">Premium Access</h1>
        <p className="premium-description">Unlock the full potential of Veida AI with our premium subscription. Enjoy unlimited courses, unlimited multiple choice questions, advanced AI features, and priority support.</p>
        <CheckoutButton clerkId={userId} />
      </div>
    );
  }
};

export default PremiumPage;