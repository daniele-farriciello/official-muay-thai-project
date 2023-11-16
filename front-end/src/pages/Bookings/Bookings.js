import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../components/UserContext";
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { Box, Button, Container, alpha } from "@mui/material";
import Pagination from '@mui/material/Pagination';
import '../../App.css';
import { RegoularH1, RegoularH2 } from "../../components/Typography/Typography";
import dashboardTheme from '../../components/DashboardTheme/DashboardTheme';
import AlertModal from "../../components/AlertModal/AlertModal";
import ModifyFormBooking from "../../components/ModifyFormBooking/ModifyFormBooking";

import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Fuse from 'fuse.js';
import RegularTextField from "../../components/TextField/TextField";

export default function Bookings() {
    const navigate = useNavigate();
    const { user, setUser } = useUser();

    const [currentPage, setCurrentPage] = useState(1); // to keep track of the current page
    const [modifyOpen, setModifyOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState(null);
    const [redirectWithData, setRedirectWithData] = useState(false);
    const [redirectToLogin, setRedirectToLogin] = useState(false);

    function handleNextBooking(event, value) {
        setCurrentPage(value);
    }

    useEffect(() => {
        if (!user) {
            setModalMessage("Access denied! Login first.");
            setModalOpen(true);
            setRedirectToLogin(true);
        } else if (!user.bookings || user.bookings.length === 0) {
            setModalMessage("You don't have any bookings yet. Book a private lesson.");
            setModalOpen(true);
            setRedirectWithData(true);  // set the flag for redirection
        }
    }, [user, navigate]);

    async function deleteBooking() {
        try {
            const response = await fetch('http://localhost:3001/deleteBooking', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: user.email,
                    bookingSelected: currentPage
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setModalMessage(data.message);
                setModalOpen(true);
                setUser({ //it update without refreshing the page the data, in order to shows the last booking added
                    ...user,
                    bookings: [...user.bookings.filter((booking, index) => {
                        return index !== currentPage - 1
                    })]
                });
                if (currentPage !== 1) {
                    setCurrentPage(currentPage - 1);
                }

            }
        } catch (error) {
            setModalMessage(error.message);
            setModalOpen(true);
        }
    }

    const [searchResults, setSearchResults] = useState([]);
    // Initialize Fuse with user's bookings
    const fuse = new Fuse(user.bookings, {
        keys: ['fullname'],
        includeScore: true
    });

    // Function to handle search
    const handleSearch = (e) => {
        const query = e.target.value;
        if (query) {
            const results = fuse.search(query).map(result => result.item);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    return (
        <div className="bookings-page">
            <AlertModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setModalMessage(null);
                    // if i don't use these statement it will navigate straigh away, without showing the modal
                    if (redirectWithData) {
                        navigate("/newBooking", { state: { id: user.email } });
                    }
                    if (redirectToLogin) {
                        navigate("/login");
                    }
                }}>
                {modalMessage}
            </AlertModal>
            <Container maxWidth="md">
                <RegoularH1 color={dashboardTheme.palette.primary.main}>Bookings Page</RegoularH1>

                {user && user.bookings && user.bookings.length > 0 ? (
                    <>
                        <Box>
                            <RegularTextField width="50%" backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)} onChange={handleSearch} id="outlined-basic" label="Search Booking" variant="outlined" placeholder="Full me" />
                            {searchResults.map((booking, index) => (
                                <List sx={{ width: '100%', maxWidth: 360 }}>
                                    <ListItem button key={index}>
                                        <ListItemText primary={booking.fullname} />
                                    </ListItem>
                                    <Divider />
                                </List>
                            ))}
                        </Box>

                        <Grid container spacing={2} mt={4} justifyContent="center">
                            <Grid item md={8}>
                                <Paper
                                    sx={{
                                        marginBottom: 3,
                                        width: '100%',
                                        height: modifyOpen ? 430 : 400, // Height changes based on modifyOpen state
                                        borderRadius: '40px',
                                        backgroundColor: alpha(dashboardTheme.palette.primary.light, 0.6),
                                    }}>
                                    <div style={{ paddingTop: '30px' }}>
                                        <RegoularH2>Full Name: {user.bookings[currentPage - 1].fullname}</RegoularH2>
                                        <RegoularH2>Birthday: {new Date(user.bookings[currentPage - 1].birthdayDate).toLocaleDateString()}</RegoularH2>
                                        <RegoularH2>Training Date: {new Date(user.bookings[currentPage - 1].trainingDate).toLocaleDateString()}</RegoularH2>
                                    </div>
                                    <Grid container justifyContent="center" style={{ marginTop: '20px' }}>
                                        {!modifyOpen ?
                                            <Pagination
                                                count={user.bookings.length}
                                                color="primary"
                                                onChange={handleNextBooking}
                                                page={currentPage}
                                            />
                                            :
                                            null
                                        }
                                    </Grid>
                                    {modifyOpen ?
                                        <ModifyFormBooking setModifyOpen={setModifyOpen} currentBooking={currentPage} />
                                        :
                                        <Grid container justifyContent="center" spacing={3} mt={0.7}>
                                            <Grid item>
                                                <Button variant="contained" onClick={deleteBooking}>
                                                    Delete a booking
                                                </Button>
                                            </Grid>
                                            <Grid item>
                                                <Button variant="contained" onClick={() => { setModifyOpen(!modifyOpen) }}>  {/* send as argument, if the modify is open and the currentBooking */}
                                                    Modify a booking
                                                </Button>
                                            </Grid>
                                        </Grid>
                                    }
                                </Paper>
                            </Grid>
                        </Grid>
                    </>
                ) : (
                    null
                )}
            </Container>
        </div>
    );
}