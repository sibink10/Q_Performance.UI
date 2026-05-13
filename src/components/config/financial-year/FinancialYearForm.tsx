// @ts-nocheck
import { Grid, Stack, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import AppButton from '../../common/AppButton';

const DATE_FORMAT = 'DD/MM/YYYY';

const FinancialYearForm = ({ value, onChange, onCreate, canCreate }) => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={3}>
      <TextField
        size="small"
        fullWidth
        label="Name"
        value={value.name}
        onChange={(e) => onChange((p) => ({ ...p, name: e.target.value }))}
        inputProps={{ style: { fontSize: 13 } }}
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <DatePicker
        label="Start date"
        value={value.startDate ? dayjs(value.startDate) : null}
        onChange={(v) => onChange((p) => ({ ...p, startDate: v?.toISOString() }))}
        format={DATE_FORMAT}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            sx: {
              '& input': { fontSize: 13 },
            },
          },
        }}
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <DatePicker
        label="End date"
        value={value.endDate ? dayjs(value.endDate) : null}
        onChange={(v) => onChange((p) => ({ ...p, endDate: v?.toISOString() }))}
        format={DATE_FORMAT}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            sx: {
              '& input': { fontSize: 13 },
            },
          },
        }}
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
        <AppButton
          onClick={onCreate}
          disabled={!canCreate}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          Create
        </AppButton>
      </Stack>
    </Grid>
  </Grid>
);

export default FinancialYearForm;
