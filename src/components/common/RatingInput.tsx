// @ts-nocheck
import { Box, Rating, Typography } from '@mui/material';

/**
 * Rating input component.
 * Supports numeric scale (4, 5, or 10 point).
 * For 10-point scale uses a numeric display instead of stars.
 */
const RatingInput = ({ value, onChange, scale = 5, label, readOnly = false }) => {
  if (scale === 10) {
    // Numeric scale: render numbered buttons
    return (
      <Box>
        {label && (
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {label}
          </Typography>
        )}
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <Box
              key={n}
              onClick={() => !readOnly && onChange(n)}
              sx={{
                width: 32,
                height: 32,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: readOnly ? 'default' : 'pointer',
                border: '1px solid',
                borderColor: value === n ? 'primary.main' : 'divider',
                bgcolor: value === n ? 'primary.main' : 'background.paper',
                color: value === n ? 'white' : 'text.primary',
                fontWeight: value === n ? 700 : 400,
                fontSize: '0.8rem',
                transition: 'all 0.15s',
                '&:hover': readOnly ? {} : { borderColor: 'primary.main', bgcolor: 'primary.light', color: 'white' },
              }}
            >
              {n}
            </Box>
          ))}
        </Box>
      </Box>
    );
  }

  const num = Number(value);
  const safeVal = Number.isFinite(num) ? Math.min(scale, Math.max(0, num)) : 0;

  // 4 or 5 point: use MUI Rating (fractional scores, e.g. 3.7)
  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" gutterBottom component="div">
          {label}
        </Typography>
      )}
      <Rating
        value={safeVal}
        max={scale}
        onChange={(_, v) => onChange(v == null ? 0 : Math.round(v * 10) / 10)}
        readOnly={readOnly}
        precision={0.1}
        size="medium"
        sx={{
          '& .MuiRating-iconFilled': {
            filter: 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.25))',
          },
        }}
      />
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {safeVal.toFixed(1)} / {scale}
      </Typography>
    </Box>
  );
};

export default RatingInput;
