from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
from .util import generate_review_dates
import os
import datetime
import openai
import urllib.parse

load_dotenv()

# MongoDB setup
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client['VeidaAI']
courses_collection = db['courses']

#!Database reformate purposes
#courses_collection = db["courses_test"]


openai_api_key = os.getenv('OPENAI_API_KEY')
openai_client = openai.OpenAI(api_key=openai_api_key)

def reformat_courses_collection_user(clerk_id):
    user_courses = courses_collection.find_one({"clerk_id": clerk_id})

    new_courses = []
    if user_courses:
        for course in user_courses['courses']:

            for mcq in course['multiple_choice_questions']:
                if 'correct_answer' in mcq and 'possible_answers' in mcq:
                    try:
                        mcq['correct_answer_index'] = mcq['possible_answers'].index(mcq['correct_answer'])
                    except ValueError:
                        print(f"Warning: Correct answer '{mcq['correct_answer']}' not found in possible answers for question '{mcq['question']}'. Skipping this MCQ.")
                        continue
                else:
                    print(f"Warning: MCQ is missing 'correct_answer' or 'possible_answers'. Skipping this MCQ.")
                    continue
            
            new_course = {
                "course_name": course['course_name'],
                "description": course['description'],
                "exam_date": course['exam_date'],
                "concepts": [
                    {
                        "concept_name": f"{course['course_name']} First Concept",
                        "concept_description": "No Description",
                        "concept_flashcards": course['flashcards'],
                        "review_dates": course['review_dates'],
                        "concept_multiple_choice_questions": course['multiple_choice_questions'],
                        "concept_notes": course['notes']
                    }
                ],
                "course_schedule": course['course_schedule'],
                "created_at": course['created_at'],
                "updated_at": course['updated_at'],
                "push_notifications": False

            }
            new_courses.append(new_course)
    courses_collection.update_one({"clerk_id": clerk_id}, {"$set": {"courses": new_courses}})
            
            


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



def update_subscription_id(clerk_id, subscription_id):
    """
    Update the subscription ID for a user.

    Args:
        clerk_id (str): The Clerk ID of the user.
        subscription_id (str): The new subscription ID.

    Returns:
        None
    """
    users_collection = db.users
    result = users_collection.update_one(
        {'clerk_id': clerk_id},
        {'$set': {'subscription_id': subscription_id}}
    )
    if result.modified_count == 0:
        print(f"No document found with clerk_id: {clerk_id}")
    else:
        print(f"Updated subscription ID for clerk_id: {clerk_id}")
        print(f"Update result: {result.raw_result}")
        

        
        
def update_premium_status(clerk_id, premium):
    """
    Update the premium status for a user.

    Args:
        clerk_id (str): The Clerk ID of the user.
        premium (bool): The new premium status.

    Returns:
        None
    """
    users_collection = db.users
    result = users_collection.update_one(
        {'clerk_id': clerk_id},
        {'$set': {'premium': premium}}
    )
    if result.modified_count == 0:
        print(f"No document found with clerk_id: {clerk_id}")
    else:
        print(f"Updated premium status for clerk_id: {clerk_id}")
        print(f"Update result: {result.raw_result}")
        
def check_premium_status(clerk_id):
    """
    Check the premium status of a user and update it if expired.

    Args:
        clerk_id (str): The Clerk ID of the user.

    Returns:
        bool: True if the user is premium, False otherwise.
    """
    print(f"Checking premium status for clerk_id: {clerk_id}")  # Add this line
    users_collection = db.users
    user = users_collection.find_one({'clerk_id': clerk_id})

    if user:
        print(f"User found: {user}")  # Add this line
        if 'premium' in user and user['premium'] == True:
            # Check if the premium status has expired
            if 'premium_expiry' in user:
                premium_expiry = user['premium_expiry']
                if premium_expiry is not None:
                    if isinstance(premium_expiry, str):
                        premium_expiry = datetime.strptime(premium_expiry, '%Y-%m-%d')
                    if premium_expiry < datetime.now():
                        # Premium has expired, update the user's premium status
                        users_collection.update_one(
                            {'clerk_id': clerk_id},
                            {'$set': {'premium': False, 'premium_expiry': None}}
                        )
                        return False
            return True
    return False


