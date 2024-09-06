import React from 'react';
import './loading.css'; // Import the CSS for loading styles

const Loading = () => {
    return (
        <div className="loading-overlay">
            <div className="loading-spinner"></div>
        </div>
    );
};

export default Loading;