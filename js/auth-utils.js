// Authentication utility functions

// Show toast notification
function showToast(message, type = 'info', title = '') {
  const toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast';
  
  // Set icon based on type
  let iconClass = '';
  switch (type) {
    case 'success':
      iconClass = 'fas fa-check-circle';
      break;
    case 'error':
      iconClass = 'fas fa-exclamation-circle';
      break;
    case 'warning':
      iconClass = 'fas fa-exclamation-triangle';
      break;
    case 'info':
    default:
      iconClass = 'fas fa-info-circle';
      break;
  }

  // Set title based on type if not provided
  if (!title) {
    switch (type) {
      case 'success':
        title = 'Success';
        break;
      case 'error':
        title = 'Error';
        break;
      case 'warning':
        title = 'Warning';
        break;
      case 'info':
      default:
        title = 'Information';
        break;
    }
  }

  toast.innerHTML = `
    <div class="toast-icon ${type}">
      <i class="${iconClass}"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    </div>
    <button class="toast-close">
      <i class="fas fa-times"></i>
    </button>
  `;

  document.querySelector('.toast-container').appendChild(toast);
  
  // Show toast with animation
  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  // Add close button functionality
  const closeBtn = toast.querySelector('.toast-close');
  closeBtn.addEventListener('click', () => {
    toast.classList.remove('show');
    setTimeout(() => {
      toast.remove();
    }, 300);
  });

  // Auto close after 5 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, 5000);
}

// Set button loading state
function setButtonLoading(button, isLoading) {
  if (isLoading) {
    button.disabled = true;
    button.classList.add('btn-loading');
    const spinner = document.createElement('span');
    spinner.className = 'spinner';
    button.appendChild(spinner);
  } else {
    button.disabled = false;
    button.classList.remove('btn-loading');
    const spinner = button.querySelector('.spinner');
    if (spinner) {
      spinner.remove();
    }
  }
}

// Toggle password visibility
function togglePasswordVisibility(inputId, toggleId) {
  const passwordInput = document.getElementById(inputId);
  const toggleButton = document.getElementById(toggleId);
  
  if (passwordInput && toggleButton) {
    toggleButton.addEventListener('click', () => {
      const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
      passwordInput.setAttribute('type', type);
      
      // Toggle icon
      const icon = toggleButton.querySelector('i');
      if (icon) {
        icon.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
      }
    });
  }
}

// Password validation patterns
const PASSWORD_PATTERNS = {
    BASIC: {
        pattern: "^(?=.*[A-Za-z])(?=.*\\d)[A-Za-z\\d]{8,}$",
        description: "Minimum eight characters, at least one letter and one number"
    },
    WITH_SPECIAL: {
        pattern: "^(?=.*[A-Za-z])(?=.*\\d)(?=.*[@$!%*#?&])[A-Za-z\\d@$!%*#?&]{8,}$",
        description: "Minimum eight characters, at least one letter, one number and one special character"
    },
    WITH_CASE: {
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$",
        description: "Minimum eight characters, at least one uppercase letter, one lowercase letter and one number"
    },
    COMPLETE: {
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        description: "Minimum eight characters, at least one uppercase letter, one lowercase letter, one number and one special character"
    },
    COMPLETE_LIMITED: {
        pattern: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,10}$",
        description: "Minimum eight and maximum 10 characters, at least one uppercase letter, one lowercase letter, one number and one special character"
    }
};

