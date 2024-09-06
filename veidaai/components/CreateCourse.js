import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Loading from './loading';

const CreateCourse = ({ onCourseCreated, onClose }) => {
    const { userId } = useAuth();
    const router = useRouter();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [examDate, setExamDate] = useState("");
    const [file, setFile] = useState(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [fileName, setFileName] = useState("");
    const [isFormValid, setIsFormValid] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [courseCount, setCourseCount] = useState(0);

    // Function to get tomorrow's date in YYYY-MM-DD format
    const getTomorrowDate = () => {
        const today = new Date();
        today.setDate(today.getDate() + 1); // Add 1 day to today's date
        return today.toISOString().split("T")[0]; // Return in YYYY-MM-DD format
    };

    const tomorrow = getTomorrowDate();

    useEffect(() => {
        // Perform initial checks on page load
        const fetchPremiumStatusAndCourses = async () => {
            try {
                // Fetch the premium status
                const premiumResponse = await fetch(`http://localhost:8080/api/check_premium_status?clerk_id=${userId}`);
                if (premiumResponse.ok) {
                    const premiumData = await premiumResponse.json();
                    setIsPremium(premiumData.premium);
                } else {
                    console.error("Failed to fetch premium status.");
                }

                // Fetch the course count
                const coursesResponse = await fetch(`http://localhost:8080/api/get_courses?clerk_id=${userId}`);
                if (coursesResponse.ok) {
                    const coursesData = await coursesResponse.json();
                    setCourseCount(coursesData.courses.length);

                    // If not premium and course count is 2 or more, set an error
                    if (!isPremium && coursesData.courses.length >= 2) {
                        setError("You have reached the limit of 2 courses for free users. Upgrade to premium for unlimited courses.");
                    }
                } else {
                    console.error("Failed to fetch course count.");
                }
            } catch (error) {
                console.error("Error fetching premium status or course count:", error);
            }
        };

        if (userId) {
            fetchPremiumStatusAndCourses();
        }
    }, [userId]);

    useEffect(() => {
        // Update form validity
        setIsFormValid(
            name.trim() !== "" &&
            description.trim() !== "" &&
            examDate.trim() !== "" &&
            (isPremium || courseCount < 2)
        );
    }, [name, description, examDate, file, isPremium, courseCount]);

    const checkDuplicateCourseName = async (courseName) => {
        try {
            const response = await fetch(`http://localhost:8080/api/get_courses?clerk_id=${userId}`);
            if (response.ok) {
                const data = await response.json();
                return data.courses.some(
                    (course) => course.course_name.toLowerCase() === courseName.toLowerCase()
                );
            } else {
                console.error("Failed to fetch courses for duplicate check.");
                return false;
            }
        } catch (error) {
            console.error("Error checking for duplicate course name:", error);
            return false;
        }
    };

    const validateCourseName = (courseName) => {
        // Disallow special characters: [.!~*'()]
        const invalidChars = /[.!~*'()]/;
        return !invalidChars.test(courseName);
    };

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        setFile(selectedFile);
        setFileName(selectedFile ? selectedFile.name : "");
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(""); // Reset error message
        setLoading(true); // Set loading to true when submitting

        if (!isPremium && courseCount >= 2) {
            setError("You have reached the limit of 2 courses for free users. Upgrade to premium for unlimited courses.");
            setLoading(false); // Reset loading state
            return;
        }

        if (!validateCourseName(name)) {
            setError("Course name contains invalid characters. Please avoid using [ . ! ~ * ' ( ) ]");
            setLoading(false); // Reset loading state
            return;
        }

        const isDuplicate = await checkDuplicateCourseName(name);
        if (isDuplicate) {
            setError("A course with this name already exists. Please choose a different name.");
            setLoading(false); // Reset loading state
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("clerk_id", userId);
        formData.append("course_name", name);
        formData.append("description", description);
        formData.append("exam_date", examDate);

        try {

            const createResponse = await fetch("http://localhost:8080/api/create_course", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    clerk_id: userId,
                    course_name: name,
                    description,
                    exam_date: examDate,
                }),
            });

            if (createResponse.ok) {
                onCourseCreated({
                    clerk_id: userId,
                    course_name: name,
                    description,
                    exam_date: examDate,
                });
                setName("");
                setDescription("");
                setExamDate("");
                setFile(null);
                setFileName("");
                setError("");
                router.push("/client"); // Redirect to course list page
            } else {
                const errorData = await createResponse.json();
                setError(errorData.message || "An error occurred while creating the course.");
            }
        } catch (err) {
            console.error("Error:", err);
            setError("An unexpected error occurred. Please try again later.");
        } finally {
            setLoading(false); // Reset loading state
        }
    };

    return (
        <div className="create-course-overlay">
            {loading && <Loading />} {/* Show loading animation */}
            <form onSubmit={handleSubmit} className="create-course-form">
                <h2>Create a New Course</h2>
                <label htmlFor="course-name-input">Course Name</label>
                <input
                    id="course-name-input"
                    type="text"
                    placeholder="e.g. ASTR 113 Intro to Cosmology"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                />
                <label htmlFor="course-description-input">Course Description</label>
                <textarea
                    id="course-description-input"
                    placeholder="e.g. Physical examination of our evolving universe: the Big Bang... "
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />
                <label htmlFor="date-input" className="for-date">Exam Date</label>
                <input
                    id="date-input"
                    type="date"
                    value={examDate}
                    onChange={(e) => setExamDate(e.target.value)}
                    required
                    min={tomorrow} // Disable dates before tomorrow
                />
                
                {error && <p className="error">{error}</p>}
                <div className="form-buttons">
                    <button type="submit" disabled={!isFormValid || loading}>
                        {loading ? "Submitting..." : "Submit"}
                    </button>
                    <button type="button" onClick={onClose}>
                        Cancel
                    </button>
                </div>
                <button className="close-button" onClick={onClose}>
                    ×
                </button>
            </form>
        </div>
    );
};

export default CreateCourse;