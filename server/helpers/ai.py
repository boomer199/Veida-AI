import os
import json
from typing import List
import openai
import datetime
from pydantic import BaseModel
from pymongo import MongoClient
from .util import parse_mc_questions
from .mongo import create_or_update_next_study_date, get_times_seen

# MongoDB setup
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client['VeidaAI']
courses_collection = db['courses']

# Groq API setup
openai_api_key = os.getenv('OPENAI_API_KEY')
openai_client = openai.OpenAI(api_key=openai_api_key)


def generate_notes(extracted_text):
    """
    Generate notes using OpenAI API.

    This function generates notes from the provided text.
    
    Args:
        extracted_text (str): The text extracted from the file.

    Returns:
        str: Generated notes.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "As the perfect consistent educator, your task is to transform the provided text into well-structured, detailed lecture notes without leaving out any subject matter."
                        "Omit all: course related information, administrative details, agendas, announcements, homework and other school related content."
                        "Ensure that every single new and relevant information, definition, term, concept, and formula related to the course are included."
                    )
                },
                {
                    "role": "user",
                    "content": extracted_text
                }
            ]
        )
        notes = response.choices[0].message.content

        # Store the generated notes in MongoDB
        # create_or_update_notes(clerk_id, course_name, notes, notes_name)

        return notes
    except Exception as e:
        print(f"Error: {e}")
        return 'Error generating notes.'



def generate_flashcards(notes):
    """
    Generate flashcards using OpenAI API.

    This function generates flashcards from the provided text.
    
    Args:
        notes (str): The summarized notes extracted from the lecture.

    Returns:
        list: Generated flashcards.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "As the perfect educator, your task is to transform the provided notes into flashcards that cover all key concepts, topics, and terms."
                        "Ensure that each question can be answered using **only** the information contained within the provided text."
                        "Avoid generating questions that require any outside knowledge or inference."
                        "Keep questions and answers clear, concise, and directly related to the provided material."
                        "Create one flashcard for each key idea, focusing on definitions, explanations, and concepts mentioned in the text."
                        "Always aim to maximize the number of flashcards in proportion to the depth and detail of the material."
                        "Prioritize completeness and ensure that the flashcards reflect the full scope of the content without introducing extraneous information."
                        "Example: Flashcard 1:"
                        "Front: What is Dollar-Cost Averaging (DCA)? "
                        "Back: Investing a fixed amount on a regular schedule"
                        "..."
                    )
                },
                {
                    "role": "user",
                    "content": notes
                }
            ]
        )
        flashcards_text = response.choices[0].message.content

        # Parse the flashcards from the response
        flashcards = []
        for flashcard in flashcards_text.split("Flashcard")[1:]:
            parts = flashcard.split("Front:")[1].split("Back:")
            front = parts[0].strip()
            back = parts[1].strip()
            flashcards.append({"front": front, "back": back})
        
        return flashcards

        # Store each flashcard in the database
        # for card in flashcards:
            # add_flashcard(clerk_id, course_name, card['front'], card['back'])

    except Exception as e:
        print(f"Error: {e}")
        return []


def generate_mc_questions(notes):
    """
    Generate multiple-choice questions using OpenAI API.

    This function generates multiple-choice questions from the provided text.
    
    Args:
        notes (str): The summarized notes extracted from the lecture.

    Returns:
        list: Generated multiple-choice questions.
    """


        
    class Question(BaseModel):

        concept: str
        question_type: str
        question: str
        possible_answers: List[str]
        correct_answer: str
        why: str

    class List_of_questions(BaseModel):
        generated_questions: List[Question]

    initial_content = """
            You are an AI model designed to generate high-quality multiple-choice questions based on the principles of synthesis, reorganization, context, comparison, and application. 

            For business, science, technology, engineering, and math notes, focus on equations and calculations if there are. For ALL formulas or expressions, you must **strictly format them in LaTeX** and enclose the entire formula in `$...$` for inline expressions or `$$...$$` for block-level expressions. Strictly format such questions, possible answers, and explanations in LaTeX.

            1. **Synthesis:** Combining different pieces of information to create a new understanding.
                Example: How does combining Newton's Law of Gravity with gravitational acceleration help in understanding how objects fall on Earth?

            2. **Reorganization:** Arranging information in a systematic way to aid understanding.
                Example: Which of the following best represents a reorganized view of Newton's Law of Gravity?

            3. **Context:** Applying a concept in various situations or scenarios.
                Example: In which context would you apply the Law of Gravity differently than on Earth?

            4. **Comparison:** Examining similarities and differences between concepts.
                Example: How does Newton's Law of Gravity differ from Einstein's Theory of General Relativity?

            5. **Application:** Using concepts or formulas to solve problems or perform calculations.
                Example: How would you calculate the gravitational force between the Earth and the Moon using Newton's Law of Gravity?

            Please generate exactly 7 multiple-choice questions based on the provided concept and principles.
                        
            Each question should be followed by EXACTLY 4 answer options (do not include an answer letter), a correct answer choice. 
            
            For each answer choice, the "why" must be an in-depth and concise explanation of both the right and wrong answer choices.

            For the correct answer field, you are to copy the exact text from the correct "possible_answers" option to "correct_answer".
            
            Each question must strictly follow the JSON format below:

            "concept": "Set Theory",
            "question_type": "Synthesis/Comparison/Context/Etc.",
            "question": "How does the concept of a subset differ from the concept of a power set in set theory?",
            "possible_answers": [
                "Option A",
                "Option B",
                "Option C",
                "Option D"
            ],
            "correct_answer": "Option A",
            "why": "Option A is correct because a subset refers to any set whose elements are all contained within another set, while a power set refers to the collection of all possible subsets of a given set, including the empty set and the set itself. Option B is incorrect because it might confuse the subset with the elements that are not necessarily part of the set. Option C is wrong because it might imply that a power set excludes the empty set or the set itself, which is not the case. Option D is incorrect because it could suggest that subsets are not part of the power set, which contradicts the definition of a power set."
        },
    
    """


    try:
        response = openai_client.beta.chat.completions.parse(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": initial_content},
                {"role": "user", "content": notes}
            ],
            response_format=List_of_questions,  
        )
    # Extract the relevant part of the response
        output = response.choices[0].message.parsed
        output_json = output.json()
        output_dict = json.loads(output_json)
        
        return output_dict['generated_questions']

    except Exception as e:
        print(f"Error: {e}")
        return []