def create_user(user_data):
    """
    Create a new user in the database.
    """
    users_collection = db.users
    # Check if the user already exists
    existing_user = users_collection.find_one({'clerk_id': user_data['id']})
    if existing_user:
        print(f"User with clerk_id {user_data['id']} already exists.")
        return

    users_collection.insert_one({
        'clerk_id': user_data['id'],
        'email': user_data['email_addresses'][0]['email_address'],
        'username': user_data.get('username'),
        'first_name': user_data.get('first_name'),
        'last_name': user_data.get('last_name'),
        'created_at': user_data['created_at'],
        'updated_at': user_data['created_at'],
        'premium': False,  # Set premium to False by default
        'premium_expiry': None  # Initialize premium expiry as None
    })



def remove_today_review_date(clerk_id, course_name, card_id):
    """
    Remove today's review date from a specific flashcard.
    
    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard.
    
    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    today = datetime.datetime.now().date().strftime("%Y-%m-%d")
    result = courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name, "courses.flashcards.id": card_id},
        {"$pull": {"courses.$[course].flashcards.$[card].review_dates": today}},
        array_filters=[{"course.course_name": course_name}, {"card.id": card_id}]
    )
    return result.modified_count > 0

def update_user(user_data):
    """
    Update an existing user's information in the database.

    Args:
        user_data (dict): A dictionary containing updated user information from Clerk.

    Returns:
        None
    """
    users_collection = db.users
    users_collection.update_one(
        {'clerk_id': user_data['id']},
        {'$set': {
            'email': user_data['email_addresses'][0]['email_address'],
            'username': user_data.get('username'),
            'first_name': user_data.get('first_name'),
            'last_name': user_data.get('last_name'),
        }}
    )

def delete_user(user_data):
    """
    Delete a user from the database.

    Args:
        user_data (dict): A dictionary containing user information from Clerk.

    Returns:
        None
    """
    users_collection = db.users
    users_collection.delete_one({'clerk_id': user_data['id']})


def make_course(clerk_id, course_name, description, exam_date ):
    """
    Create a new course for a user.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        description (str): The description of the course.
        notes (dict): A dictionary of notes for the course.
        exam_date (datetime): The due date for the course.
        flashcards (list): A list of flashcards for the course.
        course_schedule (list): A list of course schedules.

    Returns:
        None
    """

    new_course = {
        "course_name": course_name,
        "description": description,
        "exam_date": exam_date,
        "created_at": datetime.datetime.now(),
        "updated_at": datetime.datetime.now(),
        "push_notifications": False
    }
    
    courses_collection.update_one(
        {"clerk_id": clerk_id},
        {"$addToSet": {"courses": new_course}},
        upsert=True
    )
    
def create_or_update_notes(clerk_id, course_name, notes, notes_name):
    """
    Create or update notes for a specific course.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        notes (str): The notes to be created or updated.
        notes_name (str): The name of the notes.

    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    result = courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$set": {f"courses.$.notes.{notes_name}": notes}},
        upsert=True
    )
    return result.matched_count > 0 or result.upserted_id is not None

