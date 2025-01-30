require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path'); 
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());
app.use(bodyParser.json()); // Parse incoming JSON requests


app.use(express.static(path.join(__dirname, '../frontend')));

// Database Connection
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
    isCritical: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
    deliveredAt: Date
}));


// Middleware
const authenticate = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).send('Access denied');

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);
        req.user = await User.findById(verified._id);
        next();
    } catch (err) {
        res.status(400).send('Invalid token');
    }
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') return res.status(403).send('Admin access required');
    next();
};

// Routes
app.get('/api/verify', authenticate, (req, res) => {
    res.json({ valid: true, user: req.user });
});

// Auth Routes
app.post('/api/signup', async (req, res) => {
    try {
        const { email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send('User already exists');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ email, password: hashedPassword });
        await user.save();

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('Invalid credentials');

        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) return res.status(400).send('Invalid credentials');

        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.json({ token, user: { email: user.email, role: user.role } });
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// User Routes
app.put('/api/profile', authenticate, async (req, res) => {
    try {
        const updates = {
            name: req.body.name,
            mobile: req.body.mobile,
            bio: req.body.bio,
            availableFrom: req.body.availableFrom,
            availableTo: req.body.availableTo
        };

        const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true });
        res.json(user);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Notification Routes
app.post('/api/notifications', authenticate, async (req, res) => {
    try {
        const { message, recipients, isCritical } = req.body;
        const recipientUsers = await User.find({ email: { $in: recipients } });

        const notification = new Notification({
            message,
            sender: req.user._id,
            recipients: recipientUsers.map(u => u._id),
            isCritical,
            status: 'sent'
        });

        await notification.save();
        await User.updateMany(
            { _id: { $in: recipientUsers.map(u => u._id) } },
            { $push: { notifications: notification._id } }
        );

        res.json(notification);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

app.get('/api/notifications', authenticate, async (req, res) => {
    try {
        const notifications = await Notification.find({
            recipients: req.user._id
        }).populate('sender', 'email');
        
        res.json(notifications);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Admin Routes (to be used to handle the critical state but here I am not able to implement it)
app.post('/api/admin/notifications', authenticate, isAdmin, async (req, res) => {
    try {
        const { message, recipients, isCritical } = req.body;
        const recipientUsers = await User.find({ email: { $in: recipients } });

        const notification = new Notification({
            message,
            sender: req.user._id,
            recipients: recipientUsers.map(u => u._id),
            isCritical,
            status: 'sent'
        });

        await notification.save();
        await User.updateMany(
            { _id: { $in: recipientUsers.map(u => u._id) } },
            { $push: { notifications: notification._id } }
        );

        res.json(notification);
    } catch (err) {
        res.status(500).send('Server error');
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });

  
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));