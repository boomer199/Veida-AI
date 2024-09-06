import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import Loading from './loading';

const EditConcept = ({ courseName, concept, onClose, onConceptUpdated }) => {
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [conceptDescription, setConceptDescription] = useState(concept.concept_description || '');
  const [conceptName, setConceptName] = useState(concept.concept_name || '');
  const [isFormValid, setIsFormValid] = useState(false);
  const { userId } = useAuth();

  useEffect(() => {
    // Check if the form is valid whenever the concept name or description changes
    const isUnchanged =
      conceptName.trim() === concept.concept_name &&
      conceptDescription.trim() === concept.concept_description;

    setIsFormValid(
      conceptName.trim() !== '' &&
      conceptDescription.trim() !== '' &&
      !isUnchanged // Ensure the form is only valid if there are changes
    );
  }, [conceptName, conceptDescription, concept]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      return; // Prevent form submission if validation fails
    }

    setIsUploading(true);

    const requestBody = {
      clerk_id: userId,
      course_name: courseName,
      original_concept_name: concept.concept_name, // Include the original concept name
      concept_name: conceptName,
      concept_description: conceptDescription,
    };

    try {
      const updateConceptResponse = await fetch('http://localhost:8080/api/update_course_concept', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!updateConceptResponse.ok) {
        const errorData = await updateConceptResponse.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to update concept');
      }

      onConceptUpdated();
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'An error occurred while updating the concept');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="course-create-course-overlay">
      {isUploading && <Loading />}
      <div className="course-create-course-form">
        <h2>Edit {conceptName}</h2>
        <form onSubmit={handleSubmit}>
          <div>
            <label htmlFor="conceptName">Concept Name:</label>
            <input
              type="text"
              id="conceptName"
              value={conceptName}
              onChange={(e) => setConceptName(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="conceptDescription">Concept Description:</label>
            <textarea
              id="conceptDescription"
              value={conceptDescription}
              onChange={(e) => setConceptDescription(e.target.value)}
              required
            />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="course-form-buttons">
            <button type="submit" disabled={isUploading || !isFormValid}>
              {isUploading ? 'Uploading...' : 'Update'}
            </button>
            <button type="button" onClick={onClose} disabled={isUploading}>
              Cancel
            </button>
          </div>
        </form>
        <button className="course-close-button" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default EditConcept;
