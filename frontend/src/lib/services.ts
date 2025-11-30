// API Services for different features
import apiClient, { APIResponse, User, AIAnalysis, Chat, Consultation } from './api';

// Authentication Services
export const authService = {
  // Register new user
  register: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: 'patient' | 'doctor';
  }): Promise<APIResponse<{
    user: User;
    token: string;
  }>> => {
    const response = await apiClient.post<{
      user: User;
      token: string;
    }>('/auth/register', userData);
    
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }
    
    return response;
  },

  // Login user
  login: async (credentials: {
    email: string;
    password: string;
    role?: 'patient' | 'doctor';
  }): Promise<APIResponse<{
    user: User;
    token: string;
  }>> => {
    const response = await apiClient.post<{
      user: User;
      token: string;
    }>('/auth/login', credentials);
    
    if (response.success && response.data?.token) {
      apiClient.setToken(response.data.token);
    }
    
    return response;
  },

  // Logout user
  logout: async (): Promise<APIResponse> => {
    const response = await apiClient.post('/auth/logout');
    apiClient.setToken(null);
    return response;
  },

  // Verify token
  verifyToken: async (): Promise<APIResponse<{
    user: User;
  }>> => {
    return apiClient.get('/auth/verify');
  },

  // Get stored token
  getToken: (): string | null => {
    return localStorage.getItem('auth_token');
  },

  // Set token
  setToken: (token: string | null): void => {
    apiClient.setToken(token);
  }
};

