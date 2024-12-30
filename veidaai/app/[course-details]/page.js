"use client";

import { useParams, notFound } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from "@clerk/nextjs";
import CourseDetails from '../../components/CourseDetails';
import Loading from '../../components/loading';
import './details.css';
import { unformatURL } from '@/app/helpers';
import { notFound as nextNotFound } from 'next/navigation';

export default function CourseDetailsPage() {
  const { userId } = useAuth();
  const params = useParams();
  const [isLoading, setIsLoading] = useState(true);

  const urlCourseName = params['course-details'];
  const courseName = unformatURL(urlCourseName);

  useEffect(() => {
    let isMounted = true;

    const checkPageExists = async () => {
      try {
        const response = await fetch(`http://localhost:8080/api/get_courses?clerk_id=${userId}`);
        if (response.ok) {
          const data = await response.json();
          const exists = data.courses.some(course => course.course_name.toLowerCase() === courseName.toLowerCase());
          if (isMounted) {
            if (!exists) {
              nextNotFound();
            }
          }
        } else {
          if (isMounted) {
            nextNotFound();
          }
        }
      } catch (error) {
        if (isMounted) {
          nextNotFound();
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    if (userId) {
      checkPageExists();
    }

    return () => {
      isMounted = false;
    };
  }, [courseName, userId]);

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div id="course-page">
      <CourseDetails courseName={courseName} />
    </div>
  );
}