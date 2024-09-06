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
import "../../../components/course-details.css"

import AddContent from '../../../components/AddContent';



const ConceptDetailsPage = () => {
  const { userId } = useAuth();
  const params = useParams();
  const [showAddContent, setShowAddContent] = useState(false);
  const [pageExists, setPageExists] = useState(null);
  const [isLoading, setIsLoading] = useState(true);


  // Access the dynamic route parameter
  const urlConceptName = params.conceptName;
  
  // Access the query parameter from the URL
  const courseName = useSearchParams().get('courseName');

  
  const conceptName = unformatURL(urlConceptName);

  useEffect(() => {
    let isMounted = true;
  
    const checkPageExists = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/get_courses?clerk_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const exists = data.courses.some(course => {
            return course.course_name.toLowerCase() === conceptName.toLowerCase();
          });
          if (isMounted) {
            setPageExists(true);
            setIsLoading(false);
          }
        } else {
          if (isMounted) {
            setPageExists(false);
            setIsLoading(false);
          }
        }
      } catch (error) {
        if (isMounted) {
          setPageExists(false);
          setIsLoading(false);
        }
      }
    };
  
    if (userId) {
      checkPageExists();
    }
  
    return () => {
      isMounted = false;
    };
  }, [conceptName, userId]);

  const handleAddContent = () => {
    setShowAddContent(true);
  };

  const handleContentAdded = () => {
    fetchCourseObj(); // Refresh the course data after adding content
  };

  if (isLoading) {
    return <Loading />;
  }
  
  if (pageExists === false) {
    return <NotFound />;
  }
  
  if (pageExists === null) {
    return (
      <div className="course-container">
        <h1 className="course-title">404</h1>
        <h2 className="course-subtitle">Page Not Found</h2>
        <p className="course-message">The resource you are looking for does not exist.</p>
        <button onClick={() => window.location.href = '/'} className="course-returnButton">Return Home</button>
      </div>
    );
  }

  return (

  <div className= "concept-details-container">
    <Link href={`/${formatURL(courseName)}`} title={'back to your courses'} className="course-back-arrow-link"><FaArrowLeft/></Link>
      <div id="concept-page">

          <h2 className="concept-title">{courseName}: {conceptName}</h2>
          {/*courseObj.exam_date && (
            <p className="course-exam-date">Exam Date: {formatDate(courseObj.exam_date)}</p>
          )*/}
          {/*courseObj.description && (
            <p className="course-description">{courseObj.description}</p>
          )*/}

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

          { showAddContent && <AddContent
            courseName={conceptName}
            onClose={() => setShowAddContent(false)}
            onContentAdded={handleContentAdded}
          />}
        </div>
    </div>
  
    
  );
}
export default ConceptDetailsPage;
