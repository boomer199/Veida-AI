import React, { useState, useEffect } from 'react';
import { useAuth } from "@clerk/nextjs";

const EditCourse = ({ course, onCourseUpdated, onClose }) => {
  const [name, setName] = useState(course.course_name);
  const [description, setDescription] = useState(course.description);
  const [examDate, setExamDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFormValid, setIsFormValid] = useState(false);
  const { userId } = useAuth();

  // Function to format the date to YYYY-MM-DD
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${year}-${month}-${day}`;
  };

  // Initialize the exam date when the component mounts
  useEffect(() => {
    if (course.exam_date) {
      setExamDate(formatDate(course.exam_date));
    }
  }, [course.exam_date]);

  // Function to get tomorrow's date in YYYY-MM-DD format for disabling past dates
  const getTomorrowDate = () => {
    const today = new Date();
    today.setDate(today.getDate() + 1); // Add 1 day to today's date
    return today.toISOString().split("T")[0]; // Return in YYYY-MM-DD format
  };

  const tomorrow = getTomorrowDate();

  useEffect(() => {
    // Check if all fields are filled and if there are changes compared to the initial state
    const isUnchanged =
      name.trim() === course.course_name &&
      description.trim() === course.description &&
      examDate.trim() === formatDate(course.exam_date);

    setIsFormValid(
      name.trim() !== '' &&
      description.trim() !== '' &&
      examDate.trim() !== '' &&
      !isUnchanged // Ensure the form is only valid if there are changes
    );
  }, [name, description, examDate, course]);

  const checkDuplicateCourseName = async (courseName) => {
    try {
      const response = await fetch(`http://localhost:8080/api/get_courses?clerk_id=${userId}`);
      if (response.ok) {
        const data = await response.json();
        return data.courses.some(
          (existingCourse) => existingCourse.course_name.toLowerCase() === courseName.toLowerCase() && existingCourse.course_name !== course.course_name
        );
      } else {
        console.error("Failed to fetch courses for duplicate check.");
        return false;
      }
    } catch (error) {
      console.error("Error checking for duplicate course name:", error);
      return false;
    }
  };

  const validateCourseName = (courseName) => {
    // Disallow special characters: [.!~*'()]
    const invalidChars = /[.!~*'()]/;
    return !invalidChars.test(courseName);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateCourseName(name)) {
      setError("Course name contains invalid characters. Please avoid using [ . ! ~ * ' ( ) ]");
      setLoading(false);
      return;
    }

    const isDuplicate = await checkDuplicateCourseName(name);
    if (isDuplicate) {
      setError("A course with this name already exists. Please choose a different name.");
      setLoading(false);
      return;
    }

    const payload = {
      clerk_id: userId,
      original_course_name: course.course_name, // Pass the original course name
      course_name: name,
      description: description,
      exam_date: examDate,
    };

    try {
      const response = await fetch('http://localhost:8080/api/update_course', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        onCourseUpdated();
        onClose();
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError(errorData.error || 'An error occurred while updating the course.');
      }
    } catch (error) {
      console.error('Error:', error);
      setError('An error occurred while updating the course.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Edit Course</h2>
      <label htmlFor="course-name-input">Course Name</label>
      <input
        id="course-name-input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Course Name"
        required
      />
      <label htmlFor="course-description-input">Course Description</label>
      <textarea
        id="course-description-input"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Course Description"
        required
      />
      <label htmlFor="date-input" className="for-date">Exam Date</label>
      <input
        id="date-input"
        type="date"
        value={examDate}
        onChange={(e) => setExamDate(e.target.value)}
        placeholder="Exam Date"
        required
        min={tomorrow} // Disable dates before tomorrow
      />
      {error && <p className="error">{error}</p>}
      <div className="form-buttons">
        <button type="submit" disabled={loading || !isFormValid}>
          {loading ? 'Updating...' : 'Update'}
        </button>
        <button type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
};

export default EditCourse;
