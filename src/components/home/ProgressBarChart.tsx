// @ts-nocheck
import { Skeleton } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import SectionCard from './SectionCard';

/** Stacked bar of done vs pending per review phase. Hidden when there is no data (and not loading). */
const ProgressBarChart = ({ title, subtitle, data, loading }) => {
  const theme = useTheme();

  if (!loading && !data?.length) return null;

  return (
    <SectionCard title={title} subtitle={subtitle}>
      {loading ? (
        <Skeleton variant="rounded" height={240} />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }} barCategoryGap="28%">
            <CartesianGrid vertical={false} stroke={theme.palette.divider} />
            <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: theme.palette.text.secondary }} />
            <Tooltip
              cursor={{ fill: theme.palette.action.hover }}
              contentStyle={{ borderRadius: 8, border: `1px solid ${theme.palette.divider}`, fontSize: 12 }}
            />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="done" name="Completed" stackId="a" fill={theme.palette.primary.main} />
            <Bar dataKey="pending" name="Pending" stackId="a" fill={theme.palette.grey[300]} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </SectionCard>
  );
};

export default ProgressBarChart;
