import { Box, Stack, Typography } from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import DateTimeStamp from './DateTimeStamp';

export type TimelineTone = 'default' | 'success' | 'warning' | 'error' | 'info';

export type TimelineMetaItem = {
  label: string;
  value: string;
};

export type TimelineEntry = {
  id: string;
  date: string;
  title: string;
  subtitle?: string;
  description?: string;
  meta?: TimelineMetaItem[];
  tone?: TimelineTone;
};

export type TimelineProps = {
  entries: TimelineEntry[];
  emptyMessage?: string;
};

/**
 * Generic vertical audit-trail / event timeline. Read-only — consumers control
 * what entries mean; this component only renders them in order.
 */
const Timeline = ({ entries, emptyMessage = 'No history yet.' }: TimelineProps) => {
  const theme = useTheme();

  const toneColor = (tone: TimelineTone = 'default') => {
    switch (tone) {
      case 'success':
        return theme.palette.success.main;
      case 'warning':
        return theme.palette.warning.main;
      case 'error':
        return theme.palette.error.main;
      case 'info':
        return theme.palette.info.main;
      default:
        return theme.palette.primary.main;
    }
  };

  if (!entries.length) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
        {emptyMessage}
      </Typography>
    );
  }

  return (
    <Stack spacing={0}>
      {entries.map((entry, index) => {
        const color = toneColor(entry.tone);
        const isLast = index === entries.length - 1;

        return (
          <Box key={entry.id} sx={{ display: 'flex', gap: 1.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 16 }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: color,
                  border: `2px solid ${alpha(color, 0.25)}`,
                  flexShrink: 0,
                  mt: 0.5,
                }}
              />
              {!isLast && (
                <Box
                  sx={{
                    width: 2,
                    flex: 1,
                    minHeight: 24,
                    backgroundColor: alpha(theme.palette.grey[500], 0.25),
                    mt: 0.25,
                  }}
                />
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0, pb: isLast ? 0 : 2.5 }}>
              <Stack direction="row" spacing={1} alignItems="baseline" flexWrap="wrap" useFlexGap>
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                  {entry.title}
                </Typography>
                <DateTimeStamp date={entry.date} />
              </Stack>

              {entry.subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {entry.subtitle}
                </Typography>
              )}

              {entry.description && (
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {entry.description}
                </Typography>
              )}

              {entry.meta && entry.meta.length > 0 && (
                <Box
                  sx={{
                    mt: 1,
                    p: 1.25,
                    borderRadius: 1.5,
                    backgroundColor: alpha(theme.palette.grey[500], 0.06),
                    border: '1px solid',
                    borderColor: alpha(theme.palette.grey[500], 0.15),
                  }}
                >
                  <Stack spacing={0.5}>
                    {entry.meta.map((item) => (
                      <Stack key={item.label} direction="row" spacing={1}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontWeight: 600, minWidth: 90 }}
                        >
                          {item.label}
                        </Typography>
                        <Typography variant="caption" sx={{ wordBreak: 'break-word' }}>
                          {item.value}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </Box>
          </Box>
        );
      })}
    </Stack>
  );
};

export default Timeline;
