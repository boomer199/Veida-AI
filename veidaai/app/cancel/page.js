"use client";

import './cancel.css';

const CancelPage = () => {
  return (
    <div className="cancel-page">
      <h1 className="cancel-title">Purchase Canceled</h1>
      <p className="cancel-description">There has been an error or you canceled your purchase.</p>
      <button onClick={() => window.location.href = '/'} className="return-button">Return Home</button>
    </div>
  );
};

export default CancelPage;