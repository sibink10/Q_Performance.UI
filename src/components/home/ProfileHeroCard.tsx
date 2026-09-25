// @ts-nocheck
import { Avatar, Box, Chip, Divider, Skeleton, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import PersonOutlineRoundedIcon from '@mui/icons-material/PersonOutlineRounded';
import MailOutlineRoundedIcon from '@mui/icons-material/MailOutlineRounded';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import { homeType } from './homeTypography';
import { CARD_PADDING } from './homeLayout';
import { FONT_FAMILY_MONO } from '../../types/theme';
import AppCard from '../common/AppCard';

const initials = (name = '') =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

const InfoItem = ({ icon, children }) => (
  <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: 'text.secondary', minWidth: 0 }}>
    <Box sx={{ display: 'flex', '& svg': { fontSize: 17 } }}>{icon}</Box>
    <Typography noWrap sx={homeType.body}>
      {children}
    </Typography>
  </Stack>
);

const rowSx = {
  flexWrap: 'wrap',
  columnGap: 2.5,
  rowGap: 0.75,
  justifyContent: { xs: 'center', sm: 'flex-start' },
};

/** Only fields the backend actually has are rendered; empty ones are skipped. */
const ProfileHeroCard = ({ profile, loading }) => {
  const theme = useTheme();
  const primary = theme.palette.primary.main;

  if (loading || !profile) {
    return (
      <AppCard sx={{ p: CARD_PADDING }}>
        <Stack direction="row" spacing={2.5} alignItems="center">
          <Skeleton variant="circular" width={64} height={64} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="35%" height={28} />
            <Skeleton width="50%" />
            <Skeleton width="60%" />
          </Box>
        </Stack>
      </AppCard>
    );
  }

  const hasContact = profile.email || profile.phone;

  return (
    <AppCard
      sx={{
        position: 'relative',
        overflow: 'hidden',
        p: CARD_PADDING,
        boxShadow: `0 4px 20px ${alpha(theme.palette.grey[900], 0.05)}`,
        '&::before': {
          content: '""',
          position: 'absolute',
          top: -70,
          right: -50,
          width: 220,
          height: 220,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${alpha(primary, 0.12)} 0%, ${alpha(primary, 0)} 70%)`,
          pointerEvents: 'none',
        },
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 3 }}
        alignItems={{ xs: 'center', sm: 'flex-start' }}
        sx={{ position: 'relative' }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            fontSize: 22,
            fontWeight: 600,
            letterSpacing: 0.5,
            color: '#fff',
            background: `linear-gradient(135deg, ${theme.palette.primary.light || primary}, ${primary})`,
            boxShadow: `0 0 0 4px ${alpha(primary, 0.12)}, 0 6px 16px ${alpha(primary, 0.28)}`,
          }}
        >
          {initials(profile.name)}
        </Avatar>

        <Box sx={{ flex: 1, minWidth: 0, width: '100%', textAlign: { xs: 'center', sm: 'left' } }}>
          <Stack direction="row" alignItems="baseline" sx={{ ...rowSx, columnGap: 1.5, rowGap: 0 }}>
            <Typography sx={homeType.profileName}>{profile.name}</Typography>
            {profile.employeeId && (
              <Typography sx={{ ...homeType.meta, fontFamily: FONT_FAMILY_MONO }}>ID: {profile.employeeId}</Typography>
            )}
          </Stack>

          <Stack direction="row" alignItems="center" sx={{ ...rowSx, columnGap: 1, mt: 0.75 }}>
            <Chip
              label={profile.title || profile.roleLabel}
              size="small"
              sx={{ ...homeType.badge, height: 22, color: 'primary.main', bgcolor: alpha(primary, 0.1) }}
            />
          </Stack>

          {profile.reportingManager && (
            <Stack direction="row" alignItems="center" sx={{ ...rowSx, mt: 1 }}>
              <InfoItem icon={<PersonOutlineRoundedIcon />}>
                Reporting Manager:{' '}
                <Box component="span" sx={{ fontWeight: 600, color: 'primary.main' }}>
                  {profile.reportingManager}
                </Box>
              </InfoItem>
            </Stack>
          )}

          {hasContact && (
            <>
              <Divider sx={{ my: 1.25 }} />
              <Stack direction="row" alignItems="center" sx={rowSx}>
                {profile.email && <InfoItem icon={<MailOutlineRoundedIcon />}>{profile.email}</InfoItem>}
                {profile.phone && <InfoItem icon={<PhoneOutlinedIcon />}>{profile.phone}</InfoItem>}
              </Stack>
            </>
          )}
        </Box>
      </Stack>
    </AppCard>
  );
};

export default ProfileHeroCard;
