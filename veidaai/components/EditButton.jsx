import React, { useState, useRef, useEffect } from 'react';
import EditMenu from './EditMenu';
import './EditButton.css';

const emptyFunc = () => {};

export default function EditButton({cancelRouting, handleEditProp=emptyFunc, handleDeleteProp=emptyFunc, handleRenameProp=emptyFunc}) {
  const [showMenu, setShowMenu] = useState(false);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  
  // the edit-menu is hidden by default, until the edit-button is clicked
  useEffect(() => {
    // menuRef.current.style.display = showMenu ? 'flex' : 'none';
    
    // close the edit-menu when the user clicks outside of it
    function handleClickOutside(event) {
      event.preventDefault();  // attempt to prevent outside click from triggering anything
      event.stopPropagation(); // attempt to prevent outside click from triggering anything
      if(menuRef.current && !menuRef.current.contains(event.target)) {
        setShowMenu(false);
      }
    }
    
    // add event listener when the edit-menu is open
    if(showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // clean up the edit-menu's event listener before attaching a new one
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    }

  }, [showMenu]);
  
  // hide the edit-menu
  const closeMenu = () => {
    setShowMenu(false);
    // menuRef.current.style.display = 'none';
  };

  const handleEdit = (event) => {
    cancelRouting(event);
    handleEditProp();
    closeMenu();
  }

  const handleDelete = (event) => {
    cancelRouting(event);
    handleDeleteProp();
    closeMenu();
  }
  
  const handleRename = (event) => {
    cancelRouting(event);
    handleRenameProp();
    closeMenu();
  }

  // onClick handler for the edit-button
  const handleClick = (event) => {
    cancelRouting(event);
    setShowMenu(!showMenu);

    let editButton = buttonRef.current;

    // display and position the edit-menu
    let editMenu = menuRef.current;
    // editMenu.style.display = 'flex';
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
    {showMenu && (
      <EditMenu
        ref={menuRef}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRename={handleRename}
      />
    )}
    </>
  )
}