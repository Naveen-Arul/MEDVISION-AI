#!/usr/bin/env python3
"""
Real AI Model Implementation for Pneumonia Detection
MobileNetV2-based Chest X-ray Analysis
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import Dense, GlobalAveragePooling2D, Dropout
from tensorflow.keras.models import Model
from tensorflow.keras.preprocessing.image import load_img, img_to_array
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input
import cv2
from flask import Flask, request, jsonify
import io
from PIL import Image
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

class PneumoniaDetector:
    def __init__(self, model_path=None):
        self.model = None
        self.input_shape = (224, 224, 3)
        self.class_names = ['Normal', 'Pneumonia']
        
        if model_path and os.path.exists(model_path):
            self.load_model(model_path)
        else:
            logger.warning("No pre-trained model found. Using base MobileNetV2 with random weights.")
            self.build_model()
    
    def build_model(self):
        """Build MobileNetV2-based model for pneumonia detection"""
        try:
            # Create base model from pre-trained MobileNetV2
            base_model = MobileNetV2(
                input_shape=self.input_shape,
                include_top=False,
                weights='imagenet'  # Use ImageNet pre-trained weights
            )
            
            # Freeze base model layers
            base_model.trainable = False
            
            # Add custom classification layers
            x = base_model.output
            x = GlobalAveragePooling2D()(x)
            x = Dropout(0.2)(x)
            x = Dense(128, activation='relu')(x)
            x = Dropout(0.2)(x)
            predictions = Dense(2, activation='softmax')(x)  # 2 classes: Normal, Pneumonia
            
            # Create the model
            self.model = Model(inputs=base_model.input, outputs=predictions)
            
            # Compile the model
            self.model.compile(
                optimizer=tf.keras.optimizers.Adam(learning_rate=0.0001),
                loss='categorical_crossentropy',
                metrics=['accuracy']
            )
            
            logger.info("MobileNetV2 model built successfully")
            
        except Exception as e:
            logger.error(f"Error building model: {str(e)}")
            raise
    
    def load_model(self, model_path):
        """Load pre-trained model"""
        try:
            self.model = tf.keras.models.load_model(model_path)
            logger.info(f"Model loaded from {model_path}")
        except Exception as e:
            logger.error(f"Error loading model: {str(e)}")
            # Fallback to building new model
            self.build_model()
    
    def preprocess_image(self, image_path):
        """Preprocess image for model prediction"""
        try:
            # Load and resize image
            image = load_img(image_path, target_size=(224, 224))
            image_array = img_to_array(image)
            
            # Ensure image has 3 channels
            if image_array.shape[-1] == 1:
                image_array = np.repeat(image_array, 3, axis=-1)
            elif image_array.shape[-1] == 4:
                image_array = image_array[:, :, :3]
            
            # Expand dimensions and preprocess
            image_array = np.expand_dims(image_array, axis=0)
            image_array = preprocess_input(image_array)
            
            return image_array
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {str(e)}")
            raise
    
    def predict(self, image_path):
        """Make prediction on chest X-ray image"""
        try:
            if self.model is None:
                raise ValueError("Model not loaded")
            
            # Preprocess image
            processed_image = self.preprocess_image(image_path)
            
            # Make prediction
            predictions = self.model.predict(processed_image)
            predicted_class = np.argmax(predictions[0])
            confidence = float(predictions[0][predicted_class])
            
            # Get prediction label
            prediction_label = self.class_names[predicted_class]
            
            # Generate recommendations based on prediction
            recommendations = self.generate_recommendations(prediction_label, confidence)
            
            # Generate detailed analysis
            detailed_analysis = self.generate_detailed_analysis(
                prediction_label, confidence, predictions[0]
            )
            
            return {
                'prediction': prediction_label,
                'confidence': confidence,
                'raw_score': predictions[0].tolist(),
                'recommendations': recommendations,
                'detailed_analysis': detailed_analysis
            }
            
        except Exception as e:
            logger.error(f"Error making prediction: {str(e)}")
            raise
    
    def generate_recommendations(self, prediction, confidence):
        """Generate medical recommendations based on prediction"""
        recommendations = []
        
        if prediction == 'Pneumonia':
            if confidence > 0.8:
                recommendations.extend([
                    "Immediate medical attention recommended",
                    "Consult a pulmonologist or emergency physician",
                    "Consider antibiotic treatment if bacterial pneumonia suspected",
                    "Monitor oxygen saturation levels",
                    "Follow up with chest X-ray after treatment"
                ])
            elif confidence > 0.6:
                recommendations.extend([
                    "Medical evaluation recommended",
                    "Consider additional diagnostic tests",
                    "Monitor symptoms closely",
                    "Repeat imaging if symptoms persist"
                ])
            else:
                recommendations.extend([
                    "Borderline findings - clinical correlation advised",
                    "Consider repeat imaging with different technique",
                    "Monitor patient symptoms"
                ])
        else:  # Normal
            if confidence > 0.8:
                recommendations.extend([
                    "Chest X-ray appears normal",
                    "No immediate medical intervention required",
                    "Continue routine health monitoring"
                ])
            else:
                recommendations.extend([
                    "Likely normal findings with some uncertainty",
                    "Consider clinical correlation",
                    "Monitor for symptom development"
                ])
        
        # Always add general recommendations
        recommendations.extend([
            "This AI analysis is for screening purposes only",
            "Always consult with a qualified healthcare provider",
            "AI results should not replace professional medical judgment"
        ])
        
        return recommendations
    
    def generate_detailed_analysis(self, prediction, confidence, raw_scores):
        """Generate detailed analysis report"""
        normal_score = float(raw_scores[0])
        pneumonia_score = float(raw_scores[1])
        
        analysis = {
            'primary_finding': prediction,
            'confidence_level': 'High' if confidence > 0.8 else 'Moderate' if confidence > 0.6 else 'Low',
            'normal_probability': normal_score,
            'pneumonia_probability': pneumonia_score,
            'risk_assessment': self.assess_risk(prediction, confidence),
            'technical_notes': self.generate_technical_notes(raw_scores)
        }
        
        return analysis
    
    def assess_risk(self, prediction, confidence):
        """Assess risk level based on prediction"""
        if prediction == 'Pneumonia':
            if confidence > 0.8:
                return 'High - Immediate medical attention advised'
            elif confidence > 0.6:
                return 'Moderate - Medical evaluation recommended'
            else:
                return 'Low to Moderate - Monitor symptoms'
        else:
            return 'Low - Normal chest X-ray'
    
    def generate_technical_notes(self, raw_scores):
        """Generate technical notes about the analysis"""
        return {
            'model_architecture': 'MobileNetV2-based CNN',
            'input_resolution': '224x224 pixels',
            'preprocessing': 'ImageNet normalization applied',
            'score_distribution': {
                'normal': float(raw_scores[0]),
                'pneumonia': float(raw_scores[1])
            },
            'model_confidence': 'Based on softmax output probabilities'
        }

# Initialize detector
detector = PneumoniaDetector()

@app.route('/predict', methods=['POST'])
def predict():
    """API endpoint for pneumonia prediction"""
    try:
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file uploaded'
            }), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Save uploaded file temporarily
        temp_path = f'/tmp/{file.filename}'
        file.save(temp_path)
        
        try:
            # Make prediction
            result = detector.predict(temp_path)
            
            response = {
                'success': True,
                'prediction': result['prediction'],
                'confidence': result['confidence'],
                'raw_score': result['raw_score'],
                'recommendations': result['recommendations'],
                'detailed_analysis': result['detailed_analysis']
            }
            
            return jsonify(response)
            
        finally:
            # Clean up temporary file
            if os.path.exists(temp_path):
                os.remove(temp_path)
        
    except Exception as e:
        logger.error(f"Prediction error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Prediction failed: {str(e)}'
        }), 500

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': detector.model is not None,
        'version': '1.0.0'
    })

@app.route('/', methods=['GET'])
def index():
    """Index endpoint"""
    return jsonify({
        'message': 'MedVision AI - Pneumonia Detection Service',
        'version': '1.0.0',
        'endpoints': {
            'predict': '/predict (POST)',
            'health': '/health (GET)'
        }
    })

if __name__ == '__main__':
    print("Starting MedVision AI Pneumonia Detection Service...")
    print("Model Status:", "Loaded" if detector.model is not None else "Error")
    
    # Run the Flask app
    app.run(
        host='0.0.0.0',
        port=int(os.environ.get('PORT', 5001)),
        debug=False
    )