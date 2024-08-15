'use client';
import React, { useState } from 'react';
import { useAuth } from "@clerk/nextjs";

const CreateCourse = ({ onCourseCreated }) => {
    const { userId } = useAuth();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !description) {
            setError('Please fill in all fields.');
            return;
        }

        try {
            const response = await fetch('http://localhost:8080/api/create_course', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clerk_id: userId,
                    course_name: name,
                    description: description,
                }),
            });

            if (response.ok) {
                onCourseCreated({clerk_id: userId, course_name: name, description: description});
                setName('');
                setDescription('');
                setError('');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

        } catch (fetchError) {
            console.error('Fetch error:', fetchError);
            setError('An error occurred while communicating with the server.');
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
            />
            <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Course Description"
                required
            />
            <button type="submit">Create Course</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
};

export default CreateCourse;