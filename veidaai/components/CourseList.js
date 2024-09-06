import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatURL } from '@/app/helpers';
import { useAuth } from "@clerk/nextjs";

const CourseList = ({ courses }) => {
  const { userId } = useAuth();
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    const checkPremiumStatus = async () => {
      const response = await fetch(`http://localhost:8080/api/check_premium_status?clerk_id=${userId}`);
      const data = await response.json();
      setIsPremium(data.premium);
    };

    if (userId) {
      checkPremiumStatus();
    }
  }, [userId]);

  return (
    <div id="courses-container">
      <span id="courses-header">
        <h2>Your Courses</h2>
      </span>
      <hr />
      <div id="courses-list">
        {courses.length > 0 ? (
          courses.map((course, i) => (
            <div key={i} className="course-item">
              <Link href={`/${formatURL(course.course_name)}`}>
                <h4 className="course">{course.course_name}</h4>
              </Link>
            </div>
          ))
        ) : (
          <div style={{ textAlign: 'center' }}>
            <h3>No courses yet</h3>
            <p>Your courses will appear here</p>
          </div>
        )}
      </div>
      {!isPremium && courses.length >= 2 && (
        <div style={{ textAlign: 'center', marginTop: '1rem' }}>
          <p>You've reached the maximum number of courses for free users.</p>
          <Link href="/premium">
            <button className="upgrade-button">Upgrade to Premium</button>
          </Link>
        </div>
      )}
    </div>
  );
};
export default CourseList;