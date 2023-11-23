const express = require("express"); 
const cors = require("cors"); 
const bcrypt = require('bcrypt'); // Used for hashing passwords
const mongoose = require('mongoose'); // MongoDB object modeling tool
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken'); // For generating JWT for secure authentication

// Secret key for JWT token
const TOKEN_SECRET = 'secret';

// CORS options to allow requests from specified origins and methods
const corsOptions = {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
    optionsSuccessStatus: 200 
};

const PORT = 3001;
const app = express();

// Middleware setup
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

const DB_URL = "mongodb://localhost:27017/Database-Project";

// Connect to MongoDB
mongoose.connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(error => console.error("MongoDB connection error:", error));

// User schema for MongoDB
const userSchema = new mongoose.Schema({
    fullName: String,
    email: String,
    password: String,
    member: {
        activationDay: String
    },
    bookings: [{
        fullname: String,
        birthdayDate: Date,
        trainingDate: Date,
    }]
});

const User = mongoose.model('User', userSchema);

// Authentication middleware to protect routes
function auth(req, res, next) {
    const token = req.cookies.muayThaiAuth;
    if (!token) {
        return res.status(401).json({ message: "Token doesn't exit"});
    }

    jwt.verify(token, TOKEN_SECRET, (err, cookieContent) => {
        if (err) {
            return res.status(403).json({ message: 'Error Token'});
        }

        const { userId, email } = cookieContent;
        const token = jwt.sign({ userId, email }, TOKEN_SECRET, { expiresIn: '1h' });
        res.cookie('muayThaiAuth', token, { httpOnly: true, secure: false });

        req.cookieContent = cookieContent;
        next();
    });
};

// Endpoint to retrieve the current user's profile.
// It uses authentication middleware to ensure the user is logged in.
// If the user is found, it returns their information minus the password.
app.get('/me', auth, async (req, res) => {
    const email = req.cookieContent.email;
    let user = await User.findOne({ email: email });

    if (user) {
        user = user.toObject();
        delete user.password;
        res.json(user);
    } else {
        return res.status(404).json({ message: 'User not found' });
    }
});

// Endpoint for user signup. 
// It checks if a user with the given email already exists, 
// and if not, creates a new user with a hashed password.
app.post('/signup', async (req, res) => {
    const { fullName, email, password } = req.body;

    const userExists = await User.findOne({ email: email });

    if (userExists) {
        return res.status(409).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
        fullName,
        email,
        password: hashedPassword
    });

    try {
        await newUser.save();
        return res.status(200).json({ message: 'Not exist-New user Added' });
    } catch (error) {
        return res.status(500).json({ message: 'Error saving user' });
    }
});

// Endpoint for user login. 
// It validates the user's email and password, 
// and if successful, issues a JWT token and sets it in a cookie.
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email });

    if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
        return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id, email: user.email }, TOKEN_SECRET, { expiresIn: '1h' });

    res.cookie('muayThaiAuth', token, { httpOnly: true, secure: false });

    return res.status(200).json({ message: 'Logged in successfully' });
});

// Endpoint for creating a new booking. 
// It adds a new booking to the user's booking list and saves the user document.
app.post('/newBooking', auth, async (req, res) => {
    const { email, fullname, birthdayDate, trainingDate } = req.body;

    const user = await User.findOne({ email: email });

    user.bookings.push({
        fullname,
        birthdayDate,
        trainingDate
    });

    try {
        await user.save();
        res.status(200).json({ message: 'Booking added successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving booking' });
    }
});

// Endpoint for modifying an existing booking. 
// It updates a specific booking selected based on user input.
app.patch('/modifyBooking', auth, async (req, res) => {
    const { email, fullname, birthdayDate, trainingDate, bookingSelected } = req.body;

    let update = {
        [`bookings.${bookingSelected}.fullname`]: fullname,
        [`bookings.${bookingSelected}.birthdayDate`]: birthdayDate,
        [`bookings.${bookingSelected}.trainingDate`]: trainingDate
    };

    try {
        const result = await User.updateOne(
            { email: email },
            { $set: update }
        );

        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Booking not found or no changes made' });
        }

        res.status(200).json({ message: 'Booking modified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking' });
    }
});

// Endpoint for activating a membership. 
// It updates the user's membership activation day.
app.post('/membershipPage', auth, async (req, res) => {
    const { email, activationDay } = req.body;

    const user = await User.findOne({ email: email });

    user.member.activationDay = activationDay;

    try {
        await user.save();
        res.status(200).json({ message: 'The membership is now activated!' });
    } catch (error) {
        res.status(500).json({ message: 'Error activating membership' });
    }
});

// Endpoint for removing a membership. 
// It sets the user's membership activation day to null.
app.post('/removeMembership', auth, async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email: email });

    user.member.activationDay = null;

    try {
        await user.save();
        res.status(200).json({ message: 'Membership removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing membership' });
    }
});

// Endpoint for deleting a booking. 
// It removes a booking from the user's booking based on the selected index.
app.delete('/deleteBooking', auth, async (req, res) => {
    const { email, bookingSelected } = req.body;

    try {
        const user = await User.findOne({ email: email });

        if (!user.bookings[bookingSelected - 1]) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        user.bookings.splice(bookingSelected - 1, 1);

        await user.save();
        res.status(200).json({ message: 'Booking deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting booking' });
    }
});

// Endpoint for logging out. 
// It clears the authentication cookie.
app.post('/logout', auth, async (req, res) => {
    res.clearCookie('muayThaiAuth');
    res.status(200).json({ message: 'Logged out successfully' });
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});