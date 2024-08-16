"use client";

import React, { useState } from 'react';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from 'next/navigation';

const CreateCourse = ({ onCourseCreated }) => {
    const { userId } = useAuth();
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [examDate, setExamDate] = useState('');
    const [file, setFile] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const validateCourseName = (name) => {
        const invalidChars = /[.!~*'()]/;
        return !invalidChars.test(name);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateCourseName(name)) {
            setError('Please enter a valid course name without special characters: [.!~*\'()]');
            return;
        }
        if (!name || !description || !examDate) {
            setError('Please fill in all fields.');
            return;
        }
        if (!file) {
            setError('Please select a file to upload.');
            return;
        }

        setLoading(true); // Set loading state to true

        const formData = new FormData();
        formData.append('file', file);
        formData.append('clerk_id', userId);
        formData.append('course_name', name);
        formData.append('description', description);
        formData.append('exam_date', examDate);

        try {
            const extractResponse = await fetch('http://localhost:8080/api/extract_text', {
                method: 'POST',
                body: formData,
            });

            if (!extractResponse.ok) {
                const errorData = await extractResponse.json();
                setError(errorData.error || 'An error occurred while extracting text.');
                return;
            }

            const extractedData = await extractResponse.json();
            const notes = extractedData.notes || {};
            const flashcards = extractedData.flashcards || [];

            const createResponse = await fetch('http://localhost:8080/api/create_course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clerk_id: userId,
                    course_name: name,
                    description: description,
                    exam_date: examDate,
                    notes: notes,
                    flashcards: flashcards,
                }),
            });

            if (createResponse.ok) {
                onCourseCreated({
                    clerk_id: userId,
                    course_name: name,
                    description: description,
                    exam_date: examDate,
                    notes: notes,
                    flashcards: flashcards,
                });
                setName('');
                setDescription('');
                setExamDate('');
                setFile(null);
                setError('');
                router.push('/client'); // Redirect to the course list page
            } else {
                const errorData = await createResponse.json();
                setError(errorData.message || 'An error occurred while creating the course.');
            }
        } catch (err) {
            console.error('Outer error:', err);
            setError('An unexpected error occurred.');
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Course Name"
                required
<<<<<<< HEAD
=======
                disabled={loading}
>>>>>>> front-end
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Course Description"
                required
<<<<<<< HEAD
            />
            <button type="submit">Create Course</button>
=======
                disabled={loading}
            />
            <input
                type="date"
                value={examDate}
                onChange={(e) => setExamDate(e.target.value)}
                required
                disabled={loading}
            />
            <input
                type="file"
                onChange={handleFileChange}
                required
                disabled={loading}
            />
            <button type="submit" disabled={loading}>
                {loading ? 'Creating Course...' : 'Create Course'}
            </button>
>>>>>>> front-end
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
};

export default CreateCourse;