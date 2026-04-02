// Simple validation functions for meeting inputs

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Individual field validators
export const validateMeetingTitle = (title: string): string | null => {
  if (!title?.trim()) return 'Title is required';
  if (title.trim().length < 3) return 'Title must be at least 3 characters';
  return null;
};

export const validateMeetingTimes = (startTime: string, endTime: string): string | null => {
  if (!startTime) return 'Start time is required';
  if (!endTime) return 'End time is required';
  
  const start = new Date(startTime);
  const end = new Date(endTime);
  const now = new Date();
  
  if (start >= end) return 'End time must be after start time';
  if (start < new Date(now.getTime() + 5 * 60000)) return 'Start time must be at least 5 minutes in the future';
  
  const duration = end.getTime() - start.getTime();
  if (duration > 8 * 60 * 60 * 1000) return 'Meeting cannot exceed 8 hours';
  
  return null;
};

export const validateDescription = (description?: string): string | null => {
  if (description && description.length > 1000) return 'Description cannot exceed 1000 characters';
  return null;
};

export const validateEmail = (email: string): string | null => {
  if (!email?.trim()) return 'Email is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) return 'Invalid email format';
  return null;
};

export const validateParticipantName = (name?: string): string | null => {
  if (!name) return null; // Name is optional
  const nameRegex = /^[a-zA-Z\s\-']+$/;
  if (!nameRegex.test(name)) return 'Name can only contain letters, spaces, hyphens, and apostrophes';
  return null;
};

// Combined validators
export const validateCreateMeeting = (data: {
  title: string;
  startTime: string;
  endTime: string;
  description?: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  const titleError = validateMeetingTitle(data.title);
  if (titleError) errors.push(titleError);
  
  const timeError = validateMeetingTimes(data.startTime, data.endTime);
  if (timeError) errors.push(timeError);
  
  const descError = validateDescription(data.description);
  if (descError) errors.push(descError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateExternalEmail = (data: {
  email: string;
  name?: string;
}): ValidationResult => {
  const errors: string[] = [];
  
  const emailError = validateEmail(data.email);
  if (emailError) errors.push(emailError);
  
  const nameError = validateParticipantName(data.name);
  if (nameError) errors.push(nameError);
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Text sanitization
export const sanitizeText = (input: string): string => {
  return input
    .trim()
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, ''); // Remove control characters but keep unicode
};