import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../components/UserContext";
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import { Button, Container, alpha } from "@mui/material";
import Pagination from '@mui/material/Pagination';
import '../../App.css';
import { RegoularH1, RegoularH2 } from "../../components/Typography/Typography";
import dashboardTheme from '../../components/DashboardTheme/DashboardTheme';
import AlertModal from "../../components/AlertModal/AlertModal";
import ModifyFormBooking from "./ModifyFormBooking/ModifyFormBooking";
import Search from "./SearchBooking/SearchBooking";
import axios from "axios";

export default function Bookings() {
    const navigate = useNavigate();
    const { user, setUser } = useUser();

    const [currentPage, setCurrentPage] = useState(1); // to keep track of the current page
    const [modifyOpen, setModifyOpen] = useState(false);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState(null);
    const [redirectWithData, setRedirectWithData] = useState(false);
    const [redirectToLogin, setRedirectToLogin] = useState(false);

    const [bookingSearchSelected, setBookingSearchSelected] = useState(null);

    function handleNextBooking(event, value) {
        setCurrentPage(value);
        setBookingSearchSelected(null);
    }

    useEffect(() => {
        const checkUserLoggedIn = async () => {
            try {
                const response = await axios.get('http://localhost:3001/me', { withCredentials: true });
                if (response.data) {
                    // User is logged in, set user data in context
                    setUser(response.data);
                } else if (!response.data.bookings || response.data.bookings=== 0) {
                    setModalMessage("You don't have any bookings yet. Book a private lesson.");
                    setModalOpen(true);
                    setRedirectWithData(true);  // set the flag for redirection
                } else {
                    // User is not logged in, redirect to login
                    setRedirectToLogin(true);
                }
            } catch (error) {
                setModalMessage("Access denied! Login first.");
                setModalOpen(true);
                setRedirectToLogin(true);
            }
        };
        checkUserLoggedIn();
    }, [setUser, setModalMessage, setModalOpen, setRedirectToLogin]);

    async function deleteBooking() {
        try {
            const bookingToDelete = {
                email: user.email,
                bookingSelected: currentPage
            }

            const response = await axios.delete('http://localhost:3001/deleteBooking', { bookingToDelete }, { withCredentials: true });

            const data = response.data;

            if (response.status === 200) {
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

            } else {
                setModalMessage(data.message);
                setModalOpen(true);
            }
        } catch (error) {
            setModalMessage(error.response?.data?.message);
            setModalOpen(true);
        }
    }

    const handleBookingSearchSelected = (selectedSearchBooking) => {
        setBookingSearchSelected(selectedSearchBooking);
        const bookingPageIndex = user.bookings.findIndex(booking => booking === selectedSearchBooking) + 1;
        setCurrentPage(bookingPageIndex);
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
                        <Search onClick={handleBookingSearchSelected} user={user} />

                        <Grid container spacing={2} mt={16} justifyContent="center">
                            <Grid item md={8}>
                                <Paper
                                    sx={{
                                        marginBottom: 3,
                                        width: '100%',
                                        height: modifyOpen ? 430 : 400, // Height changes based on modifyOpen state
                                        borderRadius: '40px',
                                        backgroundColor: alpha(dashboardTheme.palette.primary.light, 0.6),
                                    }}>
                                    {!bookingSearchSelected ?
                                        <div style={{ paddingTop: '30px' }}>
                                            <RegoularH2>Full Name: {user.bookings[currentPage - 1].fullname}</RegoularH2>
                                            <RegoularH2>Birthday: {new Date(user.bookings[currentPage - 1].birthdayDate).toLocaleDateString()}</RegoularH2>
                                            <RegoularH2>Training Date: {new Date(user.bookings[currentPage - 1].trainingDate).toLocaleDateString()}</RegoularH2>
                                        </div>
                                        :
                                        <div style={{ paddingTop: '30px' }}>
                                            <RegoularH2>Full Name: {bookingSearchSelected.fullname}</RegoularH2>
                                            <RegoularH2>Birthday: {new Date(bookingSearchSelected.birthdayDate).toLocaleDateString()}</RegoularH2>
                                            <RegoularH2>Training Date: {new Date(bookingSearchSelected.trainingDate).toLocaleDateString()}</RegoularH2>
                                        </div>
                                    }
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
                                        <ModifyFormBooking setModifyOpen={setModifyOpen} setBookingSearchSelected={setBookingSearchSelected} currentBooking={currentPage} />
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