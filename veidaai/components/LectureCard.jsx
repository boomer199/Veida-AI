import React from 'react';
import EditButton from './EditButton';

export default function LectureCard() {
  return (
    <div className="lecture-card">
      <h3 className="lecture-name">Lecture Name</h3>
      <EditButton />
      <p className="lecture-description">Lecture Description...</p>
    </div>
  )
}
