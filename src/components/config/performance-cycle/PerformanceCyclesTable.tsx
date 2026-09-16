import {
  Chip,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import dayjs from 'dayjs';
import type { PerformanceCycle } from '../../../types/performanceCycle';
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

type PerformanceCyclesTableProps = {
  cycles: PerformanceCycle[];
  selectedCycleId: string | null;
  onSelectCycle: (cycle: PerformanceCycle) => void;
  onEditCycle: (cycle: PerformanceCycle) => void;
  onDeleteCycle: (cycle: PerformanceCycle) => void;
};

const PerformanceCyclesTable = ({
  cycles,
  selectedCycleId,
  onSelectCycle,
  onEditCycle,
  onDeleteCycle,
}: PerformanceCyclesTableProps) => (
  <>
    <TableContainer sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Dates</TableCell>
            <TableCell>Status</TableCell>
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
              <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                  <Tooltip title="Edit cycle">
                    <IconButton
                      size="small"
                      aria-label="Edit cycle"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditCycle(row);
                      }}
                    >
                      <EditOutlinedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete cycle">
                    <IconButton
                      size="small"
                      color="error"
                      aria-label="Delete cycle"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteCycle(row);
                      }}
                    >
                      <DeleteOutlineRoundedIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Stack>
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
