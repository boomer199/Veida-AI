import React from 'react';
import './Modal.css';

export default function NewCourseModal({onCourseCreated, onClose}) {
  return (
    <div className="modal-container">
      
      <button className="x" onClick={onClose}>
        <img src="./icons/x.svg" alt="Close"></img>
      </button>
      
      <h2 className="modal-title">Create New Course</h2>
      <p className="modal-subtitle">Provide the course name and a brief description to get started. You can update these details later if needed</p>
      
      <form className="modal-form" onSubmit={onCourseCreated}>
        <label htmlFor="name">Course Name*</label>
        <input type="text" id="name" name="name" placeholder='E.G., "Introduction to Psychology"'></input>
        
        <label htmlFor="descr">Course Description*</label>
        <textarea id="descr" name="descr" rows="3" placeholder='E.G., "An Introductory Course Exploring Key Psychological Theories and Concepts"'></textarea>
        
        <div className="modal-button-row">
          <input type="button" value="Cancel" onClick={onClose}></input>
          <input type="submit" value="Confirm"></input>
        </div>
      </form>

    </div>
  )
}

