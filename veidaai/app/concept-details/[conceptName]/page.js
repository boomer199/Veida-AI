"use client";

import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from "@clerk/nextjs";
import { FaRegLightbulb, FaRegStickyNote, FaRegQuestionCircle, FaArrowLeft } from 'react-icons/fa';
import NotFound from '../../not-found';
import Loading from '../../../components/loading';
import { formatURL, unformatURL } from '@/app/helpers';
import './details.css'; 
import './concept-details.css';
import "../../../components/course-details.css";

import AddContent from '../../../components/AddContent';

const ConceptDetailsPage = () => {
  const { userId } = useAuth();
  const params = useParams();
  const [showAddContent, setShowAddContent] = useState(false);
  const [pageExists, setPageExists] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [courseObj, setCourseObj] = useState(null);
  const [conceptObj, setConceptObj] = useState(null);

  const urlConceptName = params.conceptName;
  
  const courseName = useSearchParams().get('courseName');
  const conceptName = unformatURL(urlConceptName);

  // Define fetchCourseObj() to fetch the course details
  const fetchCourseObj = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/get_course?clerk_id=${userId}&course_name=${courseName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCourseObj(data.course); // Set the course object state
        
        // Find the specific concept based on concept_name
        const concept = data.course.concepts.find(c => c.concept_name.toLowerCase() === conceptName.toLowerCase());
        if (concept) {
          setConceptObj(concept); // Set the concept object state
        } else {
          setPageExists(false); // If concept not found, set pageExists to false
        }
      } else {
        console.error('Failed to fetch course.');
        setPageExists(false);
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      setPageExists(false);
    } finally {
      setIsLoading(false); // Stop loading after fetch is done
    }
  };

  useEffect(() => {
    let isMounted = true;

    const checkPageExists = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/get_courses?clerk_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const exists = data.courses.some(course => course.course_name.toLowerCase() === courseName.toLowerCase());
          if (isMounted) {
            setPageExists(exists);
          }
        } else {
          setPageExists(false);
        }
      } catch (error) {
        setPageExists(false);
      } finally {
        setIsLoading(false);
      }
    };

    if (userId) {
      checkPageExists();
      fetchCourseObj();
    }

    return () => {
      isMounted = false;
    };
  }, [courseName, conceptName, userId]);

  const handleAddContent = () => {
    setShowAddContent(true);
  };

  const handleContentAdded = () => {
    fetchCourseObj(); // Refresh the course data after adding content
  };

  if (isLoading) {
    return <Loading />;
  }

  if (pageExists === false || isLoading) {
    return <NotFound />;
  }

  return (
    <div className="concept-details-container">
      <Link href={`/${formatURL(courseName)}`} title={'back to your courses'} className="course-back-arrow-link">
        <FaArrowLeft />
      </Link>
      <div id="concept-page">
        <h2 className="concept-title">{courseName}: {conceptName}</h2>
        
        {/* Display concept description */}
        {conceptObj && conceptObj.concept_description && (
          <p className="concept-description">{conceptObj.concept_description}</p>
        )}

        <button id="add-content-btn" onClick={handleAddContent} className="concept-add-content-btn">
          <h2>Add Content</h2>
        </button>

        <div className="concept-content">
          <Link href={`/flashcards/${formatURL(conceptName)}?courseName=${courseName}`} className="concept-study-container">
            <div>
              <FaRegLightbulb className="concept-study-icon" />
              <h3>Flashcards</h3>
            </div>
            <p>Study with interactive flashcards to reinforce key concepts</p>
          </Link>
          <Link href={`/notes/${formatURL(conceptName)}?courseName=${courseName}`} className="concept-study-container">
            <div>
              <FaRegStickyNote className="concept-study-icon" />
              <h3>Notes</h3>
            </div>
            <p>Review and organize your course notes efficiently</p>
          </Link>
          <Link href={`/mcqs/${formatURL(conceptName)}?courseName=${courseName}`} className="concept-study-container">
            <div>
              <FaRegQuestionCircle className="concept-study-icon" />
              <h3>MCQs</h3>
            </div>
            <p>Test your knowledge with multiple choice questions</p>
          </Link>
        </div>

        {showAddContent && (
          <AddContent
            courseName={courseName}
            conceptName={conceptName}
            onClose={() => setShowAddContent(false)}
            onContentAdded={handleContentAdded}
          />
        )}
      </div>
    </div>
  );
};

export default ConceptDetailsPage;
