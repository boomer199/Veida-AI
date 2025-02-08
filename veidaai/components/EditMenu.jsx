import React from 'react'

export default function EditMenu({editOnClick, deleteOnClick, renameOnClick}) {
  return (
    <div className="edit-menu">
        <button className="edit-menu" onClick={editOnClick}>Edit</button>
        <button className="edit-menu"onClick={deleteOnClick}>Delete</button>
        <button className="edit-menu"onClick={renameOnClick}>Rename</button>
    </div>
  )
}
