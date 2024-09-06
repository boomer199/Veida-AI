from flask import Flask, jsonify, request
import pymongo
from dotenv import load_dotenv
import os
import sys
from helpers.mongo import (
    create_user,
    delete_user,
    update_user,
    make_course,
    create_or_update_notes,
    delete_notes,
    get_note_names,
    get_note_by_name,
    add_flashcard,
    remove_flashcard,
    get_flashcards,
    get_courses,
    get_mcqs,
    delete_course,
    delete_concept,
    get_due_flashcards,
    edit_flashcard,
    edit_note,
    update_lastseen,
    get_next_study_date,
    get_flashcards_with_today_study_date,
    create_or_update_next_study_date,
    update_times_seen,
    check_premium_status, 
    update_premium_status,
    add_course_content,
    update_subscription_id,
    add_concept,
    remove_today_review_dates,
    get_course,
    get_course_exam_date,
    get_course_concepts
)
from helpers.ai import (
    generate_flashcards,
    generate_notes,
    generate_mc_questions
)
from helpers.util import (
    generate_review_dates
)
import pytesseract
from flask_cors import CORS
import fitz  # PyMuPDF
from datetime import datetime
import stripe
import numpy as np
import cv2

from paddleocr import PaddleOCR
import logging

app = Flask(__name__)
# Configure logging
logging.basicConfig(level=logging.CRITICAL)
app.logger.setLevel(logging.CRITICAL)

ocr = PaddleOCR(use_angle_cls=True, lang='en')


pytesseract.pytesseract.tesseract_cmd = os.getenv('TESSERACT_CMD', 'tesseract')

load_dotenv()

CORS(app, resources={r"/api/*": {"origins": "*"}})


# MongoDB setup
mongo_uri = os.getenv('MONGO_URI')
client = pymongo.MongoClient(mongo_uri)
db = client['VeidaAI']

# Set your Stripe API key
stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')


@app.route('/api/get_course', methods=['GET'])
def get_course_route():
    clerk_id = request.args.get('clerk_id')
    course_name = request.args.get('course_name')

    if not clerk_id or not course_name:
        return jsonify({'error': 'Missing required parameters'}), 400

    course = get_course(clerk_id, course_name)

    if course:
        return jsonify({'course': course}), 200
    else:
        return jsonify({'error': 'Course not found'}), 404
    
@app.route('/webhook/clerk', methods=['POST'])
def clerk_webhook():
    event = request.json
    event_type = event.get('type')
    user_data = event.get('data')

    if event_type == 'user.created':
        # Check if the user already exists
        existing_user = db.users.find_one({'clerk_id': user_data['id']})
        if not existing_user:
            create_user(user_data)
        check_premium_status(user_data['id'])  # Check premium status on user creation
    elif event_type == 'user.updated':
        update_user(user_data)
        check_premium_status(user_data['id'])  # Check premium status on user update
    elif event_type == 'user.deleted':
        delete_user(user_data)

    return jsonify({"success": True}), 200


@app.route('/api/create-checkout-session', methods=['POST'])
def create_checkout_session():
    data = request.json
    clerk_id = data.get('clerk_id')

    if not clerk_id:
        return jsonify({"error": "Missing required parameter: clerk_id"}), 400

    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price': 'price_1PplPkGuhuwTC4DrFmKNUWFW', 
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url=os.getenv('STRIPE_SUCCESS_URL'),
            cancel_url=os.getenv('STRIPE_CANCEL_URL'),
            client_reference_id=clerk_id,
            subscription_data={
                'metadata': {
                    'clerk_id': clerk_id
                }
            }
        )
        return jsonify({'url': session.url})
    except Exception as e:
        return jsonify({"error": str(e)}), 400
    