def generate_flashcards(notes):
    """
    Generate flashcards using OpenAI API.

    This function generates flashcards from the provided text.
    
    Args:
        notes (str): The summarized notes extracted from the lecture.

    Returns:
        list: Generated flashcards.
    """
    try:
        response = openai_client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": ('''
                        You are an AI model designed to transform the provided notes into high-quality flashcards that cover all key concepts, topics, and terms.
                        Ensure that each question can be answered using **only** the information contained within the provided text.
                        Avoid generating questions that require any outside knowledge or inference.
                        Keep questions and answers clear, concise, and directly related to the provided material.
                                
                        Create one flashcard for each key idea, focusing on definitions, explanations, and concepts mentioned in the text.
                        Always aim to maximize the number of flashcards in proportion to the depth and detail of the material.
                        Prioritize completeness and ensure that the flashcards reflect the full scope of the content without introducing extraneous information.
            
                        Each flashcard must strictly follow the EXACT text format below:
                                                    
                        Flashcard 1:
                        Front: What is Dollar-Cost Averaging (DCA)?
                        Back: Investing a fixed amount on a regular schedule
                    ''')
                },
                {
                    "role": "user",
                    "content": notes
                }
            ]
        )
        flashcards_text = response.choices[0].message.content

        # Parse the flashcards from the response
        flashcards = []
        for flashcard in flashcards_text.split("Flashcard")[1:]:
            if "Front:" in flashcard and "Back:" in flashcard:
                parts = flashcard.split("Front:")[1].split("Back:")
                front = parts[0].strip()
                back = parts[1].strip()
                flashcards.append({"front": front, "back": back})
            else:
                print("Error: Flashcard format is incorrect.")
        
    
    except Exception as e:
        print(f"Error: {e}")
        return []
        
    return flashcards


def calculate_dynamic_intervals(due_by):
    """
    Calculate dynamic intervals based on the due date.

    Args:
        due_by (datetime): The due date for the course.

    Returns:
        list: A list of intervals in days.
    """
    today = datetime.now()
    total_days = (due_by - today).days

    # Generate intervals based on the total days until due
    if total_days <= 0:
        return [1]  # If due date is today or past, return immediate review

    # Logarithmic distribution of intervals
    intervals = []
    for i in range(7):  # Generate 7 intervals
        interval = int(total_days * (1 - (0.5 ** i)))  # Logarithmic spacing
        intervals.append(max(1, interval))  # Ensure at least 1 day

    return intervals

def calculate_next_study_date(clerk_id, course_name, card_id):
    """
    Calculate the next study date for a flashcard based on how many times it has been seen.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard.

    Returns:
        None
    """
    times_seen = get_times_seen(clerk_id, course_name, card_id)
    
    # Retrieve the course to get the due_by date
    course = courses_collection.find_one({"clerk_id": clerk_id, "courses.course_name": course_name})
    due_by = course['due_by'] if course else None

    if not due_by:
        return  # Handle case where course is not found

    # Calculate dynamic intervals based on the due_by date
    intervals = calculate_dynamic_intervals(due_by)

    if times_seen < len(intervals):
        next_interval = intervals[times_seen]
    else:
        next_interval = intervals[-1]  # Use the last interval for more than 7 views

    next_study_date = datetime.now() + datetime.timedelta(days=next_interval)

    # Update the next study date in MongoDB
    create_or_update_next_study_date(clerk_id, course_name, card_id, next_study_date)