// Handle form submissions and authentication
document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const errorMessage = document.getElementById('error-message');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const password = document.getElementById('password').value;

            try {
                showError('Logging in...', 'info');
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Store the user ID in session storage
                    sessionStorage.setItem('userId', data.userId);
                    sessionStorage.setItem('username', username);
                    // Redirect to dashboard
                    window.location.href = 'index.html';
                } else {
                    showError(data.message || 'Login failed. Please try again.');
                }
            } catch (error) {
                console.error('Login error:', error);
                showError('Network error. Please check your connection and try again.');
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            // Client-side validation
            if (!username || !email || !password || !confirmPassword) {
                showError('All fields are required');
                return;
            }

            if (username.length < 3) {
                showError('Username must be at least 3 characters long');
                return;
            }

            if (!isValidEmail(email)) {
                showError('Please enter a valid email address');
                return;
            }

            // Validate password
            if (password.length < 8) {
                showError('Password must be at least 8 characters long');
                return;
            }

            if (!/\d/.test(password)) {
                showError('Password must include at least one number');
                return;
            }

            if (password !== confirmPassword) {
                showError('Passwords do not match');
                return;
            }

            try {
                showError('Creating account...', 'info');
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, email, password }),
                });

                const data = await response.json();

                if (response.ok) {
                    // Show success message and redirect
                    showError('Account created successfully! Redirecting to login...', 'success');
                    setTimeout(() => {
                        window.location.href = 'login.html?registered=true';
                    }, 2000);
                } else {
                    showError(data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showError('Network error. Please check your connection and try again.');
            }
        });
    }

    // Check if user is logged in
    function checkAuth() {
        const userId = sessionStorage.getItem('userId');
        const currentPage = window.location.pathname;

        if (!userId && !currentPage.includes('login.html') && !currentPage.includes('register.html')) {
            // Redirect to login if not authenticated
            window.location.href = 'login.html';
        } else if (userId && (currentPage.includes('login.html') || currentPage.includes('register.html'))) {
            // Redirect to dashboard if already authenticated
            window.location.href = 'index.html';
        }
    }

    // Show error message with type (error, info, success)
    function showError(message, type = 'error') {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Reset classes
        errorMessage.className = 'error-message';
        
        // Add appropriate class based on message type
        switch (type) {
            case 'info':
                errorMessage.style.background = 'rgba(33, 150, 243, 0.1)';
                errorMessage.style.color = '#2196F3';
                break;
            case 'success':
                errorMessage.style.background = 'rgba(76, 175, 80, 0.1)';
                errorMessage.style.color = '#4CAF50';
                break;
            default:
                errorMessage.style.background = 'rgba(255, 99, 71, 0.1)';
                errorMessage.style.color = '#ff6347';
        }

        if (type !== 'info' && type !== 'success') {
            setTimeout(() => {
                errorMessage.style.display = 'none';
            }, 5000);
        }
    }

    // Email validation helper
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Check for registration success message
    if (window.location.search.includes('registered=true')) {
        showError('Registration successful! Please log in.', 'success');
    }

    // Check authentication status on page load
    checkAuth();
}); 