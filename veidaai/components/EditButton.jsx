import React, { useState, useRef, useEffect } from 'react';
import EditMenu from './EditMenu';
import './EditButton.css';

const emptyFunc = () => {};

export default function EditButton({handleEditProp=emptyFunc, handleDeleteProp=emptyFunc, handleRenameProp=emptyFunc}) {
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  
  // the edit-menu is hidden by default, until the edit-button is clicked
  useEffect(() => {
    menuRef.current.style.display = 'none';
  }, []);
  
  // hide the edit-menu
  const closeMenu = () => {
    menuRef.current.style.display = 'none';
  };

  const handleEdit = () => {
    handleEditProp();
    closeMenu();
  }

  const handleDelete = () => {
    handleDeleteProp();
    closeMenu();
  }
  
  const handleRename = () => {
    handleRenameProp();
    closeMenu();
  }

  // onClick handler for the edit-button
  const handleClick = () => {
    setShowMenu(!showMenu);

    let editButton = buttonRef.current;

    // display and position the edit-menu
    let editMenu = menuRef.current;
    editMenu.style.display = 'flex';
  };

  return (
    <>
    <button className="edit" 
      ref={buttonRef}
      onClick={handleClick}
    >
      <img 
        src="/icons/ellipses.svg"
        alt="ellipses icon"
        width="40px" 
        height="40px"
      />
    </button>
    <EditMenu
      ref={menuRef}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onRename={handleRename}
    />
    </>
  )
}