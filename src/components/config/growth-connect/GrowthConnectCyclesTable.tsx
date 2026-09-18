import {
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
} from '@mui/material';
import dayjs from 'dayjs';
import type { GrowthConnectCycle } from '../../../types/growthConnect';
import AppButton from '../../common/AppButton';
import EmptyState from '../../common/EmptyState';

const DATE_FORMAT = 'DD/MM/YYYY';

const STATUS_COLOR: Record<GrowthConnectCycle['status'], 'default' | 'success' | 'warning'> = {
  DRAFT: 'default',
  OPEN: 'success',
  CLOSED: 'warning',
};

type GrowthConnectCyclesTableProps = {
  cycles: GrowthConnectCycle[];
  isMutating?: boolean;
  onEdit: (cycle: GrowthConnectCycle) => void;
  onOpen: (cycle: GrowthConnectCycle) => void;
  onClose: (cycle: GrowthConnectCycle) => void;
  onDelete: (cycle: GrowthConnectCycle) => void;
};

const GrowthConnectCyclesTable = ({
  cycles,
  isMutating = false,
  onEdit,
  onOpen,
  onClose,
  onDelete,
}: GrowthConnectCyclesTableProps) => {
  const sorted = [...cycles].sort((a, b) => a.sequenceNo - b.sequenceNo);

  return (
    <>
      <TableContainer sx={{ mt: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Range</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((cycle) => {
              return (
                <TableRow key={cycle.id}>
                  <TableCell>{cycle.sequenceNo}</TableCell>
                  <TableCell>{cycle.name}</TableCell>
                  <TableCell>
                    {dayjs(cycle.startDate).format(DATE_FORMAT)} - {dayjs(cycle.endDate).format(DATE_FORMAT)}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={cycle.status} color={STATUS_COLOR[cycle.status]} />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {cycle.status !== 'OPEN' && (
                        <AppButton size="small" variant="outlined" disabled={isMutating} onClick={() => onOpen(cycle)}>
                          Open
                        </AppButton>
                      )}
                      {cycle.status === 'OPEN' && (
                        <AppButton size="small" variant="outlined" disabled={isMutating} onClick={() => onClose(cycle)}>
                          Close
                        </AppButton>
                      )}
                      <Tooltip title={cycle.status !== 'DRAFT' ? 'Only a cycle that has not yet been opened can be edited' : ''}>
                        <span>
                          <AppButton
                            size="small"
                            variant="outlined"
                            disabled={isMutating || cycle.status !== 'DRAFT'}
                            onClick={() => onEdit(cycle)}
                          >
                            Edit
                          </AppButton>
                        </span>
                      </Tooltip>
                      <AppButton
                        size="small"
                        variant="outlined"
                        color="error"
                        disabled={isMutating}
                        onClick={() => onDelete(cycle)}
                      >
                        Delete
                      </AppButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      {!sorted.length && (
        <EmptyState variant="box" message="No Growth Connect cycles added yet." minHeight={200} sx={{ mt: 1 }} />
      )}
    </>
  );
};

export default GrowthConnectCyclesTable;
