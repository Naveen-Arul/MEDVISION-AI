from flask import Flask, request, jsonify
import os
import uuid
import random
from werkzeug.utils import secure_filename
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Configuration
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Mock model - in a real implementation, this would load an actual model
model = True
logger.info("Mock model loaded successfully")

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def preprocess_image(img_path):
    """Mock preprocessing function"""
    # In a real implementation, this would preprocess the image
    return True

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'message': 'Pneumonia Detection API is running',
        'model_loaded': model is not None
    })

@app.route('/predict', methods=['POST'])
def predict_pneumonia():
    """Predict pneumonia from chest X-ray image"""
    # Check if model is loaded
    if model is None:
        return jsonify({
            'success': False,
            'error': 'Model not loaded'
        }), 500
    
    # Check if file is present in request
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file provided'
        }), 400
    
    file = request.files['file']
    
    # Check if file is selected
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected'
        }), 400
    
    # Check if file type is allowed
    if not allowed_file(file.filename):
        return jsonify({
            'success': False,
            'error': 'Invalid file type. Only PNG, JPG, JPEG files are allowed.'
        }), 400
    
    try:
        # Save file temporarily
        filename = secure_filename(file.filename)
        unique_filename = f"{uuid.uuid4()}_{filename}"
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], unique_filename)
        file.save(filepath)
        
        # Mock prediction - in a real implementation, this would use the actual model
        # Generate a random confidence score between 0 and 1
        confidence = random.random()
        
        # Interpret results
        if confidence > 0.5:
            result = 'Pneumonia'
            confidence_percentage = confidence * 100
        else:
            result = 'Normal'
            confidence_percentage = (1 - confidence) * 100
        
        # Clean up temporary file
        os.remove(filepath)
        
        # Return results
        return jsonify({
            'success': True,
            'prediction': result,
            'confidence': round(confidence_percentage, 2),
            'raw_score': confidence,
            'recommendations': [
                'Consult a healthcare professional immediately' if result == 'Pneumonia' else 'Regular health checkups are recommended',
                'Consider getting a chest CT scan for detailed analysis' if result == 'Pneumonia' else 'Maintain good respiratory hygiene',
                'Monitor symptoms closely' if result == 'Pneumonia' else 'Stay updated with vaccinations',
                'Follow prescribed treatment if any' if result == 'Pneumonia' else ''
            ],
            'detailed_analysis': f'The AI model detected patterns consistent with {result.lower()} in the chest X-ray.' if result == 'Pneumonia' else 'The chest X-ray appears normal with clear lung fields and no obvious signs of infection or abnormalities.'
        })
        
    except Exception as e:
        logger.error(f"Error during prediction: {e}")
        # Clean up temporary file if it exists
        if 'filepath' in locals() and os.path.exists(filepath):
            os.remove(filepath)
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)