"use client";

import React from 'react';
import CreateCourse from '../../components/CreateCourse';

const CreateCoursePage = () => {
    const handleCourseCreated = (newCourse) => {
        // Handle the course creation logic, e.g., redirect or show a success message
    };

    return (
        <div >
            <h1>Create a New Course</h1>
            <CreateCourse onCourseCreated={handleCourseCreated} />
        </div>
    );
};

export default CreateCoursePage;