def delete_notes(clerk_id, course_name, notes_name):
    """
    Delete specific notes for a course.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        notes_name (str): The name of the notes to be deleted.

    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    result = courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$unset": {f"courses.$.notes.{notes_name}": ""}}
    )
    return result.matched_count > 0

def get_note_names(clerk_id, course_name):
    """
    Retrieve the names of all notes for a specific course.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.

    Returns:
        list: A list of note names.
    """
    user_notes = courses_collection.find_one({'clerk_id': clerk_id, "courses.course_name": course_name})
    if user_notes and 'courses' in user_notes:
        for course in user_notes['courses']:
            if course['course_name'] == course_name:
                return list(course['notes'].keys())
    return []

def get_note_by_name(clerk_id, course_name, note_name):
    """
    Retrieve a specific note by its name for a course.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        note_name (str): The name of the note.

    Returns:
        str: The content of the note, or None if not found.
    """
    user_notes = courses_collection.find_one({'clerk_id': clerk_id, "courses.course_name": course_name})
    if user_notes and 'courses' in user_notes:
        for course in user_notes['courses']:
            if course['course_name'] == course_name:
                return course['notes'].get(note_name)
    return None

def add_flashcard(clerk_id, course_name, front, back):
    """
    Add a new flashcard to a course.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        front (str): The front side of the flashcard.
        back (str): The back side of the flashcard.

    Returns:
        None
    """
    new_card = {"id": str(ObjectId()), "front": front, "back": back, "last_seen": None}
    courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$push": {"courses.$.flashcards": new_card}}
    )

def remove_flashcard(clerk_id, course_name, card_id):
    """
    Remove a flashcard from a course.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard to be removed.

    Returns:
        None
    """
    courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$pull": {"courses.$.flashcards": {"id": card_id}}}
    )
    
    
def get_mcqs(clerk_id, course_name,concept_name):
    
    user_courses = courses_collection.find_one({"clerk_id": clerk_id})
    if not user_courses:
        print(f"User not found for clerk_id: {clerk_id}")
        return []

    # Check if the user is premium
    is_premium = user.get('premium', False)

    user_course = next((course for course in user.get('courses', []) if course['course_name'] == course_name), None)
    if not user_course:
        print(f"Course {course_name} not found for user {clerk_id}")
        return []

    mcqs = user_course.get('multiple_choice_questions', [])

    # If the user is not premium, return only the first 3 MCQs
    if not is_premium:
        mcqs = mcqs[:3]




def get_flashcards(clerk_id, course_name,concept_name):
    """
    Retrieve all flashcards for a specific course.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.

    Returns:
        list: A list of flashcards, or None if not found.

    """
    concept_name = decode_url_like_string(concept_name)
    course_name = decode_url_like_string(course_name)
    
    user_courses = courses_collection.find_one({"clerk_id": clerk_id})
    if user_courses and 'courses' in user_courses:
        for course in user_courses['courses']:
            if course['course_name'] == course_name:
                return course['flashcards']
    return None

def get_due_flashcards(clerk_id):



def get_due_flashcards(clerk_id):
    today = datetime.datetime.now().date().strftime("%Y-%m-%d") 
    user = courses_collection.find_one({"clerk_id":clerk_id})
    
    due_flashcards = []
    for course in user['courses']:
        for concept in course.get('concepts', []):
            for flashcard in concept['concept_flashcards']:
                if today in flashcard.get('review_dates', []):
                    due_flashcards.append(flashcard)

    return due_flashcards

             





def get_courses(clerk_id):
    user = courses_collection.find_one({"clerk_id": clerk_id})
    if user:
        return user.get('courses', [])
    return []

import traceback



def add_concept(clerk_id,course_name,concept_name,concept_description,concept_mcqs,concept_flashcards,concept_notes):
    courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$push": {"courses.$.concepts": {"concept_name": concept_name, "concept_description": concept_description,
         "concept_multiple_choice_questions": concept_mcqs, "concept_flashcards": concept_flashcards, "concept_notes": concept_notes}}}

    )
def add_course_concept_content(clerk_id, course_name, concept_name, new_notes, new_flashcards, new_mcqs):
    try:
        # First, find the existing course for the given clerk_id and course_name
        course = courses_collection.find_one({"clerk_id": clerk_id, "courses.course_name": course_name})

        if not course:
            print(f"Course not found for clerk_id: {clerk_id} and course_name: {course_name}")
            return False

        # Find the specific course and concept in the 'courses' array
        target_course = next((c for c in course['courses'] if c['course_name'].lower() == course_name.lower()), None)
        if not target_course:
            print(f"Course {course_name} not found in user's courses")
            return False

        target_concept = next((concept for concept in target_course.get('concepts', []) if concept['concept_name'].lower() == concept_name.lower()), None)
        if not target_concept:
            print(f"Concept {concept_name} not found in course {course_name}")
            return False

        # Initialize update operations
        update_operation = {"$set": {}, "$push": {}}

        # Handle new notes: Append if the notes are a string or push into the array if they are not
        if new_notes:
            if isinstance(target_concept.get('concept_notes'), str):
                # If notes are a string, concatenate the new notes with a newline
                update_operation["$set"]["courses.$[course].concepts.$[concept].concept_notes"] = target_concept['concept_notes'] + "\n\n" + new_notes
            else:
                # If notes are an array, push the new notes into it
                update_operation["$push"]["courses.$[course].concepts.$[concept].concept_notes"] = new_notes

        # Handle new flashcards: Add the new flashcards and initialize review dates and times_seen
        if new_flashcards:
            for flashcard in new_flashcards:
                flashcard['review_dates'] = generate_review_dates(datetime.datetime.now(), target_course['exam_date'])
                flashcard['times_seen'] = 0
            update_operation["$push"]["courses.$[course].concepts.$[concept].concept_flashcards"] = {"$each": new_flashcards}

        # Handle new MCQs: Ensure each MCQ has a correct_answer_index, then push
        if new_mcqs:
            for mcq in new_mcqs:
                if 'correct_answer' in mcq and 'possible_answers' in mcq:
                    try:
                        mcq['correct_answer_index'] = mcq['possible_answers'].index(mcq['correct_answer'])
                    except ValueError:
                        print(f"Correct answer '{mcq['correct_answer']}' not found in possible answers. Skipping this MCQ.")
                        continue
                else:
                    print(f"MCQ is missing 'correct_answer' or 'possible_answers'. Skipping this MCQ.")
                    continue
            if new_mcqs:  # Only add MCQs if we have valid ones left
                update_operation["$push"]["courses.$[course].concepts.$[concept].concept_multiple_choice_questions"] = {"$each": new_mcqs}

        # Execute the update operation with array filters for course and concept
        result = courses_collection.update_one(
            {"clerk_id": clerk_id, "courses.course_name": course_name},
            update_operation,
            array_filters=[{"course.course_name": course_name}, {"concept.concept_name": concept_name}]
        )

        print(f"Update result: {result.raw_result}")  # Log the result of the operation

        if result.modified_count > 0:
            print(f"Successfully added new content to concept: {concept_name} in course: {course_name}")
            return True
        else:
            print(f"No changes made to concept: {concept_name} in course: {course_name}")
            return False

    except Exception as e:
        print(f"Error adding course concept content: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return False
    
def delete_course(clerk_id, course_name):
    """
    Delete a course for a user.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course to be deleted.

    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    print(f"Deleting course {course_name} for user {clerk_id}")
    result = courses_collection.update_one(
        {"clerk_id": clerk_id},
        {"$pull": {"courses": {"course_name": course_name}}}
    )
    return result.modified_count > 0

