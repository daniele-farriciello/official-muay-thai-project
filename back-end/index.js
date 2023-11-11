const express = require("express"); // Load the express module to help create the server.
const cors = require("cors");  // Load the CORS middleware to enable cross-origin requests.
const bcrypt = require('bcrypt');  // Load bcrypt for hashing passwords.
const mongoose = require('mongoose');  // Load mongoose to interact with MongoDB.xw

const corsOptions = {
    origin: 'http://localhost:3000', // Adjust this if your front-end is hosted elsewhere
    methods: ['GET', 'POST', 'PATCH', 'DELETE'], // Include 'PATCH' in the allowed methods
    credentials: true,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};

const PORT = 3001;
const app = express();

app.use(cors(corsOptions));

app.use(express.json());

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

// app.post('/modifyBooking', async (req, res) => {
//     const { email, fullname, birthdayDate, trainingDate, bookingSelected } = req.body;

//     const user = await User.findOne({ email: email });

//     // Find the index of the booking you want to modify
//     if (bookingSelected === -1) {
//         return res.status(404).json({ message: 'Booking not found' });
//     }

//     // Update the booking at that index
//     user.bookings[bookingSelected] = {
//         ...user.bookings[bookingSelected],
//         fullname,
//         birthdayDate,
//         trainingDate
//     }

//     try {
//         await user.save();
//         res.status(200).json({ message: 'Booking modified successfully' });
//     } catch (error) {
//         res.status(500).json({ message: 'Error updating booking' });
//     }
// });

app.patch('/modifyBooking', async (req, res) => {
    const { email, fullname, birthdayDate, trainingDate, bookingSelected } = req.body;

    // Create an update object dynamically to modify only the specified booking
    let update = {
        [`bookings.${bookingSelected}.fullname`]: fullname,
        [`bookings.${bookingSelected}.birthdayDate`]: birthdayDate,
        [`bookings.${bookingSelected}.trainingDate`]: trainingDate
    };

    try {
        // Directly update the booking in the database
        const result = await User.updateOne(
            { email: email },
            { $set: update }
        );

        // Check if the update operation modified any document
        if (result.nModified === 0) {
            return res.status(404).json({ message: 'Booking not found or no changes made' });
        }

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