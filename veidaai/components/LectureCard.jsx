import React from 'react';
import EditButton from './EditButton';

export default function LectureCard({name, descr}) {
  return (
    <div className="lecture-card">
      <h3 className="lecture-name">{name}</h3>
      <EditButton />
      <p className="lecture-description">{descr}</p>  
    </div>
  )
}