// Validate password
function validatePassword(password) {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasNoSpaces = !/\s/.test(password);

    const errors = [];
    
    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }
    if (!hasNoSpaces) {
        errors.push('Password cannot contain spaces');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Check password strength
function checkPasswordStrength(password) {
    if (!password) return { score: 0, text: '', feedback: [] };
    
    let score = 0;
    let feedback = [];
    
    // Length check
    if (password.length >= 12) {
        score += 2;
    } else if (password.length >= 8) {
        score += 1;
    } else {
        feedback.push('At least 8 characters');
    }
    
    // Character variety checks
    if (/[A-Z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('At least one uppercase letter');
    }
    
    if (/[a-z]/.test(password)) {
        score += 1;
    } else {
        feedback.push('At least one lowercase letter');
    }
    
    if (/\d/.test(password)) {
        score += 1;
    } else {
        feedback.push('At least one number');
    }
    
    if (/[^A-Za-z0-9]/.test(password)) {
        score += 1;
    } else {
        feedback.push('At least one special character');
    }

    // Additional security checks
    if (!/\s/.test(password)) {
        score += 1;
    } else {
        feedback.push('No spaces allowed');
    }

    if (password.length >= 16) {
        score += 1;
    }
    
    // Determine strength text and class
    let strengthText = '';
    let strengthClass = '';
    
    if (score === 0) {
        strengthText = 'Very Weak';
        strengthClass = 'weak';
    } else if (score <= 2) {
        strengthText = 'Weak';
        strengthClass = 'weak';
    } else if (score <= 4) {
        strengthText = 'Medium';
        strengthClass = 'medium';
    } else if (score <= 6) {
        strengthText = 'Strong';
        strengthClass = 'strong';
    } else {
        strengthText = 'Very Strong';
        strengthClass = 'very-strong';
    }
    
    return {
        score,
        text: strengthText,
        class: strengthClass,
        feedback: feedback
    };
}

// Update password strength indicator
function updatePasswordStrength(password, strengthBarId, strengthTextId) {
    const strengthBar = document.getElementById(strengthBarId);
    const strengthText = document.getElementById(strengthTextId);
    
    if (!strengthBar || !strengthText) return;
    
    const strength = checkPasswordStrength(password);
    
    // Update strength bar
    strengthBar.className = 'password-strength-bar';
    if (strength.class) {
        strengthBar.classList.add(strength.class);
    }
    
    // Update strength text
    strengthText.textContent = strength.text;
    
    // Update feedback if feedback element exists
    const feedbackElement = document.getElementById('passwordFeedback');
    if (feedbackElement) {
        if (strength.feedback.length > 0) {
            feedbackElement.textContent = strength.feedback[0];
            feedbackElement.style.display = 'block';
        } else {
            feedbackElement.style.display = 'none';
        }
    }
}

// Validate email format
function validateEmail(email) {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
  return emailRegex.test(email);
}

// Validate form fields
function validateForm(fields) {
    let isValid = true;
    let firstInvalidField = null;
    
    fields.forEach(field => {
        const input = document.getElementById(field.id);
        const feedback = document.getElementById(field.feedbackId);
        
        if (!input || !feedback) return;
        
        let fieldValid = true;
        let errorMessage = '';
        
        // Check if field is required
        if (field.required && !input.value.trim()) {
            fieldValid = false;
            errorMessage = field.requiredMessage || 'This field is required';
        } 
        // Validate email
        else if (field.type === 'email' && input.value.trim()) {
            const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
            if (!emailRegex.test(input.value.trim())) {
                fieldValid = false;
                errorMessage = 'Please enter a valid email address';
            }
        }
        // Validate password
        else if (field.type === 'password' && input.value.trim()) {
            const passwordValidation = validatePassword(input.value);
            if (!passwordValidation.isValid) {
                fieldValid = false;
                errorMessage = passwordValidation.errors[0];
            }
        }
        // Validate password confirmation
        else if (field.type === 'passwordConfirm' && input.value.trim()) {
            const passwordInput = document.getElementById(field.passwordId);
            if (input.value !== passwordInput.value) {
                fieldValid = false;
                errorMessage = 'Passwords do not match';
            }
        }
        
        // Update field state
        if (!fieldValid) {
            input.classList.add('is-invalid');
            feedback.textContent = errorMessage;
            feedback.style.display = 'block';
            isValid = false;
            
            if (!firstInvalidField) {
                firstInvalidField = input;
            }
        } else {
            input.classList.remove('is-invalid');
            feedback.style.display = 'none';
        }
    });
    
    // Focus first invalid field
    if (firstInvalidField) {
        firstInvalidField.focus();
    }
    
    return isValid;
}

// Export functions
export {
  showToast,
  setButtonLoading,
  togglePasswordVisibility,
  checkPasswordStrength,
  updatePasswordStrength,
  validateEmail,
  validatePassword,
  validateForm
}; 