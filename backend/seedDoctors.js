const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./src/models/User');

const doctors = [
  {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@medvision.com',
    password: '123456',
    role: 'doctor',
    specialization: 'Cardiology',
    experience: 15,
    rating: 4.8,
    bio: 'Board-certified cardiologist with 15+ years of experience in interventional cardiology and heart disease prevention.',
    availability: {
      monday: ['09:00-17:00'],
      tuesday: ['09:00-17:00'],
      wednesday: ['09:00-17:00'],
      thursday: ['09:00-17:00'],
      friday: ['09:00-15:00']
    }
  },
  {
    name: 'Dr. Michael Chen',
    email: 'michael.chen@medvision.com',
    password: '123456',
    role: 'doctor',
    specialization: 'Pulmonology',
    experience: 12,
    rating: 4.9,
    bio: 'Pulmonologist specializing in respiratory diseases, pneumonia treatment, and lung health optimization.',
    availability: {
      monday: ['10:00-18:00'],
      tuesday: ['10:00-18:00'],
      wednesday: ['10:00-18:00'],
      thursday: ['10:00-18:00'],
      friday: ['10:00-16:00']
    }
  },
  {
    name: 'Dr. Emily Rodriguez',
    email: 'emily.rodriguez@medvision.com',
    password: '123456',
    role: 'doctor',
    specialization: 'Radiology',
    experience: 10,
    rating: 4.7,
    bio: 'Expert radiologist with focus on chest X-ray interpretation, CT scans, and diagnostic imaging.',
    availability: {
      monday: ['08:00-16:00'],
      tuesday: ['08:00-16:00'],
      wednesday: ['08:00-16:00'],
      thursday: ['08:00-16:00'],
      friday: ['08:00-14:00']
    }
  },
  {
    name: 'Dr. James Wilson',
    email: 'james.wilson@medvision.com',
    password: '123456',
    role: 'doctor',
    specialization: 'Internal Medicine',
    experience: 18,
    rating: 4.9,
    bio: 'Internal medicine specialist with expertise in chronic disease management and preventive care.',
    availability: {
      monday: ['09:00-17:00'],
      tuesday: ['09:00-17:00'],
      wednesday: ['09:00-17:00'],
      thursday: ['09:00-17:00'],
      friday: ['09:00-13:00']
    }
  },
  {
    name: 'Dr. Priya Patel',
    email: 'priya.patel@medvision.com',
    password: '123456',
    role: 'doctor',
    specialization: 'General Practice',
    experience: 8,
    rating: 4.6,
    bio: 'General practitioner providing comprehensive primary care and health consultations.',
    availability: {
      monday: ['08:00-18:00'],
      tuesday: ['08:00-18:00'],
      wednesday: ['08:00-18:00'],
      thursday: ['08:00-18:00'],
      friday: ['08:00-16:00'],
      saturday: ['09:00-13:00']
    }
  }
];

async function seedDoctors() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB Connected');

    console.log('\n🗑️  Removing existing doctors...');
    await User.deleteMany({ role: 'doctor' });
    console.log('✅ Existing doctors removed');

    console.log('\n👨‍⚕️  Creating new doctors...');
    for (const doctor of doctors) {
      // Hash password
      const salt = await bcrypt.genSalt(10);
      doctor.password = await bcrypt.hash(doctor.password, salt);
      
      const newDoctor = new User(doctor);
      await newDoctor.save();
      console.log(`✅ Created: ${doctor.name} (${doctor.specialization})`);
    }

    console.log('\n✨ Doctor seeding completed successfully!');
    console.log('\n📋 Login credentials for testing:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    doctors.forEach(doc => {
      console.log(`Email: ${doc.email}`);
      console.log(`Password: 123456`);
      console.log(`Role: Doctor (${doc.specialization})`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding doctors:', error);
    process.exit(1);
  }
}

seedDoctors();
