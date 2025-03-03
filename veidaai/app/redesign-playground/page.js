"use client";

import React from 'react';
import './page.css';
import EditMenu from '../../components/EditMenu';
import CourseCard from '../../components/CourseCard';
import LectureCard from '../../components/LectureCard';

const RedesignPage = () => {
  return (
    <div  className="redesign" style={{padding: '5rem'}}>
        <h1>Redesign Test Page</h1>

        {/* Edit Menu component */}
        <EditMenu 
          onEdit={()=>alert('edit')}
          onDelete={()=>alert('delete')}
          onRename={()=>alert('rename')}
        />

        {/* Course Card component */}
        <CourseCard name='Course #1' descr="Course #1's description..."/>

        {/* Lecture Card component */}
        <LectureCard name="Lecture #1" descr="Lecture #1's description..."/>

    </div>
  );
};

export default RedesignPage;