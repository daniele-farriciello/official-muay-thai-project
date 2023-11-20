import { React, useState } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import  RegularTextField  from "../../components/TextField/TextField"
import { Container, Stack, Box } from "@mui/material"
import { Button } from "@mui/material"
import { useUser } from "../../components/UserContext";
import { RegoularH1 } from '../../components/Typography/Typography';
import dashboardTheme from '../../components/DashboardTheme/DashboardTheme';
import Footer from "../../components/Footer/Footer"
import AlertModal from "../../components/AlertModal/AlertModal";

export default function Login() {
    const { setUser } = useUser();
    const navigate = useNavigate();
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState(null);


    async function submit(e) {
        e.preventDefault();

        if (!email.includes('@')) {
            setModalMessage("Please enter a valid email address with '@'.");
            setModalOpen(true);
            return;
        }

        try {
            const response = await axios.post("http://localhost:3001/login", { email, password }, { withCredentials: true });
    
            if (response.data.message === "Logged in successfully") {
                // Fetch the user details after successful login
                const userResponse = await axios.get('http://localhost:3001/me', { withCredentials: true });
                
                if (userResponse.data) {
                    // Setting the fetched user details in the global context
                    setUser(userResponse.data);
                    navigate("/bookings", { state: { id: email } });
                } else {
                    setModalMessage(response.data.message);
                    setModalOpen(true);
                }
            }
        } catch (e) {
            setModalMessage("Email or password could be wrong");
            setModalOpen(true);
        }
    }

    return (
        <>
            <AlertModal open={modalOpen} onClose={() => { setModalOpen(false); setModalMessage(null); }}>
                {modalMessage}
            </AlertModal>
            <RegoularH1 color={dashboardTheme.palette.secondary.main}>Login</RegoularH1>
            <Container maxWidth="sm">
                <Box sx={{ width: '100%' }}>
                    <form action="POST" >
                        <Stack spacing={2}>
                            <RegularTextField type="email" label="Email" placeholder="mario.rossi@gmail.com" onChange={(e) => { setEmail(e.target.value) }} name="email"  id="email"autoComplete="email"/>
                            <RegularTextField type="password" label="Password" placeholder="*******" onChange={(e) => { setPassword(e.target.value) }} name="password" id="password" autoComplete="off"/>
                            <Button variant="contained" onClick={submit}>
                                Login
                            </Button>
                            <Button
                                variant="contained"
                                href="/signup"
                                sx={{
                                    color: (theme) => theme.palette.primary.main,
                                    backgroundColor: (theme) => theme.palette.secondary.main,
                                    '&:hover': {
                                        backgroundColor: (theme) => theme.palette.secondary.light, // Change color on hover
                                    },
                                }}
                            >
                                Sign Up
                            </Button>
                        </Stack>
                    </form>
                </Box>
            </Container>
            <Footer/>
        </>
    )
}