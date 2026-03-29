/**
 * St. Josephine Mara Hospital - Main Application
 * Version: 1.0
 * Purpose: Form handling, validation, UI interactions, and lightbox functionality
 */

// ==============================
// DOM Elements
// ==============================
document.querySelector('form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  await fetch('/book', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' }
  })
  .then(() => alert('Appointment booked!'))
  .catch(() => alert('Error booking appointment'));
});
const DOM = {
  // Form elements
  form: document.getElementById('appointmentForm'),
  submitBtn: document.getElementById('submitBtn'),
  
  // Form fields
  firstName: document.getElementById('apptFirst'),
  lastName: document.getElementById('apptLast'),
  email: document.getElementById('apptEmail'),
  phone: document.getElementById('apptPhone'),
  department: document.getElementById('apptDept'),
  date: document.getElementById('apptDate'),
  time: document.getElementById('apptTime'),
  notes: document.getElementById('apptNotes'),
  
  // Toast
  toast: document.getElementById('toast'),
  
  // Mobile menu
  mobileMenu: document.getElementById('mobileMenu')
};

// ==============================
// Rate Limiter (Client-side)
// ==============================
class RateLimiter {
  constructor() {
    this.storageKey = 'sjmh_appointment_rate';
    this.maxPerHour = 5;
  }

  check() {
    const records = this.getRecords();
    const now = Date.now();
    const hourAgo = now - 60 * 60 * 1000;
    
    const hourlySubmissions = records.filter(r => r.timestamp > hourAgo);
    
    if (hourlySubmissions.length >= this.maxPerHour) {
      const oldestRecent = hourlySubmissions[0];
      const waitUntil = oldestRecent.timestamp + (60 * 60 * 1000);
      const waitMinutes = Math.ceil((waitUntil - now) / 60000);
      
      return {
        allowed: false,
        message: `Too many submissions. Please try again in ${waitMinutes} minute${waitMinutes !== 1 ? 's' : ''}.`
      };
    }
    
    return { allowed: true, message: null };
  }

  record() {
    const records = this.getRecords();
    records.push({
      timestamp: Date.now(),
      id: Math.random().toString(36).substring(2, 10)
    });
    
    // Keep only last 24 hours
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const filtered = records.filter(r => r.timestamp > dayAgo);
    localStorage.setItem(this.storageKey, JSON.stringify(filtered));
  }

  getRecords() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (e) {
      return [];
    }
  }
}

// ==============================
// Form Validator
// ==============================
class FormValidator {
  
  static validateEmail(email) {
    const regex = /^[^\s@]+@([^\s@]+\.)+[^\s@]+$/;
    return regex.test(email);
  }

  static validateKenyanPhone(phone) {
    // Accepts: 0712345678, +254712345678, 254712345678
    const regex = /^(\+254|0|254)[7-9][0-9]{8}$/;
    return regex.test(phone);
  }

  static validateField(fieldId, value) {
    switch (fieldId) {
      case 'firstName':
      case 'lastName':
        if (!value || value.trim() === '') {
          return { valid: false, message: 'This field is required' };
        }
        if (value.trim().length < 2) {
          return { valid: false, message: 'Must be at least 2 characters' };
        }
        return { valid: true, message: '' };
        
      case 'email':
        if (!value || value.trim() === '') {
          return { valid: false, message: 'Email is required' };
        }
        if (!this.validateEmail(value.trim())) {
          return { valid: false, message: 'Enter a valid email address' };
        }
        return { valid: true, message: '' };
        
      case 'phone':
        if (!value || value.trim() === '') {
          return { valid: false, message: 'Phone number is required' };
        }
        if (!this.validateKenyanPhone(value.trim())) {
          return { valid: false, message: 'Enter a valid Kenyan phone (e.g., 0712345678 or +254712345678)' };
        }
        return { valid: true, message: '' };
        
      case 'department':
        if (!value || value === '' || value === 'Select Department') {
          return { valid: false, message: 'Please select a department' };
        }
        return { valid: true, message: '' };
        
      case 'date':
        if (!value) {
          return { valid: false, message: 'Please select a date' };
        }
        const today = new Date().toISOString().split('T')[0];
        if (value < today) {
          return { valid: false, message: 'Date cannot be in the past' };
        }
        return { valid: true, message: '' };
        
      case 'time':
        if (!value || value === '' || value === 'Select Time') {
          return { valid: false, message: 'Please select a time' };
        }
        return { valid: true, message: '' };
        
      default:
        return { valid: true, message: '' };
    }
  }

