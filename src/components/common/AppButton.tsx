import { Button, CircularProgress } from '@mui/material';
import type { ButtonProps } from '@mui/material';

export type AppButtonProps = ButtonProps & {
  loading?: boolean;
};

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
}: AppButtonProps) => (
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
