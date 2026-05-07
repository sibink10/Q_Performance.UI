// @ts-nocheck
import { Box, CircularProgress, Typography } from '@mui/material';

/**
 * Full-page loader overlay.
 */
const AppLoader = ({ message = 'Loading...' }) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 300,
      gap: 2,
    }}
  >
    <CircularProgress size={48} />
    <Typography variant="body2" color="text.secondary">{message}</Typography>
  </Box>
);

export default AppLoader;
