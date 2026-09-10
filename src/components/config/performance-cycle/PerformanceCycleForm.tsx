import { Grid, Stack, TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { type Dayjs } from 'dayjs';
import AppButton from '../../common/AppButton';

const DATE_FORMAT = 'DD/MM/YYYY';

export type PerformanceCycleFormValue = {
  name: string;
  startDate: string | null;
  endDate: string | null;
};

type PerformanceCycleFormProps = {
  value: PerformanceCycleFormValue;
  onChange: (updater: (prev: PerformanceCycleFormValue) => PerformanceCycleFormValue) => void;
  onCreate: () => void;
  canCreate: boolean;
  isSubmitting?: boolean;
};

const PerformanceCycleForm = ({
  value,
  onChange,
  onCreate,
  canCreate,
  isSubmitting = false,
}: PerformanceCycleFormProps) => (
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
        onChange={(v: Dayjs | null) =>
          onChange((p) => ({ ...p, startDate: v ? v.format('YYYY-MM-DD') : null }))
        }
        format={DATE_FORMAT}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            sx: { '& input': { fontSize: 13 } },
          },
        }}
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <DatePicker
        label="End date"
        value={value.endDate ? dayjs(value.endDate) : null}
        onChange={(v: Dayjs | null) =>
          onChange((p) => ({ ...p, endDate: v ? v.format('YYYY-MM-DD') : null }))
        }
        format={DATE_FORMAT}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: true,
            sx: { '& input': { fontSize: 13 } },
          },
        }}
      />
    </Grid>
    <Grid item xs={12} md={3}>
      <Stack direction="row" spacing={1} sx={{ width: { xs: '100%', md: 'auto' } }}>
        <AppButton
          onClick={onCreate}
          disabled={!canCreate || isSubmitting}
          loading={isSubmitting}
          sx={{ width: { xs: '100%', md: 'auto' } }}
        >
          Create Cycle
        </AppButton>
      </Stack>
    </Grid>
  </Grid>
);

export default PerformanceCycleForm;
