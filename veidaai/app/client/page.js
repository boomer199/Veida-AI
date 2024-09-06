"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import CreateCourse from "../../components/CreateCourse";
import "./client.css";
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from "@clerk/nextjs";
import EditCourse from "../../components/EditCourse";
import { useNotification } from "../../context/NotificationContext"; // Adjust the import path as necessary
import { formatURL } from '@/app/helpers';

const ClientPage = () => {
  const { isSignedIn, userId } = useAuth();
  const { user } = useUser();
  const [courses, setCourses] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const router = useRouter();
  const [showEditForm, setShowEditForm] = useState(false);
  const [courseToEdit, setCourseToEdit] = useState(null);
  const { setHasNotification, setFlashcardsDue } = useNotification();

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSignedIn) {
      router.push('/sign-in');
    } else if (userId) {
      fetchAndSetCourses();
    }
  }, [isSignedIn, userId, router]);

  const fetchAndSetCourses = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/get_courses?clerk_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        // Remove duplicates by using a Set
        const uniqueCourses = Array.from(new Set(data.courses.map(course => course.course_name)))
          .map(course_name => data.courses.find(course => course.course_name === course_name));
        setCourses(uniqueCourses);
      } else {
        console.error('Failed to fetch courses');
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const handleCourseCreated = async (newCourse) => {
    setShowCreateForm(false);
    await fetchAndSetCourses();
    await checkFlashcardsDueToday();
  };

  const checkFlashcardsDueToday = async () => {
    try {
        const response = await fetch(`http://localhost:8080/api/get_flashcards_today?clerk_id=${userId}`);
        if (response.ok) {
            const data = await response.json();
            console.log(data);
            setHasNotification(data.flashcards.length > 0);
            setFlashcardsDue(data.flashcards.length);
        }
    } catch (error) {
        console.error('Error checking flashcards:', error);
    }
  };

  const handleCloseForm = () => {
    setShowCreateForm(false);
  };

  const handleEditCourse = (course) => {
    setCourseToEdit(course);
    setShowEditForm(true);
  };

  const handleCourseUpdated = async () => {
    setShowEditForm(false);
    await fetchAndSetCourses(); // Refresh the course list after updating a course
  };

  const handleDeleteCourse = async (courseName) => {
    if (window.confirm(`Are you sure you want to delete the course "${courseName}"?`)) {
      try {
        const response = await fetch('http://localhost:8080/api/delete_course', {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ clerk_id: userId, course_name: courseName }),
        });

        if (response.ok) {
          await fetchAndSetCourses(); // Refresh the course list
        } else {
          console.error('Failed to delete course:', response.statusText);
        }
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  if (!isSignedIn) {
    return null; // Return null to avoid rendering anything while redirecting
  }

  return (
    <div className="client-page">
      <h1>Course Dashboard</h1>
      <p className="course-dashboard-description">Click "Create New Course." Enter the course details, then upload your lecture slides, notes, text, or image files. Our AI will auto-generate flashcards, summary notes, and multiple-choice questions.</p>
      <div className="course-cards">
        <div className="course-card new-course" onClick={() => setShowCreateForm(true)}>
          <h2>Create New Course</h2>
        </div>
        {courses.length > 0 ? (
          courses.map((course, index) => (
            <div key={index} className="course-card">
              <Link href={`/${formatURL(course.course_name)}`} className="course-link">
                <h2>{course.course_name || 'Unnamed Course'}</h2>
              </Link>
              <button className="edit-course-button" onClick={() => handleEditCourse(course)}>
                <i className="fas fa-pencil-alt"></i>
              </button>
              <button
                className="delete-course-button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteCourse(course.course_name);
                }}
              >
                <i className="fas fa-trash-alt"></i>
              </button>
            </div>
          ))
        ) : (
          <p className="loading-courses">Please Create a Course.</p>
        )}
      </div>

      {showCreateForm && (
        <div className="create-course-overlay">
          {/* {loading && <Loading />} */}
          <div className="create-course-form">
            <button className="close-button" onClick={() => setShowCreateForm(false)}>×</button>
            <CreateCourse 
              onCourseCreated={handleCourseCreated} 
              onClose={handleCloseForm}
            />
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="create-course-overlay">
          {/* {loading && <Loading />} */}
          <div className="create-course-form">
            <button className="close-button" onClick={() => setShowEditForm(false)}>×</button>
            <EditCourse 
              course={courseToEdit}
              onCourseUpdated={handleCourseUpdated} 
              onClose={() => setShowEditForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientPage;