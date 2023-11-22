import RegularTextField from "../../components/TextField/TextField";
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Paper } from "@mui/material";
import { Container, Stack, Box } from "@mui/material";
import { useUser } from "../../components/UserContext";
import CalendarPaymentField from "../../components/CalendarPaymentField/CalendarPaymentField";
import { alpha } from '@mui/material/styles';
import { RegoularH1 } from "../../components/Typography/Typography";
import dashboardTheme from '../../components/DashboardTheme/DashboardTheme';
import AlertModal from "../../components/AlertModal/AlertModal";
import CalendarBirthday from "../../components/CalendarBirthday/CalendarBirthday";
import CalendarTrainingMembership from "../../components/CalendarTrainingMembership/CalendarTrainingMembership";
import axios from "axios";

function NewBooking() {

  const { user, setUser } = useUser();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [birthdayDate, setBirthdayDate] = useState(null);
  const [trainingDate, setTrainingDate] = useState(null);

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cvv, setCvv] = useState('');
  const [expiryDate, setExpiryDate] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState(null);
  const [redirectWithData, setRedirectWithData] = useState(false);
  const [redirectToLogin, setRedirectToLogin] = useState(false);

  function isFormValid() {
    return (
      fullName &&
      birthdayDate &&
      trainingDate &&
      cardName &&
      cardNumber &&
      cvv &&
      expiryDate
    );
  };

  //Check if user is logged in before to book a lesson
  useEffect(() => {
    const checkUserLoggedIn = async () => {
      try {
        const response = await axios.get('http://localhost:3001/me', { withCredentials: true });
        if (response.data) {
          // User is logged in, set user data in context
          setUser(response.data);
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


  async function submit(e) {
    e.preventDefault();

    if (!isFormValid()) {
      setModalMessage("Complete the form befor submitting.");
      setModalOpen(true);
      return;
    }

    const bookingData = {
      email: user.email,
      fullname: fullName,
      birthdayDate: birthdayDate,
      trainingDate: trainingDate
    };

    try {
      const response = await axios.post('http://localhost:3001/newBooking', bookingData, { withCredentials: true });
      const data = response.data;

      if (response.status === 200) {
        setModalMessage(data.message);
        setModalOpen(true);
        setRedirectWithData(true);
        setUser({
          ...user,
          bookings: [...user.bookings, bookingData]
        });
        // ;
      } else {
        setModalMessage(data.message);
        setModalOpen(true);
      }
    } catch (error) {
      setModalMessage(error.response?.data?.message);
      setModalOpen(true);
    }
  }




  return (
    <div className="new-booking-page">
      <AlertModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setModalMessage(null);
          // if i don't use these statement it will navigate straigh away, without showing the modal
          if (redirectWithData) {
            navigate("/bookings", { state: { id: user.email } });
          }
          if (redirectToLogin) {
            navigate("/login");
          }
        }}>
        {modalMessage}
      </AlertModal>
      <RegoularH1 color={dashboardTheme.palette.primary.main}>New Booking</RegoularH1>
      <Container maxWidth="sm">
        <Paper
          sx={{
            marginBottom: 3,
            width: '95%',
            backgroundColor: alpha(dashboardTheme.palette.secondary.light, 0.4),
            borderRadius: '20px'
          }}>
          <Box width={"75%"} ml={8} pt={5} pb={5}>
            <form action="POST" >
              <Stack spacing={2}>
                <RegularTextField
                  backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)}
                  type="text"
                  label="Full Name"
                  placeholder="Furname Surname"
                  onChange={(e) => setFullName(e.target.value)}
                  value={fullName}
                  name="fullName"
                  id="fullName"
                  autoComplete="given-name"
                />
                <CalendarBirthday
                  backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)}
                  onChange={(date) => setBirthdayDate(date)}
                  value={birthdayDate}
                  label="Birthday's Date"
                />
                <CalendarTrainingMembership
                  backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)}
                  onChange={(date) => setTrainingDate(date)}
                  value={trainingDate}
                  label="Training Date"
                />
                <RegularTextField backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)} onChange={(e) => setCardName(e.target.value)} value={cardName} label="Name on Card" placeholder="Furname Surname" name="fullNameCard" id="fullNameCard" autoComplete="given-name" />
                <RegularTextField backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)} onChange={(e) => setCardNumber(e.target.value)} value={cardNumber} label="Card Number" placeholder="0000 0000 0000 0000" name="card-number" id="card-number" autoComplete="card-number" />
                <RegularTextField backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)} onChange={(e) => setCvv(e.target.value)} value={cvv} label="CVV" placeholder="000" required={true} minRows={3} maxRow={3} name="expire-number" id="expire-number" autoComplete="expire-number" />
                <CalendarPaymentField
                  backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)}
                  label="Expire Date"
                  onChange={(date) => setExpiryDate(date)}
                  value={expiryDate}
                />
                <Button
                  variant="contained"
                  onClick={submit}
                  sx={{
                    fontFamily: 'Playfair Display, serif',
                    fontWeight: '500%',
                    backgroundColor: alpha(dashboardTheme.palette.secondary.light, 1),
                    transition: 'transform 0.5s, color 0.5s, background 0.5s',
                    ':hover': {
                      color: dashboardTheme.palette.primary.dark,
                      backgroundColor: alpha(dashboardTheme.palette.secondary.main, 0.85)
                    }
                  }}
                >
                  Book
                </Button>
              </Stack>
            </form>
          </Box>
        </Paper>
      </Container>
    </div>
  );
}

export default NewBooking;