const API_BASE = 'https://user-management-and-notification.onrender.com/api';
// Define the base API URL for making API calls

authToken = null;
currentUser = null;
// Initialize variables for authentication token and current user (both null initially)

// Role selection
function showPanel(role) {
    document.getElementById('roleSelection').classList.add('hidden');
    document.getElementById(role + 'Panel').classList.remove('hidden');
    // Hide role selection panel and show the corresponding role panel (admin or user)
}

// User authentication
function toggleAuthForms() {
    document.getElementById('userLogin').classList.toggle('hidden');
    document.getElementById('userSignup').classList.toggle('hidden');
    // Toggle between the login and signup forms
}

async function userSignup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    // Get the email and password from the signup form fields

    try {
        const response = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }, //Tells the server that the data being sent in the request body is in JSON format.
            body: JSON.stringify({ email, password })
        });
        // Send a POST request to create a new user with email and password

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Signup failed');
        // If the response is not OK, throw an error

        showMessage('Account created successfully! Please login', 'success');
        // Show a success message
        toggleAuthForms();
        // Toggle the auth forms to show the login form
    } catch (err) {
        showMessage(err.message, 'error');
        // Show an error message if the signup fails
    }
}

async function userLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    // Get the email and password from the login form fields

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },//Tells the server that the data being sent in the request body is in JSON format.
            body: JSON.stringify({ email, password })
        });
        // Send a POST request to log in the user with the provided email and password

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');
        // If the response is not OK, throw an error

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        // Store the auth token and current user in variables and localStorage

        if (currentUser.role === 'admin') {
            showAdminInterface();
            // If the user is an admin, show the admin interface
        } else {
            showUserInterface();
            loadUserProfile();
            loadNotifications();
            // Otherwise, show the user interface and load the user's profile and notifications
        }
    } catch (err) {
        showMessage(err.message, 'error');
        // Show an error message if the login fails
    }
}

// User Profile Management
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: { Authorization: `Bearer ${authToken}` } //To check if the client has permission to access the requested resource
        });
        //To get profile data

        const profile = await response.json();
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileMobile').value = profile.mobile || '';
        document.getElementById('profileBio').value = profile.bio || '';
        document.getElementById('availableFrom').value = profile.availableFrom || '';
        document.getElementById('availableTo').value = profile.availableTo || '';
        // Populate the profile form fields with the user's profile data
      
    } catch (err) {
        // Handle any errors (nothing in the catch block, could log or display error message if needed)
    }
}

async function updateProfile() {
    const profileData = {
        name: document.getElementById('profileName').value,
        mobile: document.getElementById('profileMobile').value,
        bio: document.getElementById('profileBio').value,
        availableFrom: document.getElementById('availableFrom').value,
        availableTo: document.getElementById('availableTo').value
    };
    // Gather the updated profile data from the form fields

    try {
        const response = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',//Tells the server that the data being sent in the request body is in JSON format.
                Authorization: `Bearer ${authToken}` //To check if the client has permission to access the requested resource
            },
            body: JSON.stringify(profileData)
        });
        // Send a PUT request to update the user's profile with the new data

        if (!response.ok) throw new Error('Profile update failed');
        // If the response is not OK, throw an error

        showMessage('Profile updated successfully!', 'success');
        // Show a success message if the profile was updated successfully
    } catch (err) {
        showMessage(err.message, 'error');
        // Show an error message if the profile update fails
    }
}

// Notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE}/notifications`, {
            headers: { Authorization: `Bearer ${authToken}` } //To check if the client has permission to access the requested resource
        });
        // Send a GET request to load the user's notifications using the auth token

        const notifications = await response.json();
        renderNotifications(notifications);
        // Call the function to render notifications on the page
    } catch (err) {
        showMessage('Failed to load notifications', 'error');
        // Show an error message if notifications cannot be loaded
    }
}

