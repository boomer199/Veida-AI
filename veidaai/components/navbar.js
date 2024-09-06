"use client"; // Ensure this component is treated as a client component

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation'; // Use the correct import for Next.js 13+
import Image from 'next/image';
import { FaBell } from 'react-icons/fa';
import { UserButton } from '@clerk/nextjs';
import './navbar.css';
import { useAuth } from '@clerk/nextjs';
import { useNotification } from '../context/NotificationContext';

export default function Navbar() {
    const { userId } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const { hasNotification, flashcardsDue, setHasNotification, setFlashcardsDue } = useNotification();
    const router = useRouter();

    const handleLogoClick = () => {
        router.push('/'); // Redirect to the home page
    };
    const toggleMenu = () => setIsOpen(!isOpen);
    const closeMenu = () => setIsOpen(false);

    useEffect(() => {
        if (!userId) closeMenu();
    }, [userId]);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        handleResize(); 
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, []);

    useEffect(() => {
        if (userId) {
            const checkFlashcards = async () => {
                try {
                    const response = await fetch(`http://localhost:8080/api/get_flashcards_today?clerk_id=${userId}`);
                    if (response.ok) {
                        const data = await response.json();
                        setHasNotification(data.flashcards.length > 0);
                        setFlashcardsDue(data.flashcards.length);
                    }
                } catch (error) {
                    console.error('Error checking flashcards:', error);
                }
            };
            checkFlashcards();
        }
    }, [userId]);

    return (
        <div className="Navbar">
            <div className="links">
                <div className="left">
                    <Image
                        src="/veida-logo-wide-no-pad.png"
                        alt="VeidaAI Logo"
                        width={100}
                        height={40}
                        onClick={handleLogoClick} // Use the router to navigate
                        style={{ cursor: 'pointer' }} // Change cursor to pointer
                    />
                </div>
                {isMobile && (
                    <div className="right-group">
                        <div id="burger-user" className="userButton-group">
                            <div>
                                <div className="notification-bell">
                                    <FaBell className={hasNotification ? 'has-notification' : ''} />
                                    <div className="tooltip">
                                        <Link href="/review-all-flashcards" onClick={closeMenu} style={{ color: "white", textDecoration: "none" }}>
                                            {flashcardsDue} flashcard{flashcardsDue !== 1 ? 's' : ''} due today
                                        </Link>
                                    </div>
                                </div>
                            </div>
                            <div className="userButton">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </div>
                        <div className="hamburger" onClick={toggleMenu}>
                            <div className={isOpen ? "line open" : "line"}></div>
                            <div className={isOpen ? "line open" : "line"}></div>
                            <div className={isOpen ? "line open" : "line"}></div>
                        </div>
                    </div>
                )}
                <div className={isOpen ? "right open" : "right"}>
                    <Link href="/about" onClick={closeMenu}><span>ABOUT</span></Link>
                    <Link href="https://docs.google.com/forms/d/e/1FAIpQLSfstQu5HHkMr-8Q4GDFbivQKxlhrE5XzxrD1eMj_Ne87YDe6Q/viewform" target="_BLANK" onClick={closeMenu}><span>SURVEY</span></Link>
                    {!userId ? (
                        <>
                            <Link href="/sign-in">
                                <button className="login-button" onClick={closeMenu}>LOGIN</button>
                            </Link>
                            <Link href="/sign-up">
                                <button className="signup-button" onClick={closeMenu}>SIGN UP</button>
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link href="/client" onClick={closeMenu}><span>COURSES</span></Link>
                            <Link href="/premium">
                                <button className="premium-button" onClick={closeMenu}>PREMIUM</button>
                            </Link>
                            {!isMobile && (
                                <div className="userButton-group">
                                    <Link href="/review-all-flashcards" onClick={closeMenu}>
                                        <div className="notification-bell">
                                            <FaBell className={hasNotification ? 'has-notification' : ''} />
                                            <div className="tooltip">
                                                {flashcardsDue} flashcard{flashcardsDue !== 1 ? 's' : ''} due today
                                            </div>
                                        </div>
                                    </Link>
                                    <div className="userButton">
                                        <UserButton afterSignOutUrl="/" />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}