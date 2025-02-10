import React, { forwardRef } from 'react'

const EditMenu = forwardRef( ({onEdit, onDelete, onRename}, ref) => {
  return (
    <div className="edit-menu" ref={ref}>
      <button className="edit-menu" onClick={onEdit}>Edit</button>
      <button className="edit-menu" onClick={onDelete}>Delete</button>
      <button className="edit-menu" onClick={onRename}>Rename</button>
    </div>
  );
});

export default EditMenu;
