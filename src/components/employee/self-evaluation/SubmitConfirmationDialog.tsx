import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import AppButton from '../../common/AppButton';

/**
 * Confirmation dialog before submitting self / manager / HR evaluation.
 * Long criterion comments scroll inside the dialog and within each comment block.
 */

const commentScrollSx = {
  mt: 0.75,
  maxHeight: { xs: 160, sm: 200 },
  overflowY: 'auto',
  overflowX: 'hidden',
  pr: 0.25,
};

const SubmitConfirmationDialog = ({
  open,
  onClose,
  onConfirm,
  isSaving,
  isHrMode,
  isManagerMode,
  preview,
  hrOverallRatingCaption,
  hrCommentsPlain,
}) => {
  const hasSummaryRows = Boolean(preview?.rows?.length);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={hasSummaryRows ? 'md' : 'xs'}
      fullWidth
      scroll="paper"
    >
      <DialogTitle>Confirm Submission</DialogTitle>
      <DialogContent
        dividers={Boolean(hasSummaryRows || isHrMode)}
        sx={{
          maxHeight: { xs: '75vh', sm: '72vh' },
          overflowY: 'auto',
          overflowX: 'hidden',
        }}
      >
        <Typography variant="body2" sx={{ mb: isHrMode || hasSummaryRows ? 2 : 0 }}>
          {isHrMode ? (
            <>
              Submit the <strong>HR Review</strong> for this assignment? This action cannot be undone.
            </>
          ) : isManagerMode ? (
            <>
              Are you sure you want to submit your <strong>Manager Evaluation</strong>? This action cannot be undone.
            </>
          ) : (
            <>
              Are you sure you want to submit your <strong>Self Evaluation</strong>? Once submitted, you will not be
              able to make changes.
            </>
          )}
        </Typography>

        {isHrMode && (
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            <Divider />
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                HR overall rating
              </Typography>
              <Typography variant="body1" fontWeight={700}>
                {hrOverallRatingCaption}
              </Typography>
            </Box>
            {String(hrCommentsPlain || '').trim() !== '' && (
              <Box>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                  HR comments
                </Typography>
                <Box sx={{ ...commentScrollSx, mt: 0, maxHeight: { xs: 200, sm: 240 } }}>
                  <Typography variant="body2" component="div" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {hrCommentsPlain}
                  </Typography>
                </Box>
              </Box>
            )}
          </Stack>
        )}

        {hasSummaryRows && (
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Divider />
            <Typography variant="subtitle2" fontWeight={700}>
              {isManagerMode ? 'Manager review summary' : 'Self review summary'}
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                maxWidth: '100%',
                maxHeight: { xs: 'min(42vh, 360px)', sm: 'min(45vh, 420px)' },
                overflow: 'auto',
              }}
            >
              <Table size="small" sx={{ minWidth: 520 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Criterion</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Rating
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Weightage
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                      Weighted score
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {preview.rows.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell sx={{ verticalAlign: 'top' }}>
                        {row.sectionTitle ? (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {row.sectionTitle}
                          </Typography>
                        ) : null}
                        <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                          {row.questionText}
                        </Typography>
                        {row.commentPlain ? (
                          <Box sx={commentScrollSx}>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              component="div"
                              sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
                            >
                              {row.commentPlain}
                            </Typography>
                          </Box>
                        ) : null}
                      </TableCell>
                      <TableCell align="right" sx={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        {Number.isInteger(row.rating) ? row.rating : row.rating.toFixed(1)}
                      </TableCell>
                      <TableCell align="right" sx={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        {Number.isInteger(row.weight) ? row.weight : row.weight.toFixed(1)}
                      </TableCell>
                      <TableCell align="right" sx={{ verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                        {Number.isInteger(row.weighted) ? row.weighted : row.weighted.toFixed(1)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            <Box
              sx={{
                p: 1.5,
                borderRadius: 1,
                bgcolor: 'action.hover',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                Overall rating (weighted average)
              </Typography>
              <Typography variant="body1" fontWeight={800}>
                {preview.overall != null ? `${preview.overall.toFixed(2)} / ${preview.scale}` : '—'}
              </Typography>
              {preview.totalWeight > 0 && (
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                  Total weightage:{' '}
                  {Number.isInteger(preview.totalWeight)
                    ? preview.totalWeight
                    : preview.totalWeight.toFixed(2)}
                  {' · '}
                  Sum (rating × weightage):{' '}
                  {Number.isInteger(preview.totalWeightedScore)
                    ? preview.totalWeightedScore
                    : preview.totalWeightedScore.toFixed(2)}
                </Typography>
              )}
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <AppButton variant="outlined" startIcon={null} onClick={onClose}>
          Cancel
        </AppButton>
        <AppButton startIcon={null} onClick={onConfirm} loading={isSaving}>
          Yes, Submit
        </AppButton>
      </DialogActions>
    </Dialog>
  );
};

export default SubmitConfirmationDialog;
