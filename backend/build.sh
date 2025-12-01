#!/bin/bash
# Render build script for MedVision AI Backend

echo "🏥 MedVision AI Backend - Render Build Started"
echo "Installing dependencies..."
npm ci --only=production

echo "Creating uploads directory..."
mkdir -p uploads

echo "Setting proper permissions..."
chmod 755 uploads

echo "Build completed successfully!"
echo "🚀 Ready to start MedVision AI Backend"