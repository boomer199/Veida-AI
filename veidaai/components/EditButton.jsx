import React from 'react';
import EditMenu from './EditMenu';

export default function EditButton() {
  const buttonRef = useRef(null);

  return (
    <button className="edit" 
      onClick={()=>alert(buttonRef)}
      ref={buttonRef}
    >
      <img 
          src="/icons/ellipses.svg"
          alt="ellipses icon"
          width="40px" 
          height="40px"
      />
    </button>    
  )
}