// User Services
export const userService = {
  // Get user profile
  getProfile: async (): Promise<APIResponse<User>> => {
    return apiClient.get('/users/profile');
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User['profile']>): Promise<APIResponse<User>> => {
    return apiClient.put('/users/profile', profileData);
  },

  // Change password
  changePassword: async (passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<APIResponse> => {
    return apiClient.post('/users/change-password', passwordData);
  },

  // Get dashboard data
  getDashboard: async (): Promise<APIResponse<{
    user: User;
    recentAnalyses: AIAnalysis[];
    recentChats: Chat[];
    stats: {
      totalAnalyses: number;
      totalChats: number;
      lastLogin: string;
    };
  }>> => {
    return apiClient.get('/users/dashboard');
  },

  // Deactivate account
  deactivateAccount: async (): Promise<APIResponse> => {
    return apiClient.delete('/users/account');
  }
};

// AI Analysis Services
export const aiService = {
  // Upload and analyze image
  analyzeImage: async (file: File, analysisType: string = 'chest_xray'): Promise<APIResponse<AIAnalysis>> => {
    return apiClient.uploadFile('/ai/analyze', file, { analysisType });
  },

  // Get user's analyses
  getAnalyses: async (page: number = 1, limit: number = 20): Promise<APIResponse<{
    analyses: AIAnalysis[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> => {
    return apiClient.get(`/ai/analyses?page=${page}&limit=${limit}`);
  },

  // Get specific analysis
  getAnalysis: async (analysisId: string): Promise<APIResponse<AIAnalysis>> => {
    return apiClient.get(`/ai/analysis/${analysisId}`);
  },

  // Delete analysis
  deleteAnalysis: async (analysisId: string): Promise<APIResponse> => {
    return apiClient.delete(`/ai/analysis/${analysisId}`);
  },

  // Provide feedback on analysis
  provideFeedback: async (analysisId: string, feedback: {
    rating: number;
    comments?: string;
    isAccurate: boolean;
  }): Promise<APIResponse> => {
    return apiClient.post(`/ai/analysis/${analysisId}/feedback`, feedback);
  },

  // Get AI usage analytics
  getAnalytics: async (): Promise<APIResponse<{
    totalAnalyses: number;
    analyticsByType: any[];
    recentAnalyses: AIAnalysis[];
  }>> => {
    return apiClient.get('/ai/analytics');
  }
};

// Chat Services
export const chatService = {
  // Get user's chats
  getChats: async (page: number = 1, limit: number = 20, type?: string): Promise<APIResponse<{
    chats: Chat[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> => {
    let url = `/chat?page=${page}&limit=${limit}`;
    if (type) url += `&type=${type}`;
    return apiClient.get(url);
  },

  // Get user's chats (alias for compatibility)
  getUserChats: async (page: number = 1, limit: number = 20, type?: string): Promise<APIResponse<{
    chats: Chat[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> => {
    return chatService.getChats(page, limit, type);
  },

  // Get chat messages
  getChatMessages: async (chatId: string, page: number = 1, limit: number = 50): Promise<APIResponse<{
    messages: any[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> => {
    return apiClient.get(`/chat/${chatId}/messages?page=${page}&limit=${limit}`);
  },

  // Mark messages as read
  markAsRead: async (chatId: string): Promise<APIResponse> => {
    return apiClient.post(`/chat/${chatId}/mark-read`);
  },

  // Create new chat
  createChat: async (chatData: {
    title?: string;
    chatType: 'personal_ai' | 'doctor_consultation' | 'group_support' | 'emergency';
    participants?: string[];
  }): Promise<APIResponse<Chat>> => {
    return apiClient.post('/chat', chatData);
  },

  // Get specific chat with messages
  getChat: async (chatId: string): Promise<APIResponse<Chat>> => {
    return apiClient.get(`/chat/${chatId}`);
  },

  // Send message to chat
  sendMessage: async (chatId: string, messageData: {
    content: {
      text?: string;
    };
    messageType?: 'text' | 'ai_result' | 'image' | 'document';
    aiAnalysisId?: string;
  }): Promise<APIResponse<any>> => {
    return apiClient.post(`/chat/${chatId}/messages`, messageData);
  },

  // Get medical AI assistance
  getMedicalAssistance: async (query: string): Promise<APIResponse<{
    query: string;
    response: string;
  }>> => {
    return apiClient.post('/chat/medical-assistant', { query });
  },

  // Update chat settings
  updateChat: async (chatId: string, updates: {
    title?: string;
    settings?: any;
  }): Promise<APIResponse<Chat>> => {
    return apiClient.put(`/chat/${chatId}`, updates);
  },

  // Delete chat
  deleteChat: async (chatId: string): Promise<APIResponse> => {
    return apiClient.delete(`/chat/${chatId}`);
  }
};

// Analytics Services
export const analyticsService = {
  // Get overview analytics
  getOverview: async (range: number = 30): Promise<APIResponse<{
    timeRange: number;
    analysis: {
      summary: {
        total: number;
        pneumoniaDetected: number;
        normalResults: number;
        avgConfidence: number;
        avgProcessingTime: number;
      };
      dailyTrend: any[];
    };
    chat: {
      byType: any[];
      totalChats: number;
      totalMessages: number;
    };
    recentActivity: AIAnalysis[];
  }>> => {
    return apiClient.get(`/analytics/overview?range=${range}`);
  },

  // Get health trends
  getHealthTrends: async (months: number = 6): Promise<APIResponse<{
    timeRange: string;
    trends: any[];
    riskAssessment: any[];
    recommendations: string[];
    summary: {
      totalPeriods: number;
      overallPneumoniaRate: number;
    };
  }>> => {
    return apiClient.get(`/analytics/health-trends?months=${months}`);
  },

  // Get comparison analytics
  getComparison: async (): Promise<APIResponse<{
    user: {
      analyses: number;
      pneumoniaRate: number;
      avgConfidence: number;
    };
    population: {
      totalUsers: number;
      totalAnalyses: number;
      avgPneumoniaRate: number;
      avgConfidence: number;
    };
    insights: string[];
  }>> => {
    return apiClient.get('/analytics/comparison');
  }
};

// Consultation Services
export const consultationService = {
  // Get user's consultations
  getConsultations: async (page: number = 1, limit: number = 20, status?: string, type?: string): Promise<APIResponse<{
    consultations: Consultation[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> => {
    let url = `/consultations?page=${page}&limit=${limit}`;
    if (status) url += `&status=${status}`;
    if (type) url += `&type=${type}`;
    return apiClient.get(url);
  },

  // Get all consultations (for doctor patients page)
  getAll: async (): Promise<APIResponse<{
    consultations: Consultation[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> => {
    return apiClient.get('/consultations');
  },

  // Get upcoming consultations
  getUpcoming: async (): Promise<APIResponse<Consultation[]>> => {
    return apiClient.get('/consultations/upcoming');
  },

  // Get available doctors
  getDoctors: async (specialization?: string, available?: boolean): Promise<APIResponse<User[]>> => {
    let url = '/consultations/doctors';
    const params = [];
    if (specialization) params.push(`specialization=${specialization}`);
    if (available !== undefined) params.push(`available=${available}`);
    if (params.length > 0) url += `?${params.join('&')}`;
    return apiClient.get(url);
  },

  // Get doctor availability for a specific date
  getAvailability: async (doctorId: string, date: string): Promise<APIResponse<{
    date: string;
    doctor: {
      id: string;
      name: string;
      specialization: string;
    };
    availableSlots: Array<{
      time: string;
      display: string;
    }>;
    bookedSlots: number;
  }>> => {
    return apiClient.get(`/consultations/availability/${doctorId}?date=${date}`);
  },

  // Book a new consultation
  bookConsultation: async (consultationData: {
    doctorId: string;
    scheduledDateTime: string;
    type: 'routine' | 'follow_up' | 'urgent' | 'second_opinion' | 'emergency';
    specialization?: 'general' | 'pulmonology' | 'radiology' | 'cardiology' | 'oncology';
    reason: string;
    symptoms?: string[];
    duration?: number;
  }): Promise<APIResponse<Consultation>> => {
    return apiClient.post('/consultations', consultationData);
  },

  // Get specific consultation
  getConsultation: async (consultationId: string): Promise<APIResponse<Consultation>> => {
    return apiClient.get(`/consultations/${consultationId}`);
  },

  // Update consultation status
  updateStatus: async (consultationId: string, status: string, cancelReason?: string): Promise<APIResponse<Consultation>> => {
    return apiClient.put(`/consultations/${consultationId}/status`, { status, cancelReason });
  },

  // Start video consultation
  startVideo: async (consultationId: string): Promise<APIResponse<{
    roomId: string;
    jitsiRoomName: string;
    participants: {
      patient: User;
      doctor: User;
    };
  }>> => {
    return apiClient.post(`/consultations/${consultationId}/start-video`);
  },

  // End video consultation
  endVideo: async (consultationId: string): Promise<APIResponse<Consultation>> => {
    return apiClient.post(`/consultations/${consultationId}/end-video`);
  },

  // Add/update doctor notes (doctor only)
  updateNotes: async (consultationId: string, notes: {
    diagnosis?: string;
    recommendations?: string;
    prescription?: Array<{
      medication: string;
      dosage: string;
      frequency: string;
      duration: string;
      notes?: string;
    }>;
    followUpRequired?: boolean;
    followUpDate?: string;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }): Promise<APIResponse<Consultation>> => {
    return apiClient.put(`/consultations/${consultationId}/notes`, notes);
  }
};

// Doctor Services
export const doctorService = {
  // Get all doctors
  getAllDoctors: async (page: number = 1, limit: number = 20): Promise<APIResponse<{
    doctors: any[];
    pagination: {
      current: number;
      pages: number;
      total: number;
      limit: number;
    };
  }>> => {
    return apiClient.get(`/doctors?page=${page}&limit=${limit}`);
  },

  // Get doctor availability
  getAvailability: async (doctorId: string, date: string): Promise<APIResponse<any[]>> => {
    return apiClient.get(`/doctors/${doctorId}/availability?date=${date}`);
  }
};

// Export all services
export const api = {
  auth: authService,
  user: userService,
  ai: aiService,
  chat: chatService,
  analytics: analyticsService,
  consultation: consultationService,
  doctor: doctorService
};

export default api;