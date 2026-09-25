// Home dashboard type tokens, aligned with the app-wide spec in types/theme.ts (Manrope; JetBrains Mono for IDs).
// Spread into `sx` so every card uses identical size / weight / spacing / colour.
import { FONT_FAMILY_MONO } from '../../types/theme';

export const homeType = {
  /** Page header title: 24 / 700 */
  pageTitle: { fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', lineHeight: 1.3, color: '#0f172a' },
  /** Page header subtitle: 13 / 400 */
  pageSubtitle: { fontSize: 13, fontWeight: 400, lineHeight: 1.4, color: '#94a3b8' },
  /** Profile name: page-level emphasis but lighter than the page title */
  profileName: { fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.3, color: '#0f172a' },
  /** Section title: 14 / 600 */
  cardTitle: { fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.4, color: '#0f172a' },
  /** Detail value / row title: 13 / 600 */
  rowTitle: { fontSize: 13, fontWeight: 600, lineHeight: 1.4, color: '#0f172a' },
  /** Table-cell style secondary text: 13 / 400 */
  body: { fontSize: 13, fontWeight: 400, lineHeight: 1.4, color: '#64748b' },
  /** Hint / meta text: 12 / 400 */
  meta: { fontSize: 12, fontWeight: 400, lineHeight: 1.4, color: '#94a3b8' },
  /** Detail label: 11 / 500 uppercase */
  label: {
    fontSize: 11,
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    color: '#94a3b8',
  },
  /** KPI number */
  statValue: { fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15, color: '#0f172a' },
  /** Badge / status: 11.5 / 500 */
  badge: { fontSize: 11.5, fontWeight: 500, lineHeight: 1.25 },
  /** IDs / codes */
  mono: { fontFamily: FONT_FAMILY_MONO, fontSize: 12, fontWeight: 400 },
} as const;
