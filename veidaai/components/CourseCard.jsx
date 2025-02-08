import React from 'react';
import EditButton from './EditButton';

export default function CourseCard() {
  return (
    <div className="course-card">
        <EditButton />
        <h3 className="course-name">Course Name</h3>
        <p>Course Description...</p>
    </div>
  )
}