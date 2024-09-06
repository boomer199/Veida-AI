import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";
import Loading from './loading';

const AddContent = ({ courseName, onClose, onContentAdded }) => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isFileSelected, setIsFileSelected] = useState(false);
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
      const extractResponse = await fetch('https://veida-ai-backend-production.up.railway.app/api/extract_text', {
        method: 'POST',
        body: formData,
      });

      if (!extractResponse.ok) {
        const errorData = await extractResponse.json();
        throw new Error(errorData.error || 'An error occurred while extracting text.');
      }

      const extractedData = await extractResponse.json();

      const requestBody = {
        clerk_id: userId,
        course_name: courseName,
        notes: extractedData.notes,
        flashcards: extractedData.flashcards,
      };

      const addContentResponse = await fetch('https://veida-ai-backend-production.up.railway.app/api/add_course_content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!addContentResponse.ok) {
        const errorData = await addContentResponse.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to add content');
      }

      const responseData = await addContentResponse.json();

      onContentAdded();
      onClose();
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setError(error.message || 'An error occurred while adding content');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="course-create-course-overlay">
      {isUploading && <Loading />} {/* Show loading animation */}
      <div className="course-create-course-form">
        <h2>Add to {courseName}</h2>
        <p className="form-description">Our AI will add more flashcards, summary notes, and MCQs to your existing content.</p>
        <form onSubmit={handleSubmit}>
          <div className="course-file-input-wrapper">
            <div className="file-input-button">Upload Content File (PDF, PNG, JPG, TXT)</div>
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

export default AddContent;
