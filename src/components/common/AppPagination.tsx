import { Box, FormControl, MenuItem, Pagination, Select, Typography } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';

export type AppPaginationProps = {
  page: number;
  pageSize: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  sx?: object;
};

/**
 * Reusable page-number pagination bar: "Showing X-Y of Z" label, page controls,
 * and an optional page-size selector. Generic - any paginated list can use it.
 */
const AppPagination = ({
  page,
  pageSize,
  totalCount,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50],
  sx,
}: AppPaginationProps) => {
  if (totalCount === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const rangeStart = (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, totalCount);

  return (
    <Box
      sx={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 1.5,
        mt: 2,
        ...sx,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {rangeStart}-{rangeEnd} of {totalCount}
      </Typography>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        {onPageSizeChange && (
          <FormControl size="small">
            <Select
              value={pageSize}
              onChange={(e: SelectChangeEvent<number>) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((opt) => (
                <MenuItem key={opt} value={opt}>
                  {opt} / page
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <Pagination
          page={page}
          count={totalPages}
          onChange={(_, value) => onPageChange(value)}
          shape="rounded"
          color="primary"
          size="small"
        />
      </Box>
    </Box>
  );
};

export default AppPagination;
