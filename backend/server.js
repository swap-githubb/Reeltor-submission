require('dotenv').config(); // Load environment variables from a .env file into process.env

const express = require('express'); // Import Express framework for handling HTTP requests
const mongoose = require('mongoose'); // Import Mongoose for MongoDB database interactions
const bcrypt = require('bcryptjs'); // Import bcrypt for hashing passwords
const jwt = require('jsonwebtoken'); // Import JSON Web Token for authentication
const path = require('path'); // Import path module to handle file and directory paths
const bodyParser = require('body-parser'); // Import body-parser to parse incoming JSON requests
const cors = require('cors'); // Import CORS middleware to handle cross-origin requests

const app = express(); // Create an instance of an Express application
app.use(express.json()); // Enable JSON parsing for incoming requests

const allowedOrigins = [
  'https://user-management-and-notification.onrender.com', // Render frontend URL (deployed version)
  'http://localhost:3000' // Local development environment
];

app.use(cors({
  origin: allowedOrigins, // Restrict requests to the allowed origins
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Allow specific HTTP methods
  credentials: true // Enable cookies and authentication headers in cross-origin requests
}));
app.use(bodyParser.json()); // Parse incoming JSON requests







app.use(express.static(path.join(__dirname, '../frontend'))); // Serve static files (css) from the frontend directory to handle frontend requests

// To connect to MongoDB database 
mongoose.connect(process.env.MONGODB_URI
).then(() => console.log('Connected to MongoDB')).catch(err => console.log(err));


// Models
const User = mongoose.model('User', new mongoose.Schema({
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    name: String,
    mobile: Number,
    bio: String,
    availableFrom: String,
    availableTo: String,
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }]
}));

const Notification = mongoose.model('Notification', new mongoose.Schema({
    message: { type: String, required: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipients: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['sent', 'queued', 'delivered'], default: 'sent' },
    isCritical: { type: Boolean, default: false }, //Whether the notification is critical or not as mentioned by the admin
    createdAt: { type: Date, default: Date.now }, //To create a track of notifications time
    deliveredAt: Date
}));


// Middleware
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1]; // Extract JWT token from the Authorization header
    if (!token) return res.status(401).send('Access denied'); // If no token is provided, deny access

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET); // Verify the token using the secret key
        req.user = await User.findById(verified._id); // Retrieve the user from the database using the decoded user ID
        next(); // Proceed to the next middleware or route handler
    } catch (err) {
        res.status(400).send('Invalid token'); // Return an error if the token is invalid
    }
};

//To check whether admin is attempting or not
const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).send('Admin access required');
    next();
};

// Routes
app.get('/api/verify', authenticate, (req, res) => { 
    // Endpoint to verify the authenticity of a user's JWT token
    // The 'authenticate' middleware ensures only authenticated users can access this route
    res.json({ valid: true, user: req.user }); // Respond with the authenticated user's details if the token is valid
});


// Auth Routes
// User Signup Route
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body; // Extract email and password from request body
        const existingUser = await User.findOne({ email }); // Check if the user already exists
        if (existingUser) return res.status(400).send('User already exists'); // Return error if user exists

        const hashedPassword = await bcrypt.hash(password, 10); // Hash the password before storing it
        const user = new User({ email, password: hashedPassword }); // Create a new user instance
        await user.save(); // Save the user to the database

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Generate JWT token
        res.json({ token, user: { email: user.email, role: user.role } }); // Respond with the token and user info
    } catch (err) {
        res.status(500).send('Server error'); // Handle server errors
    }
});

// User Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body; // Extract email and password from request body
        const user = await User.findOne({ email }); // Check if the user exists
        if (!user) return res.status(400).send('Invalid credentials'); // Return error if user does not exist

        const validPass = await bcrypt.compare(password, user.password); // Compare provided password with stored hash
        if (!validPass) return res.status(400).send('Invalid credentials'); // Return error if password is incorrect

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Generate JWT token
        res.json({ token, user: { email: user.email, role: user.role } }); // Respond with token and user info
    } catch (err) {
        res.status(500).send('Server error'); // Handle server errors
    }
});

// User Routes
// Update user profile route
app.put('/api/profile', authenticate, async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            mobile: req.body.mobile,
            bio: req.body.bio,
            availableFrom: req.body.availableFrom,
            availableTo: req.body.availableTo
        };

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }); // Update user profile
        res.json(user); // Respond with updated user profile
    } catch (err) {
        res.status(500).send('Server error'); // Handle server errors
    }
});

// Notification Routes
// Send notification route
app.post('/api/notifications', authenticate, async (req, res) => { 
    // Define a POST route for sending notifications, with authentication middleware

    try {
        const { message, recipients, isCritical } = req.body; 
        // Extract notification details from the request body (message content, recipients list, and critical flag)

        const recipientUsers = await User.find({ email: { $in: recipients } }); 
        // Find users in the database whose emails match the provided recipient list

        const notification = new Notification({
            message, // Store the notification message
            sender: req.user._id, // Assign the authenticated user as the sender
            recipients: recipientUsers.map(u => u._id), // Store recipient user IDs
            isCritical, // Store whether the notification is critical
            status: 'sent' // Set the initial status of the notification as 'sent'
        });

        await notification.save(); 
        // Save the new notification document in the database

        await User.updateMany(
            { _id: { $in: recipientUsers.map(u => u._id) } }, 
            // Find all recipient users in the database
            { $push: { notifications: notification._id } } 
            // Add the notification ID to each recipient's notifications array
        );

        res.json(notification); 
        // Send a JSON response containing the saved notification data

    } catch (err) {
        res.status(500).send('Server error'); 
        // Handle any server errors by returning a 500 response
    }
});


// Get user notifications route
app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipients: req.user._id
        }).populate('sender', 'email'); // Fetch notifications for authenticated user (the sender value now contains email of the user who sent the notification)
        
        res.json(notifications); // Respond with notifications
    } catch (err) {
        res.status(500).send('Server error'); // Handle server errors
    }
});

// Admin Routes
// Admin notification route (For sending critical notifications)
app.post('/api/admin/notifications', authenticate, isAdmin, async (req, res) => { 
    // Define a POST route for creating notifications accessible only by admins
    // `authenticate` and `isAdmin` are middleware functions that ensure the user is authenticated and an admin
    try {
        const { message, recipients, isCritical } = req.body; 
        // Destructure the incoming request body to extract 'message', 'recipients' (list of emails), and 'isCritical' (notification importance)
        
        const recipientUsers = await User.find({ email: { $in: recipients } }); 
        // Find users in the database whose email addresses are in the recipients array
        
        const notification = new Notification({
            message, 
            sender: req.user._id, 
            recipients: recipientUsers.map(u => u._id), 
            isCritical, 
            status: 'sent' 
        });
        // Create a new Notification object with the provided data. 
        // The 'sender' is the ID of the currently authenticated user, 
        // 'recipients' is an array of user IDs, 
        // 'status' is set to 'sent' initially.
        
        await notification.save(); 
        // Save the notification object to the database
        
        await User.updateMany(
            { _id: { $in: recipientUsers.map(u => u._id) } }, 
            { $push: { notifications: notification._id } }
        );
        // Update all recipient users by pushing the new notification ID into their 'notifications' array
        
        res.json(notification); 
        // Respond to the client with the saved notification data (including its details)
    } catch (err) {
        res.status(500).send('Server error'); 
        // If any error occurs, respond with a 500 status code and a generic server error message
    }
});


// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html')); // Serve frontend HTML file for all unmatched routes
});

// Define the port for the server
const PORT = process.env.PORT || 5000;

// Start the server and listen on the specified port
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
