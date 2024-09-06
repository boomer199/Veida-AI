import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import Loading from './loading';

const CreateConcept = ({ courseName, onClose, onConceptAdded }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isFileSelected, setIsFileSelected] = useState(false);
  const [conceptDescription, setConceptDescription] = useState('');
  const [conceptName, setConceptName] = useState('');
  const { userId } = useAuth();

  useEffect(() => {
    setIsFileSelected(file !== null);
  }, [file]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain'];

    if (selectedFile && allowedTypes.includes(selectedFile.type)) {
      setFile(selectedFile);
      setError('');
    } else {
      setError('Please select a valid file type: PDF, PNG, JPG, or TXT.');
      setFile(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsUploading(true);

    if (!file) {
      setError('Please select a file to upload');
      setIsUploading(false);
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('clerk_id', userId);
    formData.append('course_name', courseName);

  
    try {
      const extractResponse = await fetch('http://localhost:8080/api/extract_text', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || 'An error occurred while extracting text.');
      }

      const extractedData = await extractResponse.json();

      const requestBody = {
        clerk_id: userId,
        course_name: courseName,
        notes: extractedData.notes,
        flashcards: extractedData.flashcards,
        mc_questions: extractedData.mc_questions,
        concept_description: conceptDescription,
        concept_name: conceptName,
        concept_mcqs: extractedData.mc_questions,
        concept_flashcards: extractedData.flashcards,
        concept_notes: extractedData.notes,
      };

      const addConceptResponse = await fetch('http://localhost:8080/api/create_course_concept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!addConceptResponse.ok) {
        const errorData = await addConceptResponse.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to addconcept');
      }

      const responseData = await addConceptResponse.json();

      onConceptAdded();
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'An error occurred while addingconcept');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="course-create-course-overlay">
      {isUploading && <Loading />}
      <div className="course-create-course-form">
        <h2>Add to {courseName}</h2>
        <p className="form-description">Add a set to your course and our AI will generate flashcards, summary notes, and MCQs for you.</p>
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
          <div className="file-input-wrapper">
            <div className="file-input-button">Upload Concept File (PDF, PNG, JPG, TXT)</div>
            <input
              type="file"
              onChange={handleFileChange}
              required
              disabled={isUploading}
            />
          </div>
          {error && <p className="error">{error}</p>}
          <div className="course-form-buttons">
            <button type="submit" disabled={isUploading || !isFileSelected}>
              {isUploading ? 'Uploading...' : 'Upload'}
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

export default CreateConcept;