def delete_concept(clerk_id, course_name, concept_name):
    """
    Delete a concept from a course for a user.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course containing the concept.
        concept_name (str): The name of the concept to be deleted.

    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    print(f"Deleting concept '{concept_name}' from course '{course_name}' for user '{clerk_id}'")
    result = courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$pull": {"courses.$.concepts": {"concept_name": concept_name}}}
    )
    return result.modified_count > 0


def update_lastseen(clerk_id, course_name, card_id):
    """
    Update the last seen date of a flashcard.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard.

    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    result = courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name, "courses.flashcards.id": card_id},
        {"$set": {"courses.$[course].flashcards.$[card].last_seen": datetime.datetime.now()}},
        array_filters=[{"course.course_name": course_name}, {"card.id": card_id}]
    )
    return result.modified_count > 0

def edit_flashcard(clerk_id, course_name, card_id, front=None, back=None):
    """
    Edit an existing flashcard.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard.
        front (str): The new front side of the flashcard (optional).
        back (str): The new back side of the flashcard (optional).

    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    update_fields = {}
    if front is not None:
        update_fields["courses.$[course].flashcards.$[card].front"] = front
    if back is not None:
        update_fields["courses.$[course].flashcards.$[card].back"] = back

    result = courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name, "courses.flashcards.id": card_id},
        {"$set": update_fields},
        array_filters=[{"course.course_name": course_name}, {"card.id": card_id}]
    )
    return result.modified_count > 0

def edit_note(clerk_id, course_name, notes_name, new_content):
    """
    Edit an existing note.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        notes_name (str): The name of the note to be edited.
        new_content (str): The new content for the note.

    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    result = courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$set": {f"courses.$.notes.{notes_name}": new_content}}
    )
    return result.modified_count > 0


def create_or_update_next_study_date(clerk_id, course_name, card_id, next_study_date):
    """
    Create or update the next study date for a specific flashcard.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard.
        next_study_date (datetime): The next study date to be set.

    Returns:
        None
    """
    result = courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name, "courses.flashcards.id": card_id},
        {"$set": {"courses.$[course].flashcards.$[card].next_study_date": next_study_date}},
        array_filters=[{"course.course_name": course_name}, {"card.id": card_id}]
    )
    return result.modified_count > 0

