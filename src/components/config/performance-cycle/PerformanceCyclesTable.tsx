import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import dayjs from 'dayjs';
import type { CycleStage, PerformanceCycle } from '../../../types/performanceCycle';
import AppButton from '../../common/AppButton';
import { EmptyState } from '../../common';

const DATE_FORMAT = 'DD/MM/YYYY';

const CYCLE_STATUS_LABELS: Record<PerformanceCycle['status'], string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  CLOSED: 'Closed',
};

const CYCLE_STATUS_COLORS: Record<
  PerformanceCycle['status'],
  'default' | 'success' | 'warning'
> = {
  DRAFT: 'default',
  ACTIVE: 'success',
  CLOSED: 'warning',
};

export function getCycleCompletionPercent(stages: CycleStage[]): number {
  if (!stages.length) return 0;
  const completed = stages.filter((s) => s.status === 'COMPLETED').length;
  return Math.round((completed / stages.length) * 100);
}

type PerformanceCyclesTableProps = {
  cycles: PerformanceCycle[];
  selectedCycleId: string | null;
  onSelectCycle: (cycle: PerformanceCycle) => void;
};

const PerformanceCyclesTable = ({
  cycles,
  selectedCycleId,
  onSelectCycle,
}: PerformanceCyclesTableProps) => (
  <>
    <TableContainer sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Dates</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Completion %</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {cycles.map((row) => (
            <TableRow
              key={row.id}
              hover
              selected={selectedCycleId === row.id}
              sx={{ cursor: 'pointer' }}
              onClick={() => onSelectCycle(row)}
            >
              <TableCell>{row.name}</TableCell>
              <TableCell>
                {row.startDate ? dayjs(row.startDate).format(DATE_FORMAT) : '-'} –{' '}
                {row.endDate ? dayjs(row.endDate).format(DATE_FORMAT) : '-'}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={CYCLE_STATUS_LABELS[row.status]}
                  color={CYCLE_STATUS_COLORS[row.status]}
                />
              </TableCell>
              <TableCell>{getCycleCompletionPercent(row.stages)}%</TableCell>
              <TableCell align="right">
                <AppButton
                  variant="outlined"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectCycle(row);
                  }}
                >
                  {selectedCycleId === row.id ? 'Viewing Stages' : 'View Stages'}
                </AppButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    {!cycles.length && (
      <EmptyState variant="box" message="No performance cycles available yet." minHeight={220} sx={{ mt: 1 }} />
    )}
  </>
);

export default PerformanceCyclesTable;
