import React, { useState } from 'react';
import Fuse from 'fuse.js';
import { Box, List, ListItem, ListItemText, Divider, alpha } from '@mui/material';
import RegularTextField from '../../../components/TextField/TextField';
import dashboardTheme from '../../../components/DashboardTheme/DashboardTheme';
// comment
export default function Search({ onClick, user }) {
    const [searchResults, setSearchResults] = useState([]);

    const fuse = new Fuse(user && user.bookings ? user.bookings : [], {
        keys: ['fullname'],
        includeScore: true
    });

    const handleSearch = (e) => {
        const query = e.target.value;
        if (query) {
            const results = fuse.search(query).map(result => result.item);
            setSearchResults(results);
        } else {
            setSearchResults([]);
        }
    };

    const handleListItemClick = (booking) => {
        onClick(booking);
    };

    return (
        <Box sx={{ position: 'relative', width: '100%' }}>
            <Box sx={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '50%',
                zIndex: 1
            }}>
                <RegularTextField backgroundColor={alpha(dashboardTheme.palette.primary.main, 0.7)} onChange={handleSearch} id="outlined-basic" label="Search Booking" variant="outlined" placeholder="Full me" />
                {searchResults.map((booking, index) => (
                    <List sx={{ p: 0 }} key={index}>
                        <ListItem
                            button
                            sx={{
                                borderRadius: '5px',
                                padding: 0.9,
                                backgroundColor: alpha(dashboardTheme.palette.primary.main, 0.7),
                                '&:hover': {
                                    backgroundColor: alpha(dashboardTheme.palette.primary.dark, 0.8),
                                }
                            }}
                            onClick={() => handleListItemClick(booking)}
                        >
                            <ListItemText primary={booking.fullname} /> {/* Ensure this matches the property name */}
                        </ListItem>
                        <Divider />
                    </List>
                ))}
            </Box>
        </Box>
    );
}
