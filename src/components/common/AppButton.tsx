// @ts-nocheck
// src/components/common/AppButton
import { Button, CircularProgress } from '@mui/material';

/**
 * Reusable Button with built-in loading state.
 * Wraps MUI Button with consistent styling and spinner support.
 */
const AppButton = ({
  children,
  loading = false,
  variant = 'contained',
  size = 'medium',
  startIcon,
  ...props
}) => (
  <Button
    variant={variant}
    size={size}
    disabled={loading || props.disabled}
    startIcon={loading ? <CircularProgress size={16} color="inherit" /> : startIcon}
    {...props}
  >
    {children}
  </Button>
);

export default AppButton;
