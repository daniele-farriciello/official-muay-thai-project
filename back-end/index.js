const express = require("express"); // Load the express module to help create the server.
const cors = require("cors");  // Load the CORS middleware to enable cross-origin requests.
const bcrypt = require('bcrypt');  // Load bcrypt for hashing passwords.
const mongoose = require('mongoose');  // Load mongoose to interact with MongoDB.

// FOR COOKIES
// const session = require('express-session');

// // FOR COOKIES
// const MongoStore = require('connect-mongo');

const PORT = 3001;
const app = express();

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());

// // FOR COOKIES
// app.use(session({
//     secret: 'secret-key',
//     resave: false,
//     saveUninitialized: false,
//     store: new MongoStore({ mongoUrl: 'mongodb://localhost/Database-Project' }),
//     cookie: {
//         sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax', // Use 'none' for production
//         secure: process.env.NODE_ENV === "production", // Only set secure if in production
//         httpOnly: true,
//         maxAge: 24 * 60 * 60 * 1000 // 24 hours
//     }
// }));

// console.log("Environment:", process.env.NODE_ENV);

// // FOR COOKIES
// const sessionStore = new MongoStore({
//     mongoUrl: 'mongodb://localhost/Database-Project',
//     collectionName: 'sessions'
// });

// // FOR COOKIES
// sessionStore.on('error', function(error){
//     console.log("SESSION STORE ERROR:", error);
// });

const dbUrl = "mongodb://localhost:27017/Database-Project";

mongoose.connect(dbUrl, {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).catch(error => console.error("MongoDB connection error:", error));

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

app.get('/user/:email', async (req, res) => {
    const email = req.params.email;
    let user = await User.findOne({ email: email });

    if (user) {
        user = user.toObject();
        delete user.password; // Never send password back
        res.json(user);
    } else {
        res.status(404).json({ message: 'User not found' });
    }
});

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
        password: hashedPassword // store the hashed password
    });

    try {
        await newUser.save();
        return res.status(200).json({ message: 'Not exist-New user Added' });
    } catch (error) {
        res.status(500).json({ message: 'Error saving user' });
    }
});

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

    // // FOR COOKIES
    // req.session.userId = user._id; // Save the user's ID in the session
    // req.session.isAuthenticated = true;

    res.status(200).json({ message: 'Logged in successfully' });
});


app.post('/newBooking', async (req, res) => {
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

app.post('/modifyBooking', async (req, res) => {
    const { email, fullname, birthdayDate, trainingDate, bookingSelected } = req.body;

    const user = await User.findOne({ email: email });

    // Find the index of the booking you want to modify
    if (bookingSelected === -1) {
        return res.status(404).json({ message: 'Booking not found' });
    }

    // Update the booking at that index
    user.bookings[bookingSelected] = {
        ...user.bookings[bookingSelected],
        fullname,
        birthdayDate,
        trainingDate
    }

    try {
        await user.save();
        res.status(200).json({ message: 'Booking modified successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating booking' });
    }
});

app.post('/membershipPage', async (req, res) => {
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

app.post('/removeMembership', async (req, res) => {
    const { email } = req.body;

    const user = await User.findOne({ email: email });

    user.member.activationDay = null; // Remove the activationDay

    try {
        await user.save();
        res.status(200).json({ message: 'Membership removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing membership' });
    }
});

app.delete('/deleteBooking', async (req, res) => {
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

app.post('/logout', (req, res) => {
    res.status(200).json({ message: 'Logged out successfully' });
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});