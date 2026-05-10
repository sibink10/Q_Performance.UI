// @ts-nocheck
import { Box, Rating, TextField, Typography } from '@mui/material';

function clampStarRating(n, scale) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(scale, Math.max(0, Math.round(n * 10) / 10));
}

function clampTenPointRating(n) {
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(1, Math.round(n)));
}

/**
 * Rating input component.
 * Supports numeric scale (4, 5, or 10 point).
 * For 10-point scale uses a numeric display instead of stars.
 * A small number field lets users type a score; values are clamped to the scale (cannot exceed max).
 */
const RatingInput = ({ value, onChange, scale = 5, label, readOnly = false }) => {
  if (scale === 10) {
    const num = Number(value);
    const safeVal = Number.isFinite(num) ? clampTenPointRating(num) : 0;
    const fieldValue = safeVal >= 1 && safeVal <= 10 ? String(safeVal) : '';

    const applyTypedTen = (raw) => {
      if (readOnly) return;
      const s = String(raw ?? '').trim();
      if (s === '') {
        onChange(0);
        return;
      }
      const n = Number(s);
      if (!Number.isFinite(n)) return;
      onChange(clampTenPointRating(n));
    };

    // Numeric scale: render numbered buttons + compact score field
    return (
      <Box>
        {label && (
          <Typography variant="caption" color="text.secondary" gutterBottom>
            {label}
          </Typography>
        )}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
          <TextField
            size="small"
            type="number"
            label="Score"
            value={fieldValue}
            onChange={(e) => applyTypedTen(e.target.value)}
            disabled={readOnly}
            inputProps={{
              min: 1,
              max: 10,
              step: 1,
              'aria-label': 'Rating score',
            }}
            sx={{ width: 88, '& input': { py: 0.75 } }}
          />
        </Box>
      </Box>
    );
  }

  const num = Number(value);
  const safeVal = Number.isFinite(num) ? Math.min(scale, Math.max(0, num)) : 0;
  const displayVal = clampStarRating(safeVal, scale);

  const applyTypedStar = (raw) => {
    if (readOnly) return;
    const s = String(raw ?? '').trim();
    if (s === '') {
      onChange(0);
      return;
    }
    const n = Number(s);
    if (!Number.isFinite(n)) return;
    onChange(clampStarRating(n, scale));
  };

  // 4 or 5 point: use MUI Rating (fractional scores, e.g. 3.7)
  return (
    <Box>
      {label && (
        <Typography variant="caption" color="text.secondary" gutterBottom component="div">
          {label}
        </Typography>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
        <Rating
          value={displayVal}
          max={scale}
          onChange={(_, v) => onChange(v == null ? 0 : Math.round(v * 10) / 10)}
          readOnly={readOnly}
          precision={0.1}
          size="medium"
          sx={(theme) => ({
            maxWidth: '100%',
            '& .MuiRating-iconFilled': {
              filter: 'drop-shadow(0 2px 4px rgba(79, 70, 229, 0.25))',
            },
            [theme.breakpoints.down('sm')]: {
              '& .MuiRating-icon': {
                fontSize: scale >= 7 ? '1.1rem' : '1.35rem',
              },
            },
          })}
        />
        <TextField
          size="small"
          type="number"
          label="Score"
          value={displayVal === 0 ? '' : String(displayVal)}
          onChange={(e) => applyTypedStar(e.target.value)}
          disabled={readOnly}
          inputProps={{
            min: 0,
            max: scale,
            step: 0.1,
            'aria-label': 'Rating score',
          }}
          sx={{ width: 88, '& input': { py: 0.75 } }}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
        {displayVal.toFixed(1)} / {scale}
      </Typography>
    </Box>
  );
};

export default RatingInput;
