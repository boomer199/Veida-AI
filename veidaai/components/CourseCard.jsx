import React from 'react';
import Link from 'next/link';
import { formatURL } from '@/app/helpers';
import EditButton from './EditButton';
import './CourseCard.css';

export default function CourseCard({name, descr, onEdit, onDelete}) {

  // prevents the <Link> routing
  const cancelRouting = (event) => {
    event.preventDefault();
    // event.stopPropagation();
  }
  
  return (
    <Link href={`/${formatURL(name)}`} className="course-link">
    <div className="course-card">
      <EditButton cancelRouting={cancelRouting} handleEditProp={onEdit} handleDeleteProp={onDelete}/>
      <h3 className="course-name">{name}</h3>
      <p className="course-descr">{descr}</p>
    </div>
    </Link>
  )
}