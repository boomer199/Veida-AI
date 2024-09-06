"use client";

import React, { useState } from "react";
import "./premium.css";

const CancelButton = ({ clerkId }) => {
  const [confirmation, setConfirmation] = useState("");

  const handleCancel = async () => {
    if (confirmation !== "cancel my subscription") {
      alert("Please type the confirmation text correctly.");
      return;
    }

    try {
      const response = await fetch('http://localhost:8080/api/cancel-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ clerk_id: clerkId }),
      });

      if (response.ok) {
        alert("Subscription cancelled successfully");
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        alert(errorData.error || "Failed to cancel subscription.");
      }
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      alert("An error occurred while cancelling the subscription.");
    }
  };

  return (
    <div className="cancel-container">
      <p>Type &quot;cancel my subscription&quot; to confirm:</p>
      <input
        type="text"
        value={confirmation}
        onChange={(e) => setConfirmation(e.target.value)}
        className="confirmation-input"
      />
      <button onClick={handleCancel} className="cancel-button">Cancel Subscription</button>
    </div>
  );
};

export default CancelButton;