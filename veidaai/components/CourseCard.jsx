import React from 'react';
import EditButton from './EditButton';
import './CourseCard.css';

export default function CourseCard({name, descr}) {
  return (
    <div className="course-card">
      <EditButton />
      <h3 className="course-name">{name}</h3>
      <p>{descr}</p>
    </div>
  )
}