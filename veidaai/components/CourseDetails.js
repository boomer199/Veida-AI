import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs";
import { FaRegLightbulb, FaRegStickyNote, FaRegQuestionCircle, FaArrowLeft } from 'react-icons/fa';
import CreateConcept from './CreateConcept';
import EditConcept from './EditConcept';

import "./course-details.css"

const CourseDetails = ({ courseName }) => {
  const { userId } = useAuth();
  const [courseObj, setCourseObj] = useState({});
  const [showCreateConcept, setShowCreateConcept] = useState(false);
  const [courseConcepts, setCourseConcepts] = useState([]);
  const [conceptToEdit, setConceptToEdit] = useState(null);  // Track which concept to edit
  const [showEditConcept, setShowEditConcept] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchCourseObj();
    }
  }, [courseName, userId]);

  const fetchCourseObj = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/get_course_concepts?clerk_id=${userId}&course_name=${courseName}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setCourseConcepts(data.concepts);
      } else {
        console.error('Failed to fetch course.');
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
    }
  };

  const handleCreateConcept = () => {
    setShowCreateConcept(true);
  };

  const handleConceptAdded = () => {
    fetchCourseObj();  // Refresh the course data after adding a concept
  };

  const handleEditConcept = (concept) => {
    setConceptToEdit(concept);  // Set the concept to edit
    setShowEditConcept(true);
  };

  const handleConceptUpdated = () => {
    fetchCourseObj();  // Refresh the data after editing a concept
    setShowEditConcept(false);
  };

  const handleDeleteConcept = async (conceptName) => {
    if (window.confirm(`Are you sure you want to delete the concept "${conceptName}"?`)) {
      try {
        const response = await fetch('http://localhost:8080/api/delete_concept', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            clerk_id: userId,
            course_name: courseName,
            concept_name: conceptName,
          }),
        });

        if (response.ok) {
          fetchCourseObj();  // Refresh the list after deletion
        } else {
          console.error('Failed to delete concept.');
        }
      } catch (error) {
        console.error('Error deleting concept:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="course-details-container">
      <Link href={`/client`} title={'back to your courses'} className="course-back-arrow-link"><FaArrowLeft/></Link>
      <h1 className="course-title">{courseName}</h1>
      {courseObj.exam_date && <p className="course-exam-date">Exam Date: {formatDate(courseObj.exam_date)}</p>}
      {courseObj.description && <p className="course-description">{courseObj.description}</p>}

      <div className="course-cards">
        <button className="course-card new-course" onClick={handleCreateConcept}>
          <h2>Add Concept</h2>
        </button>

        {courseConcepts.length > 0 ? (
          courseConcepts.map((concept, index) => (
            <div key={index} className="course-card">
              <Link href={`/concept-details/${concept.concept_name.replace(/\s+/g, '-')}?courseName=${courseName}`} className="course-link">
                <h2>{concept.concept_name}</h2>
              </Link>
              <button className="edit-course-button" onClick={() => handleEditConcept(concept)}>
                <i className="fas fa-pencil-alt"></i>
              </button>
              <button
                className="delete-course-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteConcept(concept.concept_name);
                }}
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          ))
        ) : (
          <p>No concepts available.</p>
        )}
      </div>

      {showCreateConcept && (
        <CreateConcept
          courseName={courseName}
          onClose={() => setShowCreateConcept(false)}
          onConceptAdded={handleConceptAdded}
        />
      )}

      {showEditConcept && conceptToEdit && (
        <EditConcept
          courseName={courseName}
          concept={conceptToEdit}
          onClose={() => setShowEditConcept(false)}
          onConceptUpdated={handleConceptUpdated}
        />
      )}
    </div>
  );
};

export default CourseDetails;