  static showFieldError(fieldId, message) {
    const errorDiv = document.getElementById(`${fieldId}-error`);
    if (errorDiv) {
      errorDiv.textContent = message;
    }
    const input = document.getElementById(`appt${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
    if (input) {
      input.classList.add('error');
    }
  }

  static clearFieldError(fieldId) {
    const errorDiv = document.getElementById(`${fieldId}-error`);
    if (errorDiv) {
      errorDiv.textContent = '';
    }
    const input = document.getElementById(`appt${fieldId.charAt(0).toUpperCase() + fieldId.slice(1)}`);
    if (input) {
      input.classList.remove('error');
    }
  }

  static validateAll(formData) {
    const fields = ['firstName', 'lastName', 'email', 'phone', 'department', 'date', 'time'];
    let isValid = true;
    
    for (const field of fields) {
      const value = formData[field];
      const result = this.validateField(field, value);
      if (!result.valid) {
        this.showFieldError(field, result.message);
        isValid = false;
      } else {
        this.clearFieldError(field);
      }
    }
    
    return isValid;
  }
}

// ==============================
// Appointment Form Handler
// ==============================
class AppointmentFormHandler {
  constructor() {
    this.rateLimiter = new RateLimiter();
    this.init();
  }

  init() {
    if (!DOM.form) return;
    
    // Set min date to today
    if (DOM.date) {
      const today = new Date().toISOString().split('T')[0];
      DOM.date.min = today;
      // Max date: 90 days from now
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 90);
      DOM.date.max = maxDate.toISOString().split('T')[0];
    }
    
    // Add submit listener
    DOM.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.submit();
    });
    
    // Add real-time validation on blur
    this.addRealTimeValidation();
  }

  addRealTimeValidation() {
    const fields = ['firstName', 'lastName', 'email', 'phone', 'department', 'date', 'time'];
    
    for (const field of fields) {
      const input = document.getElementById(`appt${field.charAt(0).toUpperCase() + field.slice(1)}`);
      if (input) {
        input.addEventListener('blur', () => {
          const value = input.value;
          const result = FormValidator.validateField(field, value);
          if (!result.valid) {
            FormValidator.showFieldError(field, result.message);
          } else {
            FormValidator.clearFieldError(field);
          }
        });
        
        input.addEventListener('input', () => {
          FormValidator.clearFieldError(field);
        });
      }
    }
  }

  getFormData() {
    return {
      firstName: DOM.firstName ? DOM.firstName.value.trim() : '',
      lastName: DOM.lastName ? DOM.lastName.value.trim() : '',
      email: DOM.email ? DOM.email.value.trim() : '',
      phone: DOM.phone ? DOM.phone.value.trim() : '',
      department: DOM.department ? DOM.department.value : '',
      date: DOM.date ? DOM.date.value : '',
      time: DOM.time ? DOM.time.value : '',
      notes: DOM.notes ? DOM.notes.value.trim() : ''
    };
  }

  async submit() {
    const formData = this.getFormData();
    
    // Validate form
    if (!FormValidator.validateAll(formData)) {
      this.showToast('Please fix the errors above', 'error');
      return;
    }
    
    // Check rate limit
    const rateLimit = this.rateLimiter.check();
    if (!rateLimit.allowed) {
      this.showToast(rateLimit.message, 'error');
      return;
    }
    
    // Set loading state
    this.setLoading(true);
    
    try {
      const response = await fetch('/api/submit-appointment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const result = await response.json();
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Failed to submit appointment');
      }

      // Keep local copy for simple browser-side history/debugging.
      if (result.appointment) {
        this.saveToLocalStorage(result.appointment);
      }

      this.rateLimiter.record();
      this.showSuccess();
      this.resetForm();
      console.log('Appointment submitted:', result.id);
      
    } catch (error) {
      console.error('Submission error:', error);
      this.showToast('Network error. Please check your connection.', 'error');
    } finally {
      this.setLoading(false);
    }
  }

  saveToLocalStorage(appointment) {
    try {
      const existing = localStorage.getItem('sjmh_appointments');
      const appointments = existing ? JSON.parse(existing) : [];
      appointments.push(appointment);
      localStorage.setItem('sjmh_appointments', JSON.stringify(appointments));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }
  }

  resetForm() {
    if (DOM.form) {
      DOM.form.reset();
    }
    // Clear all error messages
    const fields = ['firstName', 'lastName', 'email', 'phone', 'department', 'date', 'time'];
    fields.forEach(field => FormValidator.clearFieldError(field));
  }

  setLoading(loading) {
    if (!DOM.submitBtn) return;
    
    if (loading) {
      DOM.submitBtn.disabled = true;
      DOM.submitBtn.innerHTML = '<span class="spinner" style="display:inline-block;width:16px;height:16px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;margin-right:8px;"></span> Sending...';
    } else {
      DOM.submitBtn.disabled = false;
      DOM.submitBtn.innerHTML = 'Book Appointment →';
    }
  }

  showSuccess() {
    this.showToast('✓ Appointment sent successfully! You will receive confirmation via email.', 'success');
    
    // Scroll to top to show success message
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  showToast(message, type = 'info') {
    if (!DOM.toast) return;
    
    DOM.toast.textContent = message;
    DOM.toast.className = `toast ${type} show`;
    
    setTimeout(() => {
      DOM.toast.classList.remove('show');
    }, 5000);
  }
}

// ==============================
// Lightbox Gallery
// ==============================
const lightboxImages = [
  'images/A4.jpg',   // Operating Theatre
  'images/A3.jpg',   // Hospital Overview
  'images/A5.jpg',   // Imaging & Maternity
  'images/A8.jpg',   // Pharmacy
  'images/A11.jpg'   // Hospital Exterior
];

let currentImageIndex = 0;

function openLB(index) {
  currentImageIndex = index;
  const lightbox = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  if (lightbox && lbImg) {
    lbImg.src = lightboxImages[index];
    lightbox.classList.add('open');
  }
}

function closeLB() {
  const lightbox = document.getElementById('lightbox');
  if (lightbox) {
    lightbox.classList.remove('open');
  }
}

function moveLB(direction) {
  currentImageIndex = (currentImageIndex + direction + lightboxImages.length) % lightboxImages.length;
  const lbImg = document.getElementById('lbImg');
  if (lbImg) {
    lbImg.src = lightboxImages[currentImageIndex];
  }
}

// Close lightbox with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeLB();
  }
});

// ==============================
// Scroll to Section
// ==============================
function scrollToSection(sectionId) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function scrollToHome() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ==============================
// Mobile Menu
// ==============================
function openMobile() {
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) {
    mobileMenu.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
}

function closeMobile() {
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) {
    mobileMenu.classList.remove('open');
    document.body.style.overflow = '';
  }
}

// ==============================
// Scroll Reveal Animation
// ==============================
function initScrollReveal() {
  const revealElements = document.querySelectorAll('.reveal');
  
  // Add visible class to all elements immediately (fallback)
  revealElements.forEach(el => {
    el.classList.add('visible');
  });
  
  // Use Intersection Observer for better animation
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    
    revealElements.forEach(el => {
      el.classList.remove('visible');
      observer.observe(el);
    });
  }
}

// ==============================
// Add Spinner Animation Style
// ==============================
function addSpinnerStyles() {
  if (!document.querySelector('#spinner-styles')) {
    const style = document.createElement('style');
    style.id = 'spinner-styles';
    style.textContent = `
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
  }
}

// ==============================
// Initialize on DOM Load
// ==============================
document.addEventListener('DOMContentLoaded', () => {
  // Initialize form handler
  window.appointmentForm = new AppointmentFormHandler();
  
  // Initialize scroll reveal
  initScrollReveal();
  
  // Add spinner styles
  addSpinnerStyles();
  
  // Close mobile menu when clicking outside (for touch devices)
  document.addEventListener('click', (e) => {
    const mobileMenu = document.getElementById('mobileMenu');
    const hamburger = document.querySelector('.hamburger');
    if (mobileMenu && mobileMenu.classList.contains('open')) {
      if (!mobileMenu.contains(e.target) && !hamburger?.contains(e.target)) {
        closeMobile();
      }
    }
  });
  
  // Prevent body scroll when mobile menu is open
  const mobileMenu = document.getElementById('mobileMenu');
  if (mobileMenu) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          if (mobileMenu.classList.contains('open')) {
            document.body.style.overflow = 'hidden';
          } else {
            document.body.style.overflow = '';
          }
        }
      });
    });
    observer.observe(mobileMenu, { attributes: true });
  }
  
  console.log('St. Josephine Mara Hospital website initialized');
});

// ==============================
// Handle window resize for mobile menu
// ==============================
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth > 768) {
      closeMobile();
    }
  }, 250);
});

// ==============================
// Export for debugging (optional)
// ==============================
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FormValidator, AppointmentFormHandler, RateLimiter };
}