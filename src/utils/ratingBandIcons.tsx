// @ts-nocheck
import { memo } from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import MilitaryTechIcon from '@mui/icons-material/MilitaryTech';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbUpOffAltIcon from '@mui/icons-material/ThumbUpOffAlt';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import GradeIcon from '@mui/icons-material/Grade';
import VerifiedIcon from '@mui/icons-material/Verified';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import GroupsIcon from '@mui/icons-material/Groups';
import HandshakeIcon from '@mui/icons-material/Handshake';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

export const RATING_BAND_ICON_OPTIONS = [
  { key: 'emoji_events', label: 'Trophy', Icon: EmojiEventsIcon },
  { key: 'workspace_premium', label: 'Ribbon', Icon: WorkspacePremiumIcon },
  { key: 'military_tech', label: 'Medal', Icon: MilitaryTechIcon },
  { key: 'thumb_up', label: 'Thumbs up', Icon: ThumbUpIcon },
  { key: 'thumb_up_off_alt', label: 'Thumbs up outline', Icon: ThumbUpOffAltIcon },
  { key: 'trending_down', label: 'Trend down', Icon: TrendingDownIcon },
  { key: 'trending_up', label: 'Trend up', Icon: TrendingUpIcon },
  { key: 'show_chart', label: 'Chart', Icon: ShowChartIcon },
  { key: 'star', label: 'Star', Icon: StarIcon },
  { key: 'star_border', label: 'Star outline', Icon: StarBorderIcon },
  { key: 'grade', label: 'Grade', Icon: GradeIcon },
  { key: 'verified', label: 'Verified', Icon: VerifiedIcon },
  { key: 'rocket_launch', label: 'Rocket', Icon: RocketLaunchIcon },
  { key: 'lightbulb', label: 'Lightbulb', Icon: LightbulbIcon },
  { key: 'groups', label: 'Team', Icon: GroupsIcon },
  { key: 'handshake', label: 'Handshake', Icon: HandshakeIcon },
  { key: 'sentiment_satisfied', label: 'Satisfied', Icon: SentimentSatisfiedIcon },
  { key: 'sentiment_dissatisfied', label: 'Dissatisfied', Icon: SentimentDissatisfiedIcon },
];

export const RATING_BAND_COLOR_PRESETS = [
  '#00695c',
  '#2e7d32',
  '#1565c0',
  '#e65100',
  '#6a1b9a',
  '#c62828',
  '#ef6c00',
  '#00838f',
  '#4527a0',
  '#558b2f',
];

const ICON_BY_KEY = Object.fromEntries(
  RATING_BAND_ICON_OPTIONS.map((o) => [o.key, o.Icon])
);

const SHORT_LABEL_ICON_FALLBACK = {
  BELOW: 'trending_down',
  MEETS: 'thumb_up',
  EXCEEDS: 'workspace_premium',
  'FAR EXCEEDS': 'emoji_events',
};

const SHORT_LABEL_COLOR_FALLBACK = {
  BELOW: '#e65100',
  MEETS: '#1565c0',
  EXCEEDS: '#2e7d32',
  'FAR EXCEEDS': '#00695c',
};

const STEP_ICON_KEYS = RATING_BAND_ICON_OPTIONS.map((o) => o.key);

export function isValidHex6(s) {
  return typeof s === 'string' && /^#[0-9A-Fa-f]{6}$/.test(s.trim());
}

export function resolveBandIconKey(band, bandIndex = 0) {
  const key = String(band?.iconKey ?? band?.IconKey ?? '').trim();
  if (key && ICON_BY_KEY[key]) return key;
  const label = String(band?.shortLabel ?? '').trim().toUpperCase();
  if (SHORT_LABEL_ICON_FALLBACK[label]) return SHORT_LABEL_ICON_FALLBACK[label];
  return STEP_ICON_KEYS[bandIndex % STEP_ICON_KEYS.length] || 'emoji_events';
}

export function resolveBandAccentColor(band, bandIndex = 0, getRatingColorFn) {
  const raw = String(band?.accentColor ?? band?.AccentColor ?? '').trim();
  if (isValidHex6(raw)) return raw;
  const label = String(band?.shortLabel ?? '').trim().toUpperCase();
  if (SHORT_LABEL_COLOR_FALLBACK[label]) return SHORT_LABEL_COLOR_FALLBACK[label];
  if (RATING_BAND_COLOR_PRESETS[bandIndex]) return RATING_BAND_COLOR_PRESETS[bandIndex];
  if (typeof getRatingColorFn === 'function' && band?.shortLabel) {
    return getRatingColorFn(band.shortLabel);
  }
  return '#333333';
}

export function RatingBandIcon({ iconKey, fontSize = 'medium', sx }) {
  const key = iconKey && ICON_BY_KEY[iconKey] ? iconKey : 'emoji_events';
  const Icon = ICON_BY_KEY[key] || EmojiEventsIcon;
  return <Icon fontSize={fontSize} sx={sx} />;
}

