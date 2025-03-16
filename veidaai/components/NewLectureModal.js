import React from 'react';
import './Modal.css';

// made from copy of NewCourseModal.js
export default function NewLectureModal({onLectureCreated, onClose}) {
  return (
    <div className="modal-container">
      
      <button className="x" onClick={onClose}>
        <img src="./icons/x.svg" alt="Close"></img>
      </button>
      
      <h2 className="modal-title">Add New Lecture</h2>
      <p className="modal-subtitle">Enter the lecture title and an description. You can upload materials for this lecture after saving.</p>
      
      <form className="modal-form" onSubmit={onLectureCreated}>
        <label htmlFor="name">Lecture Title*</label>
        <input type="text" id="name" name="name" placeholder='E.G., "Cognitive Development in Childhood"'></input>
        
        <label htmlFor="descr">Course Description*</label>
        <textarea id="descr" name="descr" rows="3" placeholder='E.G., "Exploring Piaget’s stages of cognitive development and their implications."'></textarea>
        
        <div className="modal-button-row">
          <input type="button" value="Cancel" onClick={onClose}></input>
          <input type="submit" value="Next"></input>
        </div>
      </form>

    </div>
  )
}

