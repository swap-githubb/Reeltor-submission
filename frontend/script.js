const API_BASE = 'http://localhost:5000/api';

authToken = null;
currentUser = null;
// Role selection
function showPanel(role) {
    document.getElementById('roleSelection').classList.add('hidden');
    document.getElementById(role + 'Panel').classList.remove('hidden');
}

// User authentication
function toggleAuthForms() {
    document.getElementById('userLogin').classList.toggle('hidden');
    document.getElementById('userSignup').classList.toggle('hidden');
}

async function userSignup() {
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    try {
        const response = await fetch(`${API_BASE}/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Signup failed');

        showMessage('Account created successfully! Please login', 'success');
        toggleAuthForms();
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

async function userLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Login failed');

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        
        if (currentUser.role === 'admin') {
            showAdminInterface();
        } else {
            showUserInterface();
            loadUserProfile();
            loadNotifications();
        }
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

// User Profile Management
async function loadUserProfile() {
    try {
        const response = await fetch(`${API_BASE}/profile`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const profile = await response.json();
        document.getElementById('profileName').value = profile.name || '';
        document.getElementById('profileMobile').value = profile.mobile || '';
        document.getElementById('profileBio').value = profile.bio || '';
        document.getElementById('availableFrom').value = profile.availableFrom || '';
        document.getElementById('availableTo').value = profile.availableTo || '';
    } catch (err) {
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

    try {
        const response = await fetch(`${API_BASE}/profile`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify(profileData)
        });

        if (!response.ok) throw new Error('Profile update failed');
        showMessage('Profile updated successfully!', 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

// Notifications
async function loadNotifications() {
    try {
        const response = await fetch(`${API_BASE}/notifications`, {
            headers: { Authorization: `Bearer ${authToken}` }
        });
        const notifications = await response.json();
        renderNotifications(notifications);
    } catch (err) {
        showMessage('Failed to load notifications', 'error');
    }
}

async function sendUserNotification() {
    const message = document.getElementById('notificationMessage').value;
    const recipients = document.getElementById('recipients').value.split(',').map(e => e.trim());

    try {
        const response = await fetch(`${API_BASE}/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message,
                recipients,
                isCritical: false
            })
        });

        if (!response.ok) throw new Error('Failed to send notification');
        showMessage('Notification sent successfully!', 'success');
        loadNotifications();
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

// Admin Functionality
async function adminLogin() {
    const password = document.getElementById('adminPassword').value;

    try {
        const response = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'admin@example.com', // Default admin email
                password
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Admin login failed');

        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('authToken', authToken);
        showAdminInterface();
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

async function sendAdminNotification() {
    const message = document.getElementById('adminNotification').value;
    const recipients = document.getElementById('adminRecipients').value.split(',').map(e => e.trim());
    const isCritical = document.getElementById('criticalNotification').checked;

    try {
        const response = await fetch(`${API_BASE}/admin/notifications`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${authToken}`
            },
            body: JSON.stringify({
                message,
                recipients,
                isCritical
            })
        });

        if (!response.ok) throw new Error('Failed to send notification');
        showMessage('Notification sent successfully!', 'success');
    } catch (err) {
        showMessage(err.message, 'error');
    }
}

// UI Helpers
function showUserInterface() {
    document.getElementById('userAuth').classList.add('hidden');
    document.getElementById('userProfile').classList.remove('hidden');
    document.getElementById('userNotifications').classList.remove('hidden');
    
}

function showAdminInterface() {
    document.getElementById('adminLogin').classList.add('hidden');
    document.getElementById('adminInterface').classList.remove('hidden');
    
}

function renderNotifications(notifications) {
    const container = document.getElementById('notificationList');
    if(notifications.length === 0) {
        container.innerHTML = '<p>No notifications yet</p>';
        return;
    }
    container.innerHTML = notifications.map(notification => `
        <div class="notification-item">
            <strong>From: ${notification.sender.email}</strong>
            <p>${notification.message}</p>
            <small>${new Date(notification.createdAt).toLocaleString()}</small>
        </div>
    `).join('');
}

function showMessage(text, type) {
    const msgDiv = document.getElementById('message');
    msgDiv.textContent = text;
    msgDiv.className = type;
    msgDiv.classList.remove('hidden');
    setTimeout(() => msgDiv.classList.add('hidden'), 3000);
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
    }
};



