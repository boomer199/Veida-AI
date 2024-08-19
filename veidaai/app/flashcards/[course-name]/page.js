"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useParams } from 'next/navigation';
import FlashCard from '@/components/FlashCard';
import { unformatURL } from '@/app/helpers';
import './flashcards-page.css';

// const FlashcardPage = ({ courseName }) => {
function FlashcardPage() {
  const [flashcards, setFlashcards] = useState([]);
  const [reviewing, setReviewing] = useState(false);
  const [currentCard, setCurrentCard] = useState({card: null, index: null});
  const [error, setError] = useState('');
  const { userId } = useAuth();

  const params = useParams();
  const urlCourseName = params['course-name'];
  const courseName = unformatURL(urlCourseName); 

  function  handleClick_NextCard() {
    // let isLastCard = currentCard.index == (flashcards.length-1);
    let newIndex = (currentCard.index+1) % flashcards.length;
    setCurrentCard({card: flashcards[newIndex], index: newIndex});
  }

  const fetchFlashcards = async () => {
    try {
      const response = await fetch(`https://veida-ai-backend-production.up.railway.app/api/get_flashcards?clerk_id=${userId}&course_name=${courseName}`, {

        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Fetch Success! Response: ', data);
        setFlashcards(data.flashcards);
        setCurrentCard({card: data.flashcards[0], index: 0});
      } else {
        setError('Failed to fetch flashcards');
      }
    } catch (err) {
      setError('An error occurred while fetching flashcards');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchFlashcards();
    }
  }, [userId]);

  return (
    <div className="main-inline">
      <div className="center-flex-container">
        <h1 className="title">
          {reviewing ? `${courseName} Flashcard Review` : `Your Flashcards Generated for ${courseName}`}
        </h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        
        { reviewing ? (
          //reviewing
          <div id="review-container" className="center-flex-container">
            <span>
              <button id="review-button" className="basic-button" onClick={()=>setReviewing(false)}>
                End review
              </button>
              <button id="review-button" className="basic-button" onClick={()=>handleClick_NextCard()}>
                Next Card
              </button>
            </span>
            <FlashCard card={currentCard.card} />
            <p>{`Card ${currentCard.index+1}/${flashcards.length}`}</p>
          </div>
        
      ) : (
          //!reviewing
          <div>
            {flashcards.length > 0 ? (
              //flashcards loaded
              <div id="cards-available" className="center-flex-container">
                <button id="review-button" className="basic-button" onClick={()=>setReviewing(true)}>
                  Start reviewing
                </button>
              
                <div id="cards-preview">
                  {flashcards.map( card => {
                    return <FlashCard key={card.front} card={card}/>
                  })}
                </div>
              </div>

            ) : (
              //flashcards NOT loaded
              <p>No flashcards available.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default FlashcardPage;