// @ts-nocheck
import { TextField } from '@mui/material';

/**
 * Reusable text input with consistent styling.
 */
const AppInput = ({ label, fullWidth = true, size = 'small', ...props }) => (
  <TextField label={label} fullWidth={fullWidth} size={size} {...props} />
);

export default AppInput;
