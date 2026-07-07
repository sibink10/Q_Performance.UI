// @ts-nocheck
import { memo, useCallback } from 'react';
import { Box, Chip, Grid, TextField, Typography } from '@mui/material';
import { AppCard } from '../../common';
import {
  RatingBandAvatarPreview,
  RatingBandColorPicker,
  RatingBandIconGrid,
  RatingBandShortLabelChip,
  isValidHex6,
} from '../../../utils/ratingBandIcons';

type Props = {
  index: number;
  band: any;
  saving: boolean;
  onFieldChange: (index: number, field: string, value: string | number) => void;
};

const RatingBandCard = ({ index, band, saving, onFieldChange }: Props) => {
  const accent = isValidHex6(band.accentColor) ? band.accentColor : '#1565c0';
  const rangeLabel =
    band.minScore != null && band.maxScore != null
      ? `${Number(band.minScore).toFixed(1)} – ${Number(band.maxScore).toFixed(1)}`
      : `Band ${index + 1}`;

  const handleIconChange = useCallback(
    (key: string) => onFieldChange(index, 'iconKey', key),
    [index, onFieldChange]
  );

  const handleColorChange = useCallback(
    (c: string) => onFieldChange(index, 'accentColor', c),
    [index, onFieldChange]
  );

  return (
    <AppCard
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: { xs: 2, sm: 2.5 },
        borderLeft: '4px solid',
        borderLeftColor: accent,
        bgcolor: `${accent}08`,
      }}
    >
      <RatingBandShortLabelChip label={band.shortLabel} color={accent} variant="corner" />
      <Box
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 1.5,
          mb: 2,
        }}
      >
        <RatingBandAvatarPreview iconKey={band.iconKey} color={accent} size={52} />
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
            <Chip
              label={`Level ${index + 1}`}
              size="small"
              sx={{ fontWeight: 700, bgcolor: `${accent}18`, color: accent }}
            />
            <Chip label={rangeLabel} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
          </Box>
        </Box>
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
        Icon
      </Typography>
      <RatingBandIconGrid
        value={band.iconKey}
        accentColor={accent}
        disabled={saving}
        onChange={handleIconChange}
      />

      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 2, mb: 0.75 }}>
        Accent color
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <RatingBandColorPicker value={accent} disabled={saving} onChange={handleColorChange} />
        <TextField
          label="Hex"
          size="small"
          value={band.accentColor ?? ''}
          onChange={(e) => onFieldChange(index, 'accentColor', e.target.value)}
          placeholder="#1565c0"
          sx={{ width: 120 }}
        />
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Min score"
            size="small"
            type="number"
            inputProps={{ step: 0.1, min: 0.1 }}
            value={band.minScore ?? ''}
            onChange={(e) => onFieldChange(index, 'minScore', Number(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <TextField
            label="Max score"
            size="small"
            type="number"
            inputProps={{ step: 0.1, min: 0.1 }}
            value={band.maxScore ?? ''}
            onChange={(e) => onFieldChange(index, 'maxScore', Number(e.target.value))}
            fullWidth
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Short label"
            size="small"
            value={band.shortLabel ?? ''}
            onChange={(e) => onFieldChange(index, 'shortLabel', e.target.value)}
            fullWidth
            placeholder="e.g. EXCEEDS"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Title"
            size="small"
            value={band.title ?? ''}
            onChange={(e) => onFieldChange(index, 'title', e.target.value)}
            fullWidth
            placeholder="e.g. Strong Performer"
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            label="Description"
            size="small"
            value={band.description ?? ''}
            onChange={(e) => onFieldChange(index, 'description', e.target.value)}
            fullWidth
            multiline
            minRows={3}
            placeholder="Description shown on the employee results page for scores in this range."
          />
        </Grid>
      </Grid>
    </AppCard>
  );
};

export default memo(RatingBandCard);
