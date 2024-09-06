"use client";

import React from "react";
import "./premium.css";

const CheckoutButton = ({ clerkId }) => {
  const handleCheckout = async () => {
    const response = await fetch('http://localhost:8080/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clerk_id: clerkId }), // Use clerk ID directly
    });

    const session = await response.json();
    if (session.url) {
      window.location.href = session.url;
    }
  };

  return (
    <button onClick={handleCheckout} className="subscribe-button">Subscribe Now</button>
  );
};

export default CheckoutButton;