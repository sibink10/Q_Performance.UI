import type { PaletteColor } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface RatingScalePalette {
    exceptional: PaletteColor;
    exceedsExpectations: PaletteColor;
    meetsExpectations: PaletteColor;
    needsImprovement: PaletteColor;
    unsatisfactory: PaletteColor;
  }

  interface Palette {
    onTrack: PaletteColor;
    needsAttention: PaletteColor;
    offTrack: PaletteColor;
    completed: PaletteColor;
    ratingScale: RatingScalePalette;
  }

  interface PaletteOptions {
    onTrack?: PaletteColor;
    needsAttention?: PaletteColor;
    offTrack?: PaletteColor;
    completed?: PaletteColor;
    ratingScale?: Partial<RatingScalePalette>;
  }
}

export {};
