"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs";
import { useParams, useRouter } from 'next/navigation';
import { unformatURL } from '@/app/helpers';
import { FaArrowLeft } from 'react-icons/fa';
import './mcqs-page.css';
import katex from 'katex';
import 'katex/dist/katex.min.css';

function McqsPage() {
    const { userId } = useAuth();
    const [mcqs, setMcqs] = useState([]);
    const [error, setError] = useState(null);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswer, setSelectedAnswer] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const router = useRouter();

    const params = useParams();
    const urlCourseName = params['course-name'];
    const courseName = unformatURL(urlCourseName);

    const fetchMcqs = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/get_mcqs?clerk_id=${userId}&course_name=${courseName}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                setMcqs(data.mcqs);
            } else {
                setError('Failed to fetch MCQs');
            }
        } catch (error) {
            setError('Failed to fetch MCQs');
        }
    };

    const fetchPremiumStatus = async () => {
        try {
            const response = await fetch(`http://localhost:8080/api/check_premium_status?clerk_id=${userId}`);
            if (response.ok) {
                const data = await response.json();
                setIsPremium(data.isPremium);
            }
        } catch (error) {
            console.error('Error fetching premium status:', error);
        }
    };

    useEffect(() => {
        if (userId) {
            fetchMcqs();
            fetchPremiumStatus();
        }
    }, [userId, courseName]);

    const handleAnswerSelect = (index) => {
        if (!submitted) {
            setSelectedAnswer(index);
        }
    };

    const handleSubmit = () => {
        setSubmitted(true);
    };

    const handleNextQuestion = () => {
        if (currentQuestionIndex < mcqs.length - 1) {
            setCurrentQuestionIndex((prevIndex) => prevIndex + 1);
            setSelectedAnswer(null);
            setSubmitted(false);
        } else {
            handleEndSession();
        }
    };

    const handleEndSession = () => {
        if (!isPremium && currentQuestionIndex >= 2) { // 0-based index, so 2 is the 3rd question
            alert("You have reached your limit on the number of MCQs you can create/study. Upgrade to premium for unlimited access to creating MCQs!");
        }
        router.push(`/${urlCourseName}`);
    };

    const convertMath = (text) => {
        if (typeof text !== 'string') return '';
    
        return text
            .replace(/\\\[(.*?)\\\]/gs, '$$ $1 $$')
            .replace(/\\\((.*?)\\\)/g, '$ $1 $')
            .replace(/\\{2}(.*?)\\{2}/g, '$$$$ $1 $$$$')
            .replace(/\$\$ +([^$]+) +\$\$/g, '$$ $1 $$') 
            .replace(/\$ +([^$]+) +\$/g, '$ $1 $')     
            .replace(/(?<!\$)\b([A-Za-z_]+\s*=\s*[^,\s]+)/g, '$$$1$$')
            .replace(/(?<!\$)\b(KE_{avg}|\\frac|\\cdot|R|T)\b(?!\$)/g, '$$$1$$')
            .replace(/\s+/g, ' ')              
            .trim();    
    };

    const parseTextWithLatex = (text) => {
        if (!text) return null;    
    
        const convertedText = convertMath(text);
    
        const parts = convertedText.split(/(\$\$.*?\$\$|\$.*?\$)/g).filter(Boolean);
    
        return parts.map((part, index) => {
            if (part.startsWith('$$') && part.endsWith('$$')) {
                return (
                    <div key={index} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(2, -2).trim(), { displayMode: true, throwOnError: false }) }} />
                );
            } else if (part.startsWith('$') && part.endsWith('$')) {
                return (
                    <span key={index} dangerouslySetInnerHTML={{ __html: katex.renderToString(part.slice(1, -1).trim(), { throwOnError: false }) }} />
                );
            }
            return <span key={index}>{part}</span>;
        });
    };
    

    const currentQuestion = mcqs[currentQuestionIndex];
    const isCorrect = currentQuestion && selectedAnswer !== null && selectedAnswer === currentQuestion.correct_answer_index;

    return (
        <div className="mcqs-container">
            <Link href={`/${urlCourseName}`} title={`back to ${courseName}`} className="back-arrow-link"><FaArrowLeft/></Link>
            <h1 className="mcqs-header">Your MCQs for {courseName}</h1>
            {error && <p className="error-message">{error}</p>}
            <div className="question-container">
                {mcqs.length > 0 ? (
                    <div>
                        <h3 className="question-concept">{parseTextWithLatex(currentQuestion.concept)}</h3>
                        <p className="question-text"><b>{parseTextWithLatex(currentQuestion.question)}</b></p>
                        <div className="answers-grid">
                            {currentQuestion.possible_answers.map((answer, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleAnswerSelect(index)}
                                    className={`answer-button ${selectedAnswer === index ? 'selected' : ''}`}
                                    style={{
                                        backgroundColor: submitted
                                            ? index === currentQuestion.correct_answer_index
                                                ? 'green'
                                                : index === selectedAnswer
                                                    ? 'red'
                                                    : 'white'
                                            : selectedAnswer === index
                                                ? '#a9a9a9'
                                                : 'white',
                                        color: 'black'
                                    }}
                                    disabled={submitted}
                                >
                                    {String.fromCharCode(97 + index)}. {parseTextWithLatex(answer)}
                                </button>
                            ))}
                        </div>
                        {!submitted ? (
                            <button onClick={handleSubmit} className="submit-button">Submit</button>
                        ) : (
                            <div>
                                {isCorrect ? (
                                    <p className="feedback-message correct-answer">Congrats! You got it right.</p>
                                ) : (
                                    <p className="feedback-message incorrect-answer">Sorry, that's incorrect.</p>
                                )}
                                <p className="answer-description"><b>Answer: {parseTextWithLatex(currentQuestion.possible_answers[currentQuestion.correct_answer_index])}</b></p>
                                <p className="answer-description">{parseTextWithLatex(currentQuestion.why)}</p>
                                {currentQuestionIndex < mcqs.length - 1 ? (
                                    <button onClick={handleNextQuestion} className="next-button">Next Question</button>
                                ) : (
                                    <button onClick={handleEndSession} className="end-session-button">End Session</button>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <p>No MCQs available.</p>
                )}
            </div>
        </div>
    );
}

export default McqsPage;
