import { Box, Typography } from '@mui/material';
import type { SxProps, Theme } from '@mui/material/styles';

import emptyImg from '../../assets/empty.png';
import emptyBoxImg from '../../assets/empty-box.png';
import emptyFolderImg from '../../assets/empty-folder.png';
import noContentImg from '../../assets/no-content.png';

export type EmptyStateVariant = 'empty' | 'box' | 'folder' | 'noContent';

export type EmptyStateProps = {
  title?: string;
  message: string;
  color?: string;
  minHeight?: number | string;
  sx?: SxProps<Theme>;
  variant?: EmptyStateVariant;
  imageSrc?: string;
  imageAlt?: string;
};

const variantToImage: Record<EmptyStateVariant, string> = {
  empty: emptyImg,
  box: emptyBoxImg,
  folder: emptyFolderImg,
  noContent: noContentImg,
};

const EmptyState = ({
  title,
  message,
  color = '#01df96',
  minHeight = 240,
  sx,
  variant = 'empty',
  imageSrc,
  imageAlt = '',
}: EmptyStateProps) => {
  const src = imageSrc ?? variantToImage[variant];

  return (
    <Box
      sx={{
        minHeight,
        px: 2,
        py: 4,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        color,
        ...sx,
      }}
    >
      <Box
        sx={{
          width: { xs: 110, sm: 140 },
          height: { xs: 110, sm: 140 },
          mb: 2,
          opacity: 0.95,
        }}
      >
        <Box
          component="img"
          src={src}
          alt={imageAlt}
          aria-hidden={imageAlt ? undefined : true}
          sx={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            userSelect: 'none',
            pointerEvents: 'none',
          }}
        />
      </Box>

      {title ? (
        <Typography variant="subtitle1" fontWeight={800} sx={{ color: 'text.primary', mb: 0.5 }}>
          {title}
        </Typography>
      ) : null}
      <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 520 }}>
        {message}
      </Typography>
    </Box>
  );
};

export default EmptyState;

