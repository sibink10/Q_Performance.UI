// @ts-nocheck
import {
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineRoundedIcon from '@mui/icons-material/DeleteOutlineRounded';
import TimelineOutlinedIcon from '@mui/icons-material/TimelineOutlined';
import dayjs from 'dayjs';
import AppButton from '../../common/AppButton';
import { EmptyState } from '../../common';

const DATE_FORMAT = 'DD/MM/YYYY';

const FinancialYearsTable = ({ financialYears, onEdit, onDelete, onManageGrowthConnect }) => (
  <>
    <TableContainer sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Range</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {financialYears.map((row) => (
            <TableRow key={row.id}>
              <TableCell>{row.name}</TableCell>
              <TableCell>
                {row.startDate ? dayjs(row.startDate).format(DATE_FORMAT) : '-'} - {row.endDate ? dayjs(row.endDate).format(DATE_FORMAT) : '-'}
              </TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={row.isActive ? 'Active' : 'Inactive'}
                  color={row.isActive ? 'success' : 'default'}
                />
              </TableCell>
              <TableCell align="center" sx={{ width: '1%', whiteSpace: 'nowrap' }}>
                {onManageGrowthConnect && (
                  <AppButton
                    variant="outlined"
                    color="primary"
                    size="small"
                    startIcon={<TimelineOutlinedIcon />}
                    sx={{ mr: 1 }}
                    onClick={() => onManageGrowthConnect(row)}
                  >
                    View Stages
                  </AppButton>
                )}
                {onEdit && (
                  <AppButton
                    variant="outlined"
                    color="warning"
                    size="small"
                    startIcon={<EditOutlinedIcon />}
                    sx={{ mr: 1 }}
                    onClick={() => onEdit(row)}
                  >
                    Edit
                  </AppButton>
                )}
                <AppButton
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteOutlineRoundedIcon />}
                  onClick={() => onDelete(row.id)}
                >
                  Delete
                </AppButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
    {!financialYears.length && (
      <EmptyState variant="box" message="No Review Periods available yet." minHeight={220} sx={{ mt: 1 }} />
    )}
  </>
);

export default FinancialYearsTable;
