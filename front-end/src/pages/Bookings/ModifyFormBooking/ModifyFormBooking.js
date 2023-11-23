import React, { useState } from "react";
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import { alpha, Button } from '@mui/material';
import CalendarBirthday from '../../../components/CalendarBirthday/CalendarBirthday';
import CalendarTrainingMembership from '../../../components/CalendarTrainingMembership/CalendarTrainingMembership';
import dashboardTheme from '../../../components/DashboardTheme/DashboardTheme';
import AlertModal from '../../../components/AlertModal/AlertModal';
import { useUser } from "../../../components/UserContext";
import RegularTextField from "../../../components/TextField/TextField";
import axios from "axios";


export default function ModifyFormBooking({ setModifyOpen, currentBooking, setBookingSearchSelected}) {
    const { user, setUser } = useUser();
    const [fullName, setFullName] = React.useState('');
    const [birthdayDate, setBirthdayDate] = React.useState(null);
    const [trainingDate, setTrainingDate] = React.useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState(null);
    const [bookingBeenModified, setBookingBeenModified] = useState(false);

    function isFormValid() {
        return (
            fullName &&
            birthdayDate &&
            trainingDate
        );
    };

    async function submit(e) {

        if (!isFormValid()) {
            setModalMessage("Complete the form befor submitting.");
            setModalOpen(true);
            return;
          }

        const modifiedBookingData = {
            email: user.email,
            fullname: fullName,
            birthdayDate: birthdayDate,
            trainingDate: trainingDate,
            bookingSelected: currentBooking - 1
        };

        try {
            const response = await axios.patch('http://localhost:3001/modifyBooking', modifiedBookingData ,{ withCredentials: true });
            const data = response.data;

            if (response.status === 200) {
                setModalMessage(data.message);
                setModalOpen(true);
                setBookingSearchSelected(null); 
                setUser({
                    ...user,
                    bookings: user.bookings.map((booking, index) =>
                        index === modifiedBookingData.bookingSelected ? modifiedBookingData : booking
                    )
                });
                setBookingBeenModified(true)
            }
        } catch (error) {
            setModalMessage(error.response?.data?.message);
            setModalOpen(true);
        }

    }

    return (
        <>
            <AlertModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setModalMessage(null);
                    bookingBeenModified ? setModifyOpen(false) : setModifyOpen(true);             
                    setBookingBeenModified(false)
                }}>
                {modalMessage}
            </AlertModal>
            <Box width={"75%"} ml={8} pt={3} pb={3}>
                <form method="POST">
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <RegularTextField
                                fullWidth
                                backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)}
                                type="text"
                                label="Full Name"
                                placeholder="Forename Surname"
                                onChange={(e) => setFullName(e.target.value)}
                                value={fullName}
                                name="fullName"
                                id="fullName"
                                autoComplete="given-name"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <CalendarBirthday
                                fullWidth
                                backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)}
                                onChange={(date) => setBirthdayDate(date)}
                                value={birthdayDate}
                                label="Birthday"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <CalendarTrainingMembership
                                fullWidth
                                backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)}
                                onChange={(date) => setTrainingDate(date)}
                                value={trainingDate}
                                label="Training"
                            />
                        </Grid>
                    </Grid>
                </form>
            </Box>
            <Grid container justifyContent="center" spacing={3}>
                <Grid item>
                    <Button variant="contained" onClick={submit}>
                        Confirm
                    </Button>
                </Grid>
                <Grid item>
                    <Button variant="contained" onClick={() => { setModifyOpen(false); }}>
                        Cancel
                    </Button>
                </Grid>
            </Grid>
        </>
    );
}