def get_next_study_date(clerk_id, course_name, card_id):
    """
    Retrieve the next study date for a specific flashcard.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard.

    Returns:
        datetime or None: The next study date if found, None otherwise.
    """
    user_courses = courses_collection.find_one({"clerk_id": clerk_id, "courses.course_name": course_name})
    if user_courses and 'courses' in user_courses:
        for course in user_courses['courses']:
            if course['course_name'] == course_name:
                for card in course['flashcards']:
                    if card['id'] == card_id:
                        return card.get('next_study_date')
    return None


def get_course(clerk_id, course_name):
    print(f"Looking for course with clerk_id={clerk_id} and course_name={course_name}")  # Log the query
    # Query to search inside the 'courses' array
    course_data = courses_collection.find_one({
        'clerk_id': clerk_id,
        'courses': {
            '$elemMatch': {
                'course_name': {'$regex': f'^{course_name}$', '$options': 'i'}  # Case-insensitive match
            }
        }
    })

    if course_data:
        # Find the exact course from the array
        course = next((course for course in course_data['courses'] if course['course_name'].lower() == course_name.lower()), None)
        if course:
            return {
                'clerk_id': clerk_id,
                'course_name': course['course_name'],
                'description': course.get('description', ''),
                'exam_date': course.get('exam_date', ''),
                'concepts': course.get('concepts', []),
            }
        else:
            print("Course not found in the array")
            return None
    else:
        print("No course data found for the clerk_id")
        return None



def get_course_exam_date(clerk_id, course_name):
    course = courses_collection.find_one({
        'clerk_id': clerk_id,
        'courses': {"$elemMatch": {"course_name": course_name}}
    })

    if course and 'courses' in course:
        for course_info in course['courses']:
            if course_info['course_name'] == course_name:
                return {'exam_date': course_info.get('exam_date', '')}
    return None
    
def remove_today_review_dates(clerk_id, course_name):
    """
    Remove today's review date from all flashcards due today in a course.
    
    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
    
    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    today = datetime.datetime.now().date().strftime("%Y-%m-%d")
    result = courses_collection.update_many(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$pull": {"courses.$[course].flashcards.$[card].review_dates": today}},
        array_filters=[{"course.course_name": course_name}, {"card.review_dates": today}]
    )
    return result.modified_count > 0


def get_flashcards_with_today_study_date(clerk_id, course_name=None):
    """
    Retrieve all flashcards with a next study date of today.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str, optional): The name of the course. If provided, only flashcards from this course will be retrieved.

    Returns:
        list: A list of flashcards with today's next study date.
    """
    today = datetime.datetime.now().date().strftime("%Y-%m-%d")
    query = {"clerk_id": clerk_id}

    if course_name:
        query["courses.course_name"] = course_name

    user_courses = courses_collection.find_one(query)
    flashcards_today = []

    if user_courses and 'courses' in user_courses:
        for course in user_courses['courses']:
            if course_name is None or course['course_name'] == course_name:
                for concept in course.get('concepts', []):
                    for card in concept['concept_flashcards']:
                        if today in card.get('review_dates', []):
                            flashcards_today.append(card)

    return flashcards_today


def update_times_seen(clerk_id, course_name, card_id):
    """
    Increments the times_seen field for a specific flashcard.

    Args:
        clerk_id (str): The ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard.

    Returns:
        None
    """
    courses_collection.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name, "courses.flashcards.id": card_id},
        {"$inc": {"courses.$[course].flashcards.$[card].times_seen": 1}},
        array_filters=[{"course.course_name": course_name}, {"card.id": card_id}]
    )


def get_times_seen(clerk_id, course_name, card_id):
    """
    Retrieves the times_seen field for a specific flashcard.

    Args:
        clerk_id (str): The ID of the user.
        course_name (str): The name of the course.
        card_id (str): The ID of the flashcard.

    Returns:
        int: The number of times the flashcard has been seen.
    """
    user_courses = courses_collection.find_one({"clerk_id": clerk_id, "courses.course_name": course_name})
    if user_courses and 'courses' in user_courses:
        for course in user_courses['courses']:
            if course['course_name'] == course_name:
                for card in course['flashcards']:
                    if card['id'] == card_id:
                        return card.get('times_seen', 0)  # Return 0 if not found
    return 0


def get_course_concepts(clerk_id, course_name):

    concepts = courses_collection.find_one({"clerk_id": clerk_id, "courses.course_name": course_name})
    if concepts and 'courses' in concepts:
        for course in concepts['courses']:
            if course['course_name'] == course_name and course.get('concepts'):
                return course['concepts']
    return []