function darkenHex(hex, amount = 0.22) {
  if (!isValidHex6(hex)) return '#1a1a1a';
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((n >> 16) & 0xff) * (1 - amount));
  const g = Math.max(0, ((n >> 8) & 0xff) * (1 - amount));
  const b = Math.max(0, (n & 0xff) * (1 - amount));
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
}

/** Short label as a ribbon — `corner` on card edge, `banner` inline below score. */
export const RatingBandShortLabelChip = memo(function RatingBandShortLabelChip({
  label,
  color,
  size = 'small',
  variant = 'corner',
}) {
  const text = String(label || '').trim();
  if (!text) return null;
  const accent = isValidHex6(color) ? color : '#333333';
  const fold = darkenHex(accent, 0.28);
  const fontSize = size === 'medium' ? '0.8125rem' : '0.6875rem';
  const py = size === 'medium' ? 0.85 : 0.65;
  const px = size === 'medium' ? 2.5 : 2;

  if (variant === 'banner') {
    return (
      <Box
        sx={{
          display: 'inline-flex',
          mt: 1,
          mb: 0.25,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.14))',
        }}
      >
        <Typography
          component="span"
          sx={{
            bgcolor: accent,
            color: '#fff',
            fontWeight: 800,
            fontSize,
            letterSpacing: 1.2,
            textTransform: 'uppercase',
            px,
            py,
            lineHeight: 1.2,
            clipPath:
              'polygon(10px 0, calc(100% - 10px) 0, 100% 50%, calc(100% - 10px) 100%, 10px 100%, 0 50%)',
          }}
        >
          {text}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      aria-label={text}
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 2,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          bgcolor: accent,
          color: '#fff',
          fontWeight: 800,
          fontSize,
          letterSpacing: 1.15,
          textTransform: 'uppercase',
          lineHeight: 1.2,
          py,
          pl: 2.25,
          pr: 2,
          minWidth: 88,
          textAlign: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.16)',
          borderBottomLeftRadius: 4,
        }}
      >
        {text}
      </Box>
      <Box
        sx={{
          width: 0,
          height: 0,
          borderStyle: 'solid',
          borderWidth: '0 0 10px 10px',
          borderColor: `transparent transparent transparent ${fold}`,
          mr: 0,
        }}
      />
    </Box>
  );
});

export function RatingBandAvatarPreview({ iconKey, color, size = 48 }) {
  const accent = isValidHex6(color) ? color : '#333333';
  return (
    <Avatar sx={{ width: size, height: size, bgcolor: accent, flexShrink: 0 }}>
      <RatingBandIcon iconKey={iconKey} fontSize={size >= 56 ? 'large' : 'medium'} />
    </Avatar>
  );
}

export const RatingBandIconGrid = memo(function RatingBandIconGrid({ value, accentColor, onChange, disabled }) {
  const accent = isValidHex6(accentColor) ? accentColor : '#1976d2';
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
        gap: 1,
        maxWidth: 520,
      }}
    >
      {RATING_BAND_ICON_OPTIONS.map((opt) => {
        const selected = value === opt.key;
        const Icon = opt.Icon;
        return (
          <Box
            key={opt.key}
            component="button"
            type="button"
            disabled={disabled}
            aria-label={opt.label}
            title={opt.label}
            onClick={() => onChange(opt.key)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              borderRadius: 1.5,
              border: '2px solid',
              borderColor: selected ? accent : 'divider',
              bgcolor: selected ? `${accent}14` : 'background.paper',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.6 : 1,
              p: 0,
              color: selected ? accent : 'text.secondary',
              '&:hover': disabled ? {} : { bgcolor: `${accent}10`, borderColor: accent },
            }}
          >
            <Icon fontSize="small" />
          </Box>
        );
      })}
    </Box>
  );
});

export const RatingBandColorPicker = memo(function RatingBandColorPicker({ value, onChange, disabled }) {
  const hex = isValidHex6(value) ? value : '#1565c0';
  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1 }}>
      {RATING_BAND_COLOR_PRESETS.map((c) => (
        <Box
          key={c}
          component="button"
          type="button"
          disabled={disabled}
          aria-label={`Color ${c}`}
          onClick={() => onChange(c)}
          sx={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            bgcolor: c,
            border: '2px solid',
            borderColor: hex === c ? 'text.primary' : 'transparent',
            cursor: disabled ? 'not-allowed' : 'pointer',
            p: 0,
            flexShrink: 0,
          }}
        />
      ))}
      <Box
        component="input"
        type="color"
        value={hex}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Custom accent color"
        sx={{ width: 36, height: 36, p: 0, border: 'none', bgcolor: 'transparent', cursor: 'pointer' }}
      />
    </Box>
  );
});