async function sendUserNotification() {
    const message = document.getElementById('notificationMessage').value;
    const recipients = document.getElementById('recipients').value.split(',').map(e => e.trim());
    // Get the notification message and recipient emails, splitting and trimming the recipient list

    try {
        const response = await fetch(`${API_BASE}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', //Tells the server that the data being sent in the request body is in JSON format.
                Authorization: `Bearer ${authToken}` //To check if the client has permission to access the requested resource
            },
            body: JSON.stringify({
                message,
                recipients,
                isCritical: false
            })
        });
        // Send a POST request to create a new notification

        if (!response.ok) throw new Error('Failed to send notification');
        // If the response is not OK, throw an error

        showMessage('Notification sent successfully!', 'success');
        loadNotifications();
        // Show a success message and reload the notifications
    } catch (err) {
        showMessage(err.message, 'error');
        // Show an error message if the notification sending fails
    }
}

// Admin Functionality
async function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    // Get the admin password from the form

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },//Tells the server that the data being sent in the request body is in JSON format.
            body: JSON.stringify({
                email: 'admin@example.com', // Default admin email
                password
            })
        });
        // Send a POST request for admin login with default admin email and provided password

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Admin login failed');
        // If the response is not OK, throw an error

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        // Store the auth token and current admin user in variables and localStorage
        showAdminInterface();
        // Show the admin interface
    } catch (err) {
        showMessage(err.message, 'error');
        // Show an error message if admin login fails
    }
}

async function sendAdminNotification() {
    const message = document.getElementById('adminNotification').value;
    const recipients = document.getElementById('adminRecipients').value.split(',').map(e => e.trim());
    const isCritical = document.getElementById('criticalNotification').checked;
    // Get the notification message, recipient emails, and whether the notification is critical

    try {
        const response = await fetch(`${API_BASE}/admin/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json', //Tells the server that the data being sent in the request body is in JSON format.
                Authorization: `Bearer ${authToken}` //To check if the client has permission to access the requested resource
            },
            body: JSON.stringify({
                message,
                recipients,
                isCritical
            })
        });
        // Send a POST request to create a new notification for admins

        if (!response.ok) throw new Error('Failed to send notification');
        // If the response is not OK, throw an error

        showMessage('Notification sent successfully!', 'success');
        // Show a success message
    } catch (err) {
        showMessage(err.message, 'error');
        // Show an error message if notification sending fails
    }
}

// UI Helpers
function showUserInterface() {
    document.getElementById('userAuth').classList.add('hidden');
    document.getElementById('userProfile').classList.remove('hidden');
    document.getElementById('userNotifications').classList.remove('hidden');
    // Show the user profile and notifications while hiding the authentication panel
}

function showAdminInterface() {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminInterface').classList.remove('hidden');
    // Show the admin interface while hiding the admin login panel
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationList');
    if(notifications.length === 0) {
        container.innerHTML = '<p>No notifications yet</p>';
        return;
    }
    // If there are no notifications, display a message saying "No notifications yet"

    container.innerHTML = notifications.map(notification => `
        <div class="notification-item">
            <strong>From: ${notification.sender.email}</strong>
            <p>${notification.message}</p>
            <small>${new Date(notification.createdAt).toLocaleString()}</small>
        </div>
    `).join('');
    // Render each notification in the notification list, showing the sender, message, and timestamp
}

function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = text;
    msgDiv.className = type;
    msgDiv.classList.remove('hidden');
    setTimeout(() => msgDiv.classList.add('hidden'), 3000);
    // Display a message with a specific type (success or error) and hide it after 3 seconds
}

async function logout() {
    try {
        // Clear the token and user data
        localStorage.removeItem('authToken');
        authToken = null;
        currentUser = null;

        // Hide all panels and show the role selection screen
        document.getElementById('userPanel').classList.add('hidden');
        document.getElementById('adminPanel').classList.add('hidden');
        document.getElementById('roleSelection').classList.remove('hidden');
       
        // Show success message
        showMessage('Logged out successfully!', 'success');

        window.location.reload(); // Reload the page to reset the UI
    } catch (err) {
        showMessage('Error during logout', 'error');
        // Show an error message if logout fails
    }
};
