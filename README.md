# User Management System

A full-stack application for managing users, profiles, and notifications with role-based access control (user/admin).

### User Features
- **Authentication**: Signup/Login with email & password
- **Profile Management**: Update personal information, availability hours
- **Notifications**: Send/receive notifications to other users
- **Responsive UI**: Clean and user-friendly interface

### Admin Features
- **Special Privileges**: Dedicated admin interface
- **Critical Notifications**: Send priority notifications

## Technologies

**Backend**:
- Node.js/Express: For handling API and server requests in the backend.
- MongoDB/Mongoose: To store user information and notification sent or received.
- JWT Authentication: For authenticating the user logging in or signing up.
- Bcrypt password hashing: For hashing the password before storing it in the database and to decrypt it on request during logging in and verifying the user.
- CORS & Body-parser: CORS middleware to handle cross-origin requests and body-parser to parse incoming JSON requests.

**Frontend**:
- JavaScript: To process all the button requests and API integration
- HTML/CSS: To develop structure of application

## API Documentation  
**1. User Signup**
- Endpoint: POST /api/signup
- Description: Registers a new user.
- Request Body:
   {
  "email": "user@example.com",
  "password": "securePassword123"
   }
- Response: {
  "token": "jwtTokenHere",
  "user": {
    "email": "user@example.com",
    "role": "user"
  }
}

**2. User Login**
- Endpoint: POST /api/login
- Description: Authenticates a user and returns a JWT token.
- Request Body:
{
  "email": "user@example.com",
  "password": "securePassword123"
}
- Response:
{
  "token": "jwtTokenHere",
  "user": {
    "email": "user@example.com",
    "role": "user"
  }
}

**3. Update Profile**
- Endpoint: PUT /api/profile
- Description: Updates the user's profile information.
- Headers:
 Authorization: Bearer <jwtToken>
- Request Body:
{
  "name": "John Doe",
  "mobile": "1234567890",
  "bio": "Software Developer",
  "availableFrom": "09:00",
  "availableTo": "17:00"
}
- Response:
{
  "email": "user@example.com",
  "name": "John Doe",
  "mobile": "1234567890",
  "bio": "Software Developer",
  "availableFrom": "09:00",
  "availableTo": "17:00"
}

**4. Send Notification**
- Endpoint: POST /api/notifications
- Description: Sends a notification to one or more users.
- Headers: 
Authorization: Bearer <jwtToken>
- Request Body:
{
  "message": "Hello, this is a notification!",
  "recipients": ["user1@example.com", "user2@example.com"],
  "isCritical": false
}
- Response:
{
  "message": "Hello, this is a notification!",
  "sender": "senderUserId",
  "recipients": ["recipientUserId1", "recipientUserId2"],
  "status": "sent",
  "isCritical": false,
  "createdAt": "2023-10-01T12:00:00Z"
}

**5. Get Notifications**
- Endpoint: GET /api/notifications
- Description: Retrieves all notifications for the authenticated user.
- Headers:
Authorization: Bearer <jwtToken>
- Response:
[
  {
    "message": "Hello, this is a notification!",
    "sender": {
      "email": "sender@example.com"
    },
    "status": "sent",
    "createdAt": "2023-10-01T12:00:00Z"
  }
]

**6. Send Admin Notification**
- Endpoint: POST /api/admin/notifications
- Description: Sends a critical notification as an admin.
- Headers:
Authorization: Bearer <jwtToken>
- Request Body:
{
  "message": "Urgent: System Maintenance",
  "recipients": ["user1@example.com", "user2@example.com"],
  "isCritical": true
}
- Response:
{
  "message": "Urgent: System Maintenance",
  "sender": "adminUserId",
  "recipients": ["recipientUserId1", "recipientUserId2"],
  "status": "sent",
  "isCritical": true,
  "createdAt": "2023-10-01T12:00:00Z"
}

## Future Improvements

- Implement critical notification handling
- Add user management interface for admins
- Include email verification
- Add notification status tracking

## Note

- For accessing admin feature, manually create document in MongoDB with email, hashed password and role. (use password="admin123" for render deployed site).
- I was not able to implement notification sharing based on available time of users.  
