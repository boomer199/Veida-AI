"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { useAuth } from "@clerk/nextjs";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { useParams,useSearchParams } from 'next/navigation';
import { FaArrowLeft } from 'react-icons/fa';
import { jsPDF } from "jspdf";
import 'katex/dist/katex.min.css';
import './notes.css';
import html2canvas from 'html2canvas';

const NotesPage = () => {
  const { userId } = useAuth();
  const [notes, setNotes] = useState(null);
  const [parsedNotes, setParsedNotes] = useState('');
  const [error, setError] = useState('');
  const params = useParams();





  function unformatConceptName(urlConceptName) {
    let decoded = decodeURIComponent(urlConceptName);
    let unhyphenated = decoded.replace(/-/g, ' ');
    return unhyphenated.trim();
  }
 
  const courseName = useSearchParams().get('courseName');
  const urlConceptName = params.conceptName;
  const decodedConceptName = unformatConceptName(urlConceptName);


  const fetchNotes = async () => {
    try {
      const response = await fetch(`http://localhost:8080/api/get_courses?clerk_id=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const courseIndex = data.courses.findIndex(course => courseName.localeCompare(course.course_name) === 0);
        const courseObj = data.courses[courseIndex];
        const conceptIndex = courseObj.concepts.findIndex(concept => decodedConceptName.localeCompare(concept.concept_name) === 0);
        const conceptObj = courseObj.concepts[conceptIndex];
        setNotes(conceptObj.concept_notes);
      } else {
        setError('Failed to fetch notes');
      }
    } catch (err) {
      setError('An error occurred while fetching notes');
    }
  };

  useEffect(() => {
    if (userId) {
      fetchNotes();
    }
  }, [userId]);

  const convertMath = (text) => {
    if (typeof text !== 'string') return '';
  
    return text
      .replace(/\\text{([^}]*)}/g, (fullMatch) => {
        return fullMatch.replace(/#/g, '\\#');
      })
      .replace(/\\\[(.*?)\\\]/gs, '$$ $1 $$')
      .replace(/\\\((.*?)\\\)/g, '$ $1 $')
      .replace(/\$\$ +([^$]+) +\$\$/g, '$$ $1 $$')
      .replace(/\$ +([^$]+) +\$/g, '$ $1 $');
  };
  
  useEffect(() => {
    if (notes) {
      const updatedText = convertMath(notes);
      setParsedNotes(updatedText);
    }
  }, [notes]);

  const downloadNotesPDF = async () => {
    const notesElement = document.getElementById('notes-content');
    const canvas = await html2canvas(notesElement, {
      backgroundColor: null, // Set to null to handle background manually
      scale: 1.5, // Adjust the scale for better quality and smaller file size
      useCORS: true, // Enable cross-origin resource sharing
    });
  
    // Create a new canvas with a dark background
    const newCanvas = document.createElement('canvas');
    newCanvas.width = canvas.width;
    newCanvas.height = canvas.height;
    const ctx = newCanvas.getContext('2d');
    ctx.fillStyle = '#1e1e1e'; // Set to the correct dark background color
    ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
    ctx.drawImage(canvas, 0, 0);
  
    const imgData = newCanvas.toDataURL('image/jpeg', 0.8); // Compress the image
  
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
  
    // Calculate the number of pages needed
    const pageHeight = pdf.internal.pageSize.getHeight();
    const numPages = Math.ceil(pdfHeight / pageHeight);
  
    // Add each page to the PDF
    for (let page = 1; page <= numPages; page++) {
      if (page > 1) {
        pdf.addPage();
      }
      const startHeight = (page - 1) * pageHeight;
      pdf.addImage(imgData, 'JPEG', 0, -startHeight, pdfWidth, pdfHeight);
    }
  
    pdf.save('notes.pdf');
  };

  return (
    <div className="main-inline">
      <div className="notes-container">
        <Link href={`/concept-details/${urlConceptName}?courseName=${courseName}`} title={`back to ${courseName}`} className="back-arrow-link"><FaArrowLeft /></Link>
        <h1 className="title">Your Notes for {decodedConceptName}</h1>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        <div id="notes-content" style={{ backgroundColor: '#1e1e1e', color: 'white' }}>
          {parsedNotes ? (
            <ReactMarkdown
              children={parsedNotes}
              remarkPlugins={[remarkMath]}
              rehypePlugins={[rehypeKatex]}
            />
          ) : (
            <p id="unavailable">No notes available.</p>
          )}
        </div>
        <button className="download-button" onClick={downloadNotesPDF}>Download Notes as PDF</button>
        </div>
    </div>
  );
};

export default NotesPage;