@app.route('/api/cancel-subscription', methods=['POST'])
def cancel_subscription():
    data = request.json
    clerk_id = data.get('clerk_id')

    if not clerk_id:
        return jsonify({"error": "Missing required parameter: clerk_id"}), 400

    try:
        # Fetch the user's subscription ID from your database
        user = db.users.find_one({'clerk_id': clerk_id})
        subscription_id = user.get('subscription_id')

        if not subscription_id:
            return jsonify({"error": "No active subscription found"}), 404

        # Cancel the subscription in Stripe
        stripe.Subscription.delete(subscription_id)

        # Update the user's premium status in your database
        update_premium_status(clerk_id, False)
        update_subscription_id(clerk_id, None)
        
        return jsonify({"message": "Subscription cancelled successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 400

@app.route('/webhook', methods=['POST'])
def webhook():
    payload = request.data
    sig_header = request.headers.get('STRIPE_SIGNATURE')

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, endpoint_secret
        )
    except ValueError as e:
        return jsonify({"error": "Invalid payload"}), 400
    except stripe.error.SignatureVerificationError as e:
        return jsonify({"error": "Invalid signature"}), 400

    if event['type'] == 'checkout.session.completed':
        session = event['data']['object']
        clerk_id = session.get('client_reference_id')
        subscription_id = session.get('subscription')
        if clerk_id and subscription_id:
            update_subscription_id(clerk_id, subscription_id)
            update_premium_status(clerk_id, True)
            print(f"Updated subscription ID and premium status for clerk_id: {clerk_id}")
        else:
            print("Missing clerk_id or subscription_id in the session")
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        clerk_id = subscription.get('metadata', {}).get('clerk_id')
        if clerk_id:
            update_subscription_id(clerk_id, None)
            update_premium_status(clerk_id, False)
            print(f"Removed subscription ID and premium status for clerk_id: {clerk_id}")
        else:
            print("Missing clerk_id in the subscription metadata")

    return jsonify(success=True)

    
@app.route('/api/update_course', methods=['PUT'])
def update_course():
    data = request.json
    clerk_id = data.get('clerk_id')
    original_course_name = data.get('original_course_name')  # Get the original course name
    course_name = data.get('course_name')
    description = data.get('description')
    exam_date_str = data.get('exam_date')

    # Convert exam_date_str to datetime object
    try:
        exam_date = datetime.strptime(exam_date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Invalid exam date format"}), 400

    # Debugging logs
    print(f"Received data: {data}")
    print(f"clerk_id: {clerk_id}, original_course_name: {original_course_name}, course_name: {course_name}, description: {description}, exam_date: {exam_date}")

    if not all([clerk_id, original_course_name, course_name, description, exam_date]):
        return jsonify({"error": "Missing required fields"}), 400

    # Fetch the existing course data
    existing_course = db.courses.find_one(
        {"clerk_id": clerk_id, "courses.course_name": original_course_name},
        {"courses.$": 1}
    )
    if not existing_course or 'courses' not in existing_course:
        return jsonify({"error": "Course not found"}), 404

    course_data = existing_course['courses'][0]

    # Delete the existing course using the original course name
    delete_result = delete_course(clerk_id, original_course_name)
    print(f"Delete result: {delete_result}")  # Add this line
    if not delete_result:
        return jsonify({"error": "Failed to delete existing course"}), 500


    # Create a new course with the updated content and existing associated data
    new_course = {
        "course_name": course_name,
        "description": description,
        "exam_date": exam_date,
        "concepts": course_data.get('concepts', []),
        "created_at": course_data.get('created_at', datetime.now()),
        "updated_at": datetime.now()
    }
    try:
        result = db.courses.update_one(

            {"clerk_id": clerk_id},
            {"$addToSet": {"courses": new_course}},
            upsert=True
        )
    except pymongo.errors.DuplicateKeyError:
        return jsonify({"error": "A course with this name already exists."}), 400


    print(f"Update result: {result.raw_result}")  # Add this line
    if result.modified_count > 0 or result.upserted_id is not None:
        return jsonify({"message": "Course updated successfully"}), 200
    else:
        return jsonify({"error": "Failed to update course"}), 500

@app.route('/api/create_course_concept', methods=['POST'])
def create_course_concept():
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    concept_name = data.get('concept_name')
    concept_description = data.get('concept_description')
    concept_mcqs = data.get('concept_mcqs')
    concept_flashcards = data.get('concept_flashcards', [])
    concept_notes = data.get('concept_notes')

    start_date = datetime.now()
    exam_date_str = get_course_exam_date(clerk_id, course_name).get('exam_date', '')

    if not exam_date_str:
        return jsonify({"error": "Exam date is missing."}), 400

    try:
        exam_date = exam_date_str
    except (ValueError, TypeError) as e:
        return jsonify({"error": "Invalid exam date format or type."}), 400

    # Generate review dates based on start date and exam date
    review_dates = generate_review_dates(start_date, exam_date)

    # Add review_dates and times_seen to each flashcard
    try:
        for flashcard in concept_flashcards:
            flashcard['review_dates'] = review_dates
            flashcard['times_seen'] = 0
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    # Add the concept
    try:
        add_concept(clerk_id, course_name, concept_name, concept_description, concept_mcqs, concept_flashcards, concept_notes)
        return jsonify({"message": "Concept added successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/api/update_course_concept', methods=['PUT'])
def update_course_concept():
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    original_concept_name = data.get('original_concept_name')
    concept_name = data.get('concept_name')
    concept_description = data.get('concept_description')

    # Debugging logs
    print(f"Received data: {data}")
    print(f"clerk_id: {clerk_id}, course_name: {course_name}, original_concept_name: {original_concept_name}, concept_name: {concept_name}, concept_description: {concept_description}")

    if not all([clerk_id, course_name, original_concept_name, concept_name, concept_description]):
        return jsonify({"error": "Missing required fields"}), 400

    # Fetch the existing course with the concept data
    existing_course = db.courses.find_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"courses.$": 1}
    )

    if not existing_course or 'courses' not in existing_course:
        return jsonify({"error": "Course or concept not found"}), 404

    # Extract the course data
    course_data = existing_course['courses'][0]

    # Find the existing concept within the course
    concept_data = next((concept for concept in course_data.get('concepts', []) if concept['concept_name'] == original_concept_name), None)
    if not concept_data:
        return jsonify({"error": "Concept not found"}), 404

    # Delete the original concept
    delete_result = delete_concept(clerk_id, course_name, original_concept_name)
    if not delete_result:
        return jsonify({"error": "Failed to delete existing concept"}), 500

    # Prepare the updated concept data
    updated_concept = {
        "concept_name": concept_name,
        "concept_description": concept_description,
        "concept_flashcards": concept_data.get('concept_flashcards', []),
        "concept_notes": concept_data.get('concept_notes', []),
        "concept_multiple_choice_questions": concept_data.get('concept_multiple_choice_questions', []),
        "review_dates": concept_data.get('review_dates', []),
    }

    # Add the updated concept back into the course
    result = db.courses.update_one(
        {"clerk_id": clerk_id, "courses.course_name": course_name},
        {"$addToSet": {"courses.$.concepts": updated_concept}}
    )

    if result.modified_count > 0:
        return jsonify({"message": "Concept updated successfully"}), 200
    else:
        return jsonify({"error": "Failed to update concept"}), 500

@app.route('/api/delete_concept', methods=['DELETE'])
def route_delete_concept():
    """
    Deletes a concept from a course for a user.

    This endpoint accepts a DELETE request with JSON data containing the clerk_id, course_name, and concept_name. 
    It deletes the specified concept from the given course for the user.

    Returns:
        tuple: A JSON response indicating success and HTTP status code 200 or 404 if the concept is not found.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    concept_name = data.get('concept_name')

    if not all([clerk_id, course_name, concept_name]):
        return jsonify({"error": "Missing required fields"}), 400

    result = delete_concept(clerk_id, course_name, concept_name)
    if result:
        return jsonify({"message": "Concept deleted successfully"}), 200
    else:
        return jsonify({"error": "Concept not found"}), 404

    
@app.route('/api/check_premium_status', methods=['GET'])
def route_check_premium_status():
    clerk_id = request.args.get('clerk_id')

    if not clerk_id:
        return jsonify({"error": "Missing required parameter: clerk_id"}), 400

    is_premium = check_premium_status(clerk_id)
    return jsonify({"premium": is_premium}), 200

@app.route('/api/extract_text', methods=['POST'])
def extract_text():
    """
    Extracts text from uploaded files (PDF, JPG, JPEG, PNG).

    This endpoint accepts a POST request with a file attachment. It attempts to extract text from the file based on its type. Supported file types include PDF, JPG, JPEG, and PNG. The extracted text is then returned in the response.

    Returns:
        tuple: A JSON response containing the extracted text and HTTP status code.
    """

    #!Debugging Protocol
    #return jsonify({"notes": "notes", "flashcards": "flashcards", "mc_questions": "mc_questions"}), 200
    
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    file_type = file.filename.split('.')[-1].lower()
    if file_type not in ['pdf', 'jpg', 'jpeg', 'png', 'txt']:
        return jsonify({"error": "Unsupported file type"}), 400

    extracted_text = ""

    try:
        if file_type == 'pdf':
            extracted_text = process_pdf(file)
        elif file_type in ['jpg', 'jpeg', 'png']:
            extracted_text = process_image_file(file)
        elif file_type == 'txt':
            try:
                extracted_text = file.stream.read().decode('utf-8')
            except UnicodeDecodeError:
                file.stream.seek(0)
                extracted_text = file.stream.read().decode('latin-1', errors='ignore')

        if not extracted_text.strip():
            return jsonify({
                "error": "Sorry, we couldn't detect any text in that file! Try a higher resolution image or a text-based PDF."
            }), 204

        # Generate content
        notes = generate_notes(extracted_text)
        mc_questions = generate_mc_questions(notes)

        for mcq in mc_questions:
            if 'correct_answer' in mcq and 'possible_answers' in mcq:
                try:
                    mcq['correct_answer_index'] = mcq['possible_answers'].index(mcq['correct_answer'])
                except ValueError:
                    # Skip this MCQ and continue with the next one
                    continue
            else:
                # Skip this MCQ if it doesn't have 'correct_answer' or 'possible_answers' fields
                continue

        flashcards = generate_flashcards(notes)

        # Check if generated content is empty
        if not notes and not mc_questions and not flashcards:
            return jsonify({
                "error": "Sorry, we couldn't generate some content! The text may be unclear. Try using a higher resolution image or a different file."
            }), 204

        return jsonify({"notes": notes, "flashcards": flashcards, "mc_questions": mc_questions}), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500


def process_pdf(file):
    extracted_text = ""
    pdf_document = fitz.open(stream=file.read(), filetype="pdf")

    for page in pdf_document:
        # Extract text directly from the PDF's text layer
        text = page.get_text()
        if text.strip():
            extracted_text += text + "\n"
        
        # Extract images from the PDF and apply OCR
        images = page.get_images(full=True)
        for img in images:
            xref = img[0]
            base_image = pdf_document.extract_image(xref)
            image_bytes = base_image["image"]
            image_np = np.frombuffer(image_bytes, np.uint8)
            image = cv2.imdecode(image_np, cv2.IMREAD_GRAYSCALE)

            # Process the image without resizing
            extracted_text += process_image(image)

    return extracted_text


def process_image_file(file):
    image_bytes = file.read()
    image_np = np.frombuffer(image_bytes, np.uint8)
    image = cv2.imdecode(image_np, cv2.IMREAD_GRAYSCALE)
    return process_image(image)


def process_image(image):
    if image is None:
        raise ValueError("Failed to decode the image. The file might be corrupted or the format might not be supported.")

    image = cv2.copyMakeBorder(image, 10, 10, 10, 10, cv2.BORDER_CONSTANT, value=[255, 255, 255])
    image = cv2.convertScaleAbs(image, alpha=2.0, beta=0)
    _, image = cv2.threshold(image, 200, 255, cv2.THRESH_BINARY)

    result = ocr.ocr(image, cls=True)
    
    extracted_text = ""
    if result and result[0]:
        extracted_text = ' '.join([line[1][0] for line in result[0]])

    if not extracted_text.strip():
        extracted_text = pytesseract.image_to_string(image) + "\n"

    return extracted_text + "\n"
    
@app.route('/api/create_course', methods=['POST'])
def route_create_course():
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    description = data.get('description', '')
    exam_date_str = data.get('exam_date', '')

    if not all([clerk_id, course_name, description, exam_date_str]):
        return jsonify({"error": "Missing required fields"}), 400
    
    is_premium = check_premium_status(clerk_id)

    user_courses = get_courses(clerk_id)
    course_count = len(user_courses)
    
    if not is_premium and course_count >= 2:
        return jsonify({"error": "Free users can only create up to 2 courses. Upgrade to premium for unlimited courses."}), 403

    try:
        exam_date = datetime.strptime(exam_date_str, '%Y-%m-%d')
    except ValueError:
        return jsonify({"error": "Invalid exam date format"}), 400

    start_date = datetime.now()
    

    

    make_course(clerk_id, course_name, description, exam_date_str)
    return jsonify({"message": "Course created successfully"}), 201

@app.route('/api/create_or_update_notes', methods=['POST'])
def route_create_or_update_notes():
    """
    Creates or updates notes for a specific course.

    This endpoint accepts a POST request with JSON data containing the clerk_id, course_name, notes, and notes_name. It creates or updates the specified notes for the given course.

    Returns:
        tuple: A JSON response indicating success and HTTP status code 200.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    notes = data.get('notes')
    notes_name = data.get('notes_name')

    if not all([clerk_id, course_name, notes, notes_name]):
        return jsonify({"error": "Missing required fields"}), 400

    result = create_or_update_notes(clerk_id, course_name, notes, notes_name)
    return jsonify({"success": result}), 200

@app.route('/api/delete_notes', methods=['DELETE'])
def route_delete_notes():
    """
    Deletes specific notes for a course.

    This endpoint accepts a DELETE request with JSON data containing the clerk_id, course_name, and notes_name. It deletes the specified notes for the given course.

    Returns:
        tuple: A JSON response indicating success and HTTP status code 200.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    notes_name = data.get('notes_name')

    if not all([clerk_id, course_name, notes_name]):
        return jsonify({"error": "Missing required fields"}), 400

    result = delete_notes(clerk_id, course_name, notes_name)
    return jsonify({"success": result}), 200

@app.route('/api/get_note_names', methods=['GET'])
def route_get_note_names():
    """
    Retrieves note names for a course.

    This endpoint accepts a GET request with query parameters clerk_id and course_name. It returns a list of note names for the specified course.

    Returns:
        tuple: A JSON response containing the list of note names and HTTP status code 200.
    """
    clerk_id = request.args.get('clerk_id')
    course_name = request.args.get('course_name')

    if not all([clerk_id, course_name]):
        return jsonify({"error": "Missing required parameters"}), 400

    note_names = get_note_names(clerk_id, course_name)
    return jsonify({"note_names": note_names}), 200

@app.route('/api/get_note', methods=['GET'])
def route_get_note():
    """
    Retrieves the content of a specific note.

    This endpoint accepts a GET request with query parameters clerk_id, course_name, and note_name. It returns the content of the specified note.

    Returns:
        tuple: A JSON response containing the note content and HTTP status code 200.
    """
    clerk_id = request.args.get('clerk_id')
    course_name = request.args.get('course_name')
    note_name = request.args.get('note_name')

    if not all([clerk_id, course_name, note_name]):
        return jsonify({"error": "Missing required parameters"}), 400

    note_content = get_note_by_name(clerk_id, course_name, note_name)
    return jsonify({"note_content": note_content}), 200

@app.route('/api/add_flashcard', methods=['POST'])
def route_add_flashcard():
    """
    Adds a new flashcard to a course.

    This endpoint accepts a POST request with JSON data containing the clerk_id, course_name, front, and back. It adds a new flashcard to the specified course.

    Returns:
        tuple: A JSON response indicating success and HTTP status code 201.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    front = data.get('front')
    back = data.get('back')

    if not all([clerk_id, course_name, front, back]):
        return jsonify({"error": "Missing required fields"}), 400

    add_flashcard(clerk_id, course_name, front, back)
    return jsonify({"message": "Flashcard added successfully"}), 201

@app.route('/api/remove_flashcard', methods=['DELETE'])
def route_remove_flashcard():
    """
    Removes a flashcard from a course.

    This endpoint accepts a DELETE request with JSON data containing the clerk_id, course_name, and card_id. It removes the specified flashcard from the given course.

    Returns:
        tuple: A JSON response indicating success and HTTP status code 200.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    card_id = data.get('card_id')

    if not all([clerk_id, course_name, card_id]):
        return jsonify({"error": "Missing required fields"}), 400

    remove_flashcard(clerk_id, course_name, card_id)
    return jsonify({"message": "Flashcard removed successfully"}), 200


@app.route('/api/get_mcqs', methods=['GET'])
def route_get_mcqs():

    """ 
    Retrieves all MCQs for a course
    
    This endpoint accepts a GET request with the query params. Returning a dictionary of questions
    """


    clerk_id = request.args.get('clerk_id')
    course_name = request.args.get('course_name')
    concept_name = request.args.get('concept_name')
    if not all([clerk_id, course_name,concept_name]):
        return jsonify({"error": "Missing required parameters"}), 400
    
    mcqs = get_mcqs(clerk_id, course_name,concept_name)
    return jsonify({"mcqs":mcqs}), 200

@app.route('/api/get_flashcards', methods=['GET'])
def route_get_flashcards():
    """
    Retrieves all flashcards for a course.

    This endpoint accepts a GET request with query parameters clerk_id and course_name. It returns a list of flashcards for the specified course.

    Returns:
        tuple: A JSON response containing the list of flashcards and HTTP status code 200.
    """
    clerk_id = request.args.get('clerk_id')
    course_name = request.args.get('course_name')
    concept_name = request.args.get('concept_name')


    if not all([clerk_id, course_name]):
        return jsonify({"error": "Missing required parameters"}), 400

    flashcards = get_flashcards(clerk_id, course_name,concept_name)
    return jsonify({"flashcards": flashcards}), 200

@app.route('/api/get_courses', methods=['GET'])
def route_get_courses():
    """
    Retrieves all courses for a user.

    This endpoint accepts a GET request with query parameter clerk_id. It returns a list of courses for the specified user.

    Returns:
        tuple: A JSON response containing the list of courses and HTTP status code 200.
    """
    clerk_id = request.args.get('clerk_id')

    if not clerk_id:
        return jsonify({"error": "Missing required parameter: clerk_id"}), 400

    courses = get_courses(clerk_id)
    return jsonify({"courses": courses}), 200

@app.route('/api/get_course_concepts', methods=['GET'])
def route_get_course_concepts():
    """
    Retrieves all concepts for a course.

    This endpoint accepts a GET request with query parameters clerk_id and course_name. It returns a list of concepts for the specified course.
    """

    clerk_id = request.args.get('clerk_id')
    course_name = request.args.get('course_name')

    if not all([clerk_id, course_name]):
        return jsonify({"error": "Missing required parameters"}), 400

    concepts = get_course_concepts(clerk_id, course_name)
    print(concepts)
    sys.stdout.flush()
    return jsonify({"concepts": concepts}), 200

@app.route('/api/delete_course', methods=['DELETE'])
def route_delete_course():
    """
    Deletes a course for a user.

    This endpoint accepts a DELETE request with JSON data containing the clerk_id and course_name. It deletes the specified course for the given user.

    Returns:
        tuple: A JSON response indicating success and HTTP status code 200 or 404 if the course is not found.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')

    if not all([clerk_id, course_name]):
        return jsonify({"error": "Missing required fields"}), 400

    result = delete_course(clerk_id, course_name)
    if result:
        return jsonify({"message": "Course deleted successfully"}), 200
    else:
        return jsonify({"error": "Course not found"}), 404
    

@app.route('/api/update_lastseen', methods=['POST'])
def route_update_lastseen():
    """
    Updates the last seen date of a flashcard.

    This endpoint accepts a POST request with JSON data containing the clerk_id, course_name, and card_id.
    
    Returns:
        tuple: A JSON response indicating success or failure and HTTP status code.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    card_id = data.get('card_id')

    if not all([clerk_id, course_name, card_id]):
        return jsonify({"error": "Missing required fields"}), 400

    success = update_lastseen(clerk_id, course_name, card_id)
    return jsonify({"success": success}), (200 if success else 404)

@app.route('/api/edit_flashcard', methods=['POST'])
def route_edit_flashcard():
    """
    Edits an existing flashcard.

    This endpoint accepts a POST request with JSON data containing the clerk_id, course_name, card_id, front, and back.
    
    Returns:
        tuple: A JSON response indicating success or failure and HTTP status code.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    card_id = data.get('card_id')
    front = data.get('front')
    back = data.get('back')

    if not all([clerk_id, course_name, card_id]):
        return jsonify({"error": "Missing required fields"}), 400

    success = edit_flashcard(clerk_id, course_name, card_id, front, back)
    return jsonify({"success": success}), 200 if success else 404

@app.route('/api/edit_note', methods=['POST'])
def route_edit_note():
    """
    Edits an existing note.

    This endpoint accepts a POST request with JSON data containing the clerk_id, course_name, notes_name, and new_content.
    
    Returns:
        tuple: A JSON response indicating success or failure and HTTP status code.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    notes_name = data.get('notes_name')
    new_content = data.get('new_content')

    if not all([clerk_id, course_name, notes_name, new_content]):
        return jsonify({"error": "Missing required fields"}), 400

    success = edit_note(clerk_id, course_name, notes_name, new_content)
    return jsonify({"success": success}), 200 if success else 404

@app.route('/api/create_or_update_next_study_date', methods=['POST'])
def route_create_or_update_next_study_date():
    """
    Creates or updates the next study date for a specific flashcard.

    This endpoint accepts a POST request with JSON data containing the clerk_id, course_name, card_id, and next_study_date.

    Returns:
        tuple: A JSON response indicating success and HTTP status code 200.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    card_id = data.get('card_id')
    next_study_date = data.get('next_study_date')

    if not all([clerk_id, course_name, card_id, next_study_date]):
        return jsonify({"error": "Missing required fields"}), 400

    create_or_update_next_study_date(clerk_id, course_name, card_id, next_study_date)
    return jsonify({"message": "Next study date updated successfully"}), 200

@app.route('/api/remove_today_review_dates', methods=['POST'])
def route_remove_today_review_dates():
    """
    Remove today's review date from all flashcards due today in a course.
    
    This endpoint accepts a POST request with JSON body containing clerk_id and course_name.
    
    Returns:
        tuple: A JSON response indicating success or failure and HTTP status code.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    
    if not all([clerk_id, course_name]):
        return jsonify({"error": "Missing required parameters"}), 400
    
    success = remove_today_review_dates(clerk_id, course_name)
    if success:
        return jsonify({"message": "Today's review dates removed successfully"}), 200
    else:
        return jsonify({"error": "Failed to remove today's review dates"}), 500
    
    
@app.route('/api/get_next_study_date', methods=['GET'])
def route_get_next_study_date():
    """
    Retrieves the next study date for a specific flashcard.

    This endpoint accepts a GET request with query parameters clerk_id, course_name, and card_id.

    Returns:
        tuple: A JSON response containing the next study date and HTTP status code 200.
    """
    clerk_id = request.args.get('clerk_id')
    course_name = request.args.get('course_name')
    card_id = request.args.get('card_id')

    if not all([clerk_id, course_name, card_id]):
        return jsonify({"error": "Missing required parameters"}), 400

    next_study_date = get_next_study_date(clerk_id, course_name, card_id)
    return jsonify({"next_study_date": next_study_date}), 200

@app.route('/api/get_flashcards_today', methods=['GET'])
def route_get_flashcards_today():
    """
    Retrieves all flashcards with a next study date of today.

    This endpoint accepts a GET request with query parameters clerk_id and optionally course_name.

    Returns:
        tuple: A JSON response containing the list of flashcards and HTTP status code 200.
    """
    clerk_id = request.args.get('clerk_id')
    course_name = request.args.get('course_name')

    if not clerk_id:
        return jsonify({"error": "Missing required parameter: clerk_id"}), 400

    flashcards_today = get_flashcards_with_today_study_date(clerk_id, course_name)
    return jsonify({"flashcards": flashcards_today}), 200


@app.route('/api/get_due_flashcards', methods=['GET'])
def route_get_due_flashcards():

    clerk_id = request.args.get('clerk_id')
    if not clerk_id:
        return jsonify({"error": "Not authorized, missing clerk id"}),400
    due_flashcards = get_due_flashcards(clerk_id)
    print(due_flashcards)
    return jsonify({"due_flashcards": due_flashcards}),200

@app.route('/api/update_times_seen', methods=['POST'])
def route_update_times_seen():
    """
    Updates the times_seen count for a specific flashcard.

    This endpoint accepts a POST request with JSON data containing the clerk_id, course_name, and card_id.
    
    Returns:
        tuple: A JSON response indicating success and HTTP status code.
    """
    data = request.json
    clerk_id = data.get('clerk_id')
    course_name = data.get('course_name')
    card_id = data.get('card_id')

    if not all([clerk_id, course_name, card_id]):
        return jsonify({"error": "Missing required fields"}), 400

    update_times_seen(clerk_id, course_name, card_id)
    return jsonify({"message": "Times seen updated successfully"}), 200

import traceback
from helpers.ai import generate_mc_questions

@app.route('/api/add_course_content', methods=['POST'])
def route_add_course_content():
    try:
        data = request.json
        print("Received data:", data)  # Log received data
        
        clerk_id = data.get('clerk_id')
        course_name = data.get('course_name')
        new_notes = data.get('notes')
        new_flashcards = data.get('flashcards')

        missing_fields = []
        if not clerk_id:
            missing_fields.append('clerk_id')
        if not course_name:
            missing_fields.append('course_name')
        if not new_notes:
            missing_fields.append('notes')
        if not new_flashcards:
            missing_fields.append('flashcards')

        if missing_fields:
            return jsonify({"error": f"Missing required fields: {', '.join(missing_fields)}"}), 400

        # Generate new MCQs based on the new notes
        new_mcqs = generate_mc_questions(new_notes)

        result = add_course_content(clerk_id, course_name, new_notes, new_flashcards, new_mcqs)
        
        if result:
            return jsonify({"success": True, "message": "Content and MCQs added successfully"}), 200
        else:
            return jsonify({"success": False, "message": "Failed to add content and MCQs. Check server logs for details."}), 500
    except Exception as e:
        print(f"Unexpected error in route_add_course_content: {str(e)}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({"error": "An unexpected error occurred", "details": str(e)}), 500


if __name__ == '__main__':
    
    app.run(debug=True, port=8080)
    
    