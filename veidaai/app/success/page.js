"use client";

import './success.css';

const SuccessPage = () => {
  return (
    <div className="success-page">
      <h1 className="success-title">Subscription Successful!</h1>
      <p className="success-description">Thank you for subscribing to Premium Access.</p>
      <button onClick={() => window.location.href = '/'} className="return-button">Return Home</button>
    </div>
  );
};

export default SuccessPage;