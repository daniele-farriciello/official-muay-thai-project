import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Paper, Container, Stack, Box } from "@mui/material";
import { useUser } from "../../components/UserContext";
import CalendarTrainingMembership from "../../components/CalendarTrainingMembership/CalendarTrainingMembership";
import RegularTextField from "../../components/TextField/TextField";
import CalendarPaymentField from "../../components/CalendarPaymentField/CalendarPaymentField";
import { alpha } from '@mui/material/styles';
import { RegoularH1, RegoularH2 } from "../../components/Typography/Typography";
import dashboardTheme from '../../components/DashboardTheme/DashboardTheme';
import AlertModal from "../../components/AlertModal/AlertModal";
import TimeRemaining from "../../components/TimeRemaining/TimeRemaining";
import { number as validateCardNumber, cvv as validateCvv, expirationDate as validateExpirationDate } from 'card-validator';


export default function MembershipPage() {
    const { user, setUser } = useUser();
    const navigate = useNavigate();

    const [activationDay, setActivationDay] = useState(null);

    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [cvv, setCvv] = useState('');
    const [expiryDate, setExpiryDate] = useState(null);

    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState(null);
    const [redirectWithData, setRedirectWithData] = useState(false);
    const [redirectToLogin, setRedirectToLogin] = useState(false);

    useEffect(() => {
        if (!user) {
            setModalMessage("Access denied! Login first.");
            setModalOpen(true);
            setRedirectToLogin(true);
        }
    }, [user, navigate]);


    function isFormValid() {
        return (
            activationDay && cardName && cardNumber && cvv && expiryDate
        );
    }

    function validateCardDetails() {
        const numberValidation = validateCardNumber(cardNumber);
        if (!numberValidation.isValid) {
            return "Invalid card number.";
        }

        const cvvValidation = validateCvv(cvv);
        if (!cvvValidation.isValid) {
            return "Invalid CVV.";
        }

        const expiryValidation = validateExpirationDate(expiryDate);
        if (!expiryValidation.isValid) {
            return "Invalid expiry date.";
        }
        return "";
    }

    async function submit(e) {
        e.preventDefault();

        const cardValidationMessage = validateCardDetails();
        if (cardValidationMessage) {
            setModalMessage(cardValidationMessage);
            setModalOpen(true);
            return;
        }

        if (!isFormValid()) {
            setModalMessage("Complete the form befor submitting.");
            setModalOpen(true);
            return;
        }

        const member = {
            activationDay: activationDay,
            email: user.email
        }

        try {
            const response = await fetch('http://localhost:3001/membershipPage', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(member)
            });

            const data = await response.json();

            if (response.ok) {
                setModalMessage(data.message);
                setModalOpen(true);
                setRedirectWithData(true);
                setUser({
                    ...user,
                    member
                });
            } else {
                setModalMessage(data.message);
                setModalOpen(true);
            }
        } catch (error) {
            setModalMessage("Network error. Please try again.");
            setModalOpen(true);
        }
    }

    async function submitDeletation() {
        const member = {
            email: user.email
        };

        try {
            const response = await fetch('http://localhost:3001/removeMembership', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(member)
            });

            const data = await response.json();

            if (response.ok) {
                setModalMessage(data.message);
                setModalOpen(true);
                setUser({
                    ...user,
                    member: { activationDay: null }
                });
            } else {
                setModalMessage(data.message);
                setModalOpen(true);
            }
        } catch (error) {
            setModalMessage("Network error. Please try again.");
            setModalOpen(true);
        }
    }



    return (
        <div className="membership-page">
            <AlertModal
                open={modalOpen}
                onClose={() => {
                    setModalOpen(false);
                    setModalMessage(null);
                    if (redirectWithData) {
                        navigate("/", { state: { id: user.email } });
                    }
                    if (redirectToLogin) {
                        navigate("/login");
                    }
                }}>
                {modalMessage}
            </AlertModal>
            {user && user.member && user.member.activationDay ? (
                <Container maxWidth="sm">
                    <Box width={"95%"} ml={4} pt={20} pb={5}>
                        <Paper
                            sx={{
                                marginLeft: 6,
                                padding: 2,
                                width: '100%',
                                backgroundColor: alpha(dashboardTheme.palette.secondary.light, 0.4),
                                borderRadius: '20px'
                            }}>
                            <RegoularH2 color={dashboardTheme.palette.primary.light}>{user && user.member && user.member.activationDay ? `Membership Start Date: ${new Date(user.member.activationDay).toLocaleDateString()}` : ''}</RegoularH2>
                            <RegoularH2 color={dashboardTheme.palette.primary.light}><TimeRemaining activationDate={user && user.member && user.member.activationDay ? new Date(user.member.activationDay) : null} /></RegoularH2>
                            <Button
                                variant="contained"
                                onClick={submitDeletation}
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
                                Remove memberhsip
                            </Button>
                        </Paper>
                    </Box>
                </Container>

            ) : (
                <>
                    <RegoularH1 color={dashboardTheme.palette.primary.main}>Become a Member</RegoularH1>
                    <Container maxWidth="sm">
                        <Paper
                            sx={{
                                marginLeft: 6,
                                marginBottom: 3,
                                width: '95%',
                                backgroundColor: alpha(dashboardTheme.palette.secondary.light, 0.4),
                                borderRadius: '20px'
                            }}>
                            <Box width={"75%"} ml={8} pt={5} pb={5}>
                                <form action="POST">
                                    <Stack spacing={2}>
                                        <CalendarTrainingMembership
                                            backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)}
                                            onChange={(date) => setActivationDay(date)}
                                            value={activationDay}
                                            label="Begin Membership"
                                        />
                                        <RegularTextField backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)} onChange={(e) => setCardName(e.target.value)} value={cardName} label="Name on Card" placeholder="Furname Surname" />
                                        <RegularTextField backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)} onChange={(e) => setCardNumber(e.target.value)} value={cardNumber} label="Card Number" placeholder="0000 0000 0000 0000" />
                                        <RegularTextField backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)} onChange={(e) => setCvv(e.target.value)} value={cvv} label="CVV" placeholder="000" required={true} minRows={3} maxRow={3} />
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
                </>
            )}
        </div>
    );
}
