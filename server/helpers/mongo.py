from bson import ObjectId
from dotenv import load_dotenv
from pymongo import MongoClient
import os
import datetime

load_dotenv()

# MongoDB setup
mongo_uri = os.getenv('MONGO_URI')
client = MongoClient(mongo_uri)
db = client['VeidaAI']
courses_collection = db['courses']


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
    users_collection = db.users
    user = users_collection.find_one({'clerk_id': clerk_id})

    if user:
        if user['premium'] == True:
            return True
    return False

def create_user(user_data):
    """
    Create a new user in the database.
    """
    users_collection = db.users
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

def make_course(clerk_id, course_name, description, exam_date, notes, flashcards, course_schedule,multiple_choice_questions):
    """
    Create a new course for a user.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.
        description (str): The description of the course.
        notes (dict): A dictionary of notes for the course.
        description (str): The description of the course.
        exam_date (datetime): The due date for the course.
        flashcards (list): A list of flashcards for the course.

    Returns:
        None
    """

    #!mock course schedule
    

    new_course = {
        "course_name": course_name,
        "description": description,
        "notes": notes,
        "description": description,
        "exam_date": exam_date,
        "course_schedule": course_schedule,
        "flashcards": flashcards,
        "multiple_choice_questions": multiple_choice_questions,
        "created_at": datetime.datetime.now(),
        "updated_at": datetime.datetime.now()

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

def get_flashcards(clerk_id, course_name):
    """
    Retrieve all flashcards for a specific course.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course.

    Returns:
        list: A list of flashcards, or None if not found.
    """
    user_courses = courses_collection.find_one({"clerk_id": clerk_id})
    if user_courses and 'courses' in user_courses:
        for course in user_courses['courses']:
            if course['course_name'] == course_name:
                return course['flashcards']
    return None

def get_courses(clerk_id):
    """
    Retrieve all courses for a user.

    Args:
        clerk_id (str): The Clerk ID of the user.

    Returns:
        list: A list of courses, or None if not found.
    """
    user_courses = courses_collection.find_one({"clerk_id": clerk_id}, {"courses": 1, "_id": 0})
    return user_courses['courses'] if user_courses and 'courses' in user_courses else []

def delete_course(clerk_id, course_name):
    """
    Delete a course for a user.

    Args:
        clerk_id (str): The Clerk ID of the user.
        course_name (str): The name of the course to be deleted.

    Returns:
        bool: True if the operation was successful, False otherwise.
    """
    result = courses_collection.update_one(
        {"clerk_id": clerk_id},
        {"$pull": {"courses": {"course_name": course_name}}}
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

def get_flashcards_with_today_study_date(clerk_id):
    """
    Retrieve all flashcards with a next study date of today.

    Args:
        clerk_id (str): The Clerk ID of the user.

    Returns:
        list: A list of flashcards with today's next study date.
    """
    today = datetime.datetime.now().date()
    user_courses = courses_collection.find_one({"clerk_id": clerk_id})
    flashcards_today = []

    if user_courses and 'courses' in user_courses:
        for course in user_courses['courses']:
            for card in course['flashcards']:
                if card.get('next_study_date') and card['next_study_date'].date() == today:
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