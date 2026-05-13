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
import dayjs from 'dayjs';
import AppButton from '../../common/AppButton';
import { EmptyState } from '../../common';

const DATE_FORMAT = 'DD/MM/YYYY';

const FinancialYearsTable = ({ financialYears, onDelete }) => (
  <>
    <TableContainer sx={{ mt: 2 }}>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Range</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Actions</TableCell>
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
              <TableCell align="right">
                <AppButton
                  variant="outlined"
                  color="error"
                  size="small"
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
