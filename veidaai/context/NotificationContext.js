"use client";

import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [hasNotification, setHasNotification] = useState(false);
    const [flashcardsDue, setFlashcardsDue] = useState(0);

    return (
        <NotificationContext.Provider value={{ hasNotification, setHasNotification, flashcardsDue, setFlashcardsDue }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => useContext(NotificationContext);