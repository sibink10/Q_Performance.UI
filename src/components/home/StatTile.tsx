// @ts-nocheck
import { Box, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import ArrowOutwardRoundedIcon from '@mui/icons-material/ArrowOutwardRounded';
import { homeType } from './homeTypography';
import { CARD_PADDING } from './homeLayout';
import AppCard from '../common/AppCard';

const StatTile = ({ stat, loading }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const color = stat ? theme.palette[stat.tone]?.main || theme.palette.primary.main : theme.palette.primary.main;
  const clickable = Boolean(stat?.path);

  if (loading || !stat) {
    return (
      <AppCard sx={{ p: CARD_PADDING, height: '100%' }}>
        <Skeleton width="50%" />
        <Skeleton width="35%" height={40} />
        <Skeleton width="60%" />
      </AppCard>
    );
  }

  return (
    <AppCard
      onClick={clickable ? () => navigate(stat.path) : undefined}
      sx={{
        p: CARD_PADDING,
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 1,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'transform .2s, box-shadow .2s, border-color .2s',
        '&::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 18,
          bottom: 18,
          width: 3,
          borderRadius: 3,
          bgcolor: color,
        },
        ...(clickable && {
          '&:hover': {
            transform: 'translateY(-2px)',
            borderColor: alpha(color, 0.5),
            boxShadow: `0 10px 24px ${alpha(color, 0.14)}`,
          },
        }),
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography sx={homeType.label} noWrap>
          {stat.label}
        </Typography>
        {clickable && <ArrowOutwardRoundedIcon sx={{ fontSize: 16, color: 'text.disabled' }} />}
      </Stack>
      <Typography sx={homeType.statValue}>{stat.value}</Typography>
      <Box sx={{ minHeight: 22 }}>
        {stat.hint && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              px: 1,
              py: 0.25,
              borderRadius: 1,
              bgcolor: alpha(color, 0.1),
              color,
              ...homeType.badge,
            }}
          >
            {stat.hint}
          </Box>
        )}
      </Box>
    </AppCard>
  );
};

export default StatTile;
