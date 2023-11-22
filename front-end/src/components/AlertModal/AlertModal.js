import * as React from 'react';
import Backdrop from '@mui/material/Backdrop';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import Fade from '@mui/material/Fade';
import { RegoularH2 } from '../Typography/Typography';
import { alpha } from '@mui/material';
import dashboardTheme from '../DashboardTheme/DashboardTheme';

const style = {
  position: 'absolute',
  top: '50%',
  left: '49%',
  transform: 'translate(-50%, -50%)',
  backgroundColor: alpha(dashboardTheme.palette.primary.main, 0.9),
  borderRadius: '20px',
  padding: 2
};

export default function AlertModal({ children, open, onClose }) {
  return (
    <div>
      <Modal
        aria-labelledby="transition-modal-title"
        aria-describedby="transition-modal-description"
        open={open}
        onClose={onClose}
        closeAfterTransition
        slots={{ backdrop: Backdrop }}
        slotProps={{
          backdrop: {
            timeout: 1000,
          },
        }}
      >
        <Fade in={open}>
          <Box sx={style}>
            <RegoularH2>{children}</RegoularH2>
          </Box>
        </Fade>
      </Modal>
    </div>
  );
}
