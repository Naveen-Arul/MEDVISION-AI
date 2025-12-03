// API Configuration for MERN Backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://medvision-ai-d10f.onrender.com/api';

// API Client class for handling requests
class APIClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.loadToken();
  }

  // Load token from localStorage
  private loadToken(): void {
    this.token = localStorage.getItem('auth_token');
  }

  // Set authentication token
  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  // Get authentication headers
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic request method
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // HTTP methods
  async get<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // File upload method
  async uploadFile<T>(endpoint: string, file: File, additionalData?: any): Promise<APIResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    const headers: HeadersInit = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers,
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error('File upload failed:', error);
      throw error;
    }
  }
}

// Create and export API client instance
const apiClient = new APIClient(API_BASE_URL);
export default apiClient;

// Type definitions
export interface APIResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface User {
  _id: string;
  id: string; // Add id field for compatibility
  name: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  profile: {
    avatar?: string;
    bio?: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: 'male' | 'female' | 'other';
    address?: {
      street?: string;
      city?: string;
      state?: string;
      zipCode?: string;
      country?: string;
    };
    medicalHistory?: string[];
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    // Doctor-specific fields
    specialization?: 'general' | 'pulmonology' | 'radiology' | 'cardiology' | 'oncology';
    licenseNumber?: string;
    experience?: number;
    consultationFee?: number;
    rating?: number;
    isActive?: boolean;
  };
  isEmailVerified: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

// Doctor type for compatibility
export interface Doctor {
  _id: string;
  name: string;
  specialization: string;
  department: string;
  experience: number;
  rating: number;
  consultationFee: number;
  availability?: any[];
}

export interface AIAnalysis {
  _id: string;
  userId: string;
  analysisType: 'chest_xray' | 'blood_test' | 'ecg';
  imageUrl?: string;
  result: {
    diagnosis: string;
    confidence?: number;
    rawScore?: number;
    riskFactors?: Array<{
      factor: string;
      severity: 'low' | 'medium' | 'high';
      description: string;
    }>;
    recommendations?: string[];
    detailedAnalysis?: string;
  };
  processingTime: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  riskLevel?: 'normal' | 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
}

export interface Chat {
  _id: string;
  participants: Array<{
    _id: string;
    user: User;
    name: string; // Add name field for compatibility
    role: 'user' | 'ai' | 'doctor';
    joinedAt: string;
  }>;
  messages: Message[];
  lastMessage?: Message; // Add lastMessage field
  chatType: 'personal_ai' | 'doctor_consultation' | 'group_support' | 'emergency';
  title: string;
  isActive: boolean;
  lastActivity: string;
  unreadCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  _id: string;
  chatId: string; // Add chatId field
  sender: {
    _id: string;
    name: string;
  };
  senderType: 'user' | 'ai' | 'system';
  content: string; // Simplify content to string
  messageType: 'text' | 'ai_result' | 'image' | 'document' | 'system_notification';
  deliveredAt?: string;
  readAt?: string;
  timestamp: string;
  createdAt: string;
}

export interface Consultation {
  _id: string;
  patient: User;
  doctor: User;
  scheduledDateTime: string;
  duration: number;
  timezone: string;
  type: 'routine' | 'follow_up' | 'urgent' | 'second_opinion' | 'emergency';
  specialization: 'general' | 'pulmonology' | 'radiology' | 'cardiology' | 'oncology';
  reason: string;
  symptoms: string[];
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  videoCall: {
    roomId?: string;
    jitsiRoomName?: string;
    startedAt?: string;
    endedAt?: string;
    recordingUrl?: string;
  };
  relatedAnalysis: AIAnalysis[];
  chatRoom?: Chat;
  doctorNotes?: {
    diagnosis?: string;
    prescription?: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      notes?: string;
    }>;
    recommendations?: string;
    followUpRequired?: boolean;
    followUpDate?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  };
  billing: {
    fee: number;
    currency: string;
    paymentStatus: 'pending' | 'paid' | 'refunded' | 'failed';
    paymentMethod?: string;
    transactionId?: string;
  };
  createdAt: string;
  updatedAt: string;
}