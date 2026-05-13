// @ts-nocheck
// Admin: organization-level branding — file uploads, theme color, text fields.

import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Grid,
  Stack,
  TextField,
  Typography,
  Divider,
  alpha,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../common/AppButton';
import { AppCard, PageHeader } from '../../common';
import {
  selectOrgBrandingFetchStatus,
  selectOrgBrandingRemote,
  selectOrgBrandingUpdateStatus,
  updateOrgBranding,
  uploadOrgBrandingAsset,
} from '../../../app/state/slices/orgBrandingSlice';
import type { OrgBrandingUploadKind } from '../../../types/orgBranding';
import { DEFAULT_BRAND_PRIMARY } from '../../../types/them';
import { DEFAULT_ORG_BRANDING, mergeOrgBranding } from '../../../utils/orgBrandingDefaults';
import { getApiErrorMessage } from '../../../utils/helpers';

const ACCEPT_IMAGES = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml,image/x-icon,.ico';

function isValidHex6(s) {
  return /^#[0-9A-Fa-f]{6}$/.test(String(s || '').trim());
}

/** One row: label, optional preview, choose file → POST upload */
function BrandingFileRow({
  label,
  helperText,
  previewSrc,
  onPick,
  disabled,
  busy,
}) {
  const inputRef = useRef(null);
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.75 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
        {previewSrc ? (
          <Box
            sx={{
              maxWidth: 220,
              maxHeight: 72,
              borderRadius: 1,
              overflow: 'hidden',
              border: (t) => `1px solid ${alpha(t.palette.grey[900], 0.1)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: alpha('#000', 0.03),
            }}
          >
            <Box
              component="img"
              src={previewSrc}
              alt=""
              sx={{
                maxWidth: '100%',
                maxHeight: 72,
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
              }}
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </Box>
        ) : null}
        <Button
          variant="outlined"
          size="small"
          disabled={disabled || busy}
          onClick={() => inputRef.current?.click()}
        >
          {busy ? 'Uploading…' : 'Choose image'}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_IMAGES}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPick(f);
            e.target.value = '';
          }}
        />
      </Stack>
      {helperText ? (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.75 }}>
          {helperText}
        </Typography>
      ) : null}
    </Box>
  );
}

const OrganizationBranding = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const remote = useSelector(selectOrgBrandingRemote);
  const fetchStatus = useSelector(selectOrgBrandingFetchStatus);
  const updateStatus = useSelector(selectOrgBrandingUpdateStatus);
  const uploadStatus = useSelector((s) => s.orgBranding.uploadStatus);
  const uploadErr = useSelector((s) => s.orgBranding.uploadError);
  const fetchErr = useSelector((s) => s.orgBranding.fetchError);
  const updateErr = useSelector((s) => s.orgBranding.updateError);

  const [form, setForm] = useState(() => mergeOrgBranding(null));
  const [localError, setLocalError] = useState('');
  const [localSuccess, setLocalSuccess] = useState('');
  const [uploadingKind, setUploadingKind] = useState(null);

  useEffect(() => {
    setForm(mergeOrgBranding(remote));
  }, [remote]);

  const preview = mergeOrgBranding({ ...DEFAULT_ORG_BRANDING, ...form });
  const uploading = uploadStatus === 'loading';

  const runUpload = async (kind: OrgBrandingUploadKind, file: File) => {
    setLocalError('');
    setUploadingKind(kind);
    try {
      await dispatch(uploadOrgBrandingAsset({ file, kind })).unwrap();
    } catch (e) {
      setLocalError(getApiErrorMessage(e));
    } finally {
      setUploadingKind(null);
    }
  };

  const handleSave = async () => {
    setLocalError('');
    setLocalSuccess('');
    const tc = form.themePrimaryColor?.trim() || '';
    if (tc && !isValidHex6(tc)) {
      setLocalError('Theme color must be a full hex value like #0f9d78.');
      return;
    }
    try {
      const patch = {
        organizationName: form.organizationName?.trim() ?? '',
        moduleName: form.moduleName?.trim() || DEFAULT_ORG_BRANDING.moduleName,
        moduleSubtitle: form.moduleSubtitle?.trim() || DEFAULT_ORG_BRANDING.moduleSubtitle,
        logoUrl: form.logoUrl?.trim() ?? '',
        companyLogoUrl: form.companyLogoUrl?.trim() ?? '',
        loginLogoUrl: form.loginLogoUrl?.trim() ?? '',
        faviconUrl: form.faviconUrl?.trim() ?? '',
        bannerUrl: form.bannerUrl?.trim() ?? '',
        themePrimaryColor: tc && isValidHex6(tc) ? tc : DEFAULT_ORG_BRANDING.themePrimaryColor,
        supportUrl: form.supportUrl?.trim() ?? '',
        documentTitle: form.documentTitle?.trim() || DEFAULT_ORG_BRANDING.documentTitle,
      };
      await dispatch(updateOrgBranding(patch)).unwrap();
      setLocalSuccess('Branding saved.');
    } catch (e) {
      setLocalError(getApiErrorMessage(e));
    }
  };

  const saving = updateStatus === 'loading';
  const loading = fetchStatus === 'loading';

  return (
    <Box>
      <PageHeader
        title="Organization branding"
        subtitle="Upload images, set the brand color, and configure names and links. Files are sent to the server — you do not enter image URLs."
      />

      {fetchErr && fetchStatus === 'failed' && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Could not load saved branding from the server ({fetchErr}). Showing defaults until the API is available.
        </Alert>
      )}

      {uploadErr && uploadStatus === 'failed' && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {uploadErr}
        </Alert>
      )}

      {(localError || localSuccess) && (
        <Alert
          severity={localError ? 'error' : 'success'}
          sx={{ mb: 2 }}
          onClose={() => {
            setLocalError('');
            setLocalSuccess('');
          }}
        >
          {localError || localSuccess}
        </Alert>
      )}

      {updateErr && updateStatus === 'failed' && !localError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {updateErr}
        </Alert>
      )}

      <AppCard sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
          Preview
        </Typography>
        {preview.bannerUrl ? (
          <Box
            sx={{
              width: '100%',
              height: 88,
              mb: 2,
              borderRadius: 2,
              overflow: 'hidden',
              backgroundImage: `url(${preview.bannerUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              border: `1px solid ${alpha(theme.palette.grey[900], 0.08)}`,
            }}
          />
        ) : null}
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{
            p: 2,
            mb: 3,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.grey[900], 0.08)}`,
            bgcolor: alpha(preview.themePrimaryColor || DEFAULT_BRAND_PRIMARY, 0.06),
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              overflow: 'hidden',
              background: alpha(theme.palette.primary.main, 0.12),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Box
              component="img"
              src={preview.logoUrl}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={(e) => {
                e.currentTarget.src = DEFAULT_ORG_BRANDING.logoUrl;
              }}
            />
          </Box>
          {preview.companyLogoUrl ? (
            <Box
              sx={{
                maxHeight: 40,
                maxWidth: 140,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Box
                component="img"
                src={preview.companyLogoUrl}
                alt=""
                sx={{ maxHeight: 40, maxWidth: 140, width: 'auto', objectFit: 'contain' }}
              />
            </Box>
          ) : null}
          <Box>
            {preview.organizationName ? (
              <Typography variant="caption" color="text.secondary" display="block">
                {preview.organizationName}
              </Typography>
            ) : null}
            <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>
              {preview.moduleName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {preview.moduleSubtitle}
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Images (upload)
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <BrandingFileRow
              label="App / sidebar logo"
              helperText="Square mark shown in the navigation drawer."
              previewSrc={form.logoUrl}
              onPick={(f) => runUpload('logo', f)}
              disabled={loading}
              busy={uploading && uploadingKind === 'logo'}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <BrandingFileRow
              label="Company logo"
              helperText="Optional wider logo next to the app mark."
              previewSrc={form.companyLogoUrl}
              onPick={(f) => runUpload('companyLogo', f)}
              disabled={loading}
              busy={uploading && uploadingKind === 'companyLogo'}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <BrandingFileRow
              label="Login page logo"
              helperText="Optional. Falls back to the app logo if not set."
              previewSrc={form.loginLogoUrl}
              onPick={(f) => runUpload('loginLogo', f)}
              disabled={loading}
              busy={uploading && uploadingKind === 'loginLogo'}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <BrandingFileRow
              label="Banner"
              helperText="Wide image shown below the top bar on app pages."
              previewSrc={form.bannerUrl}
              onPick={(f) => runUpload('banner', f)}
              disabled={loading}
              busy={uploading && uploadingKind === 'banner'}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <BrandingFileRow
              label="Favicon"
              helperText="Small browser tab icon (.ico or PNG)."
              previewSrc={form.faviconUrl}
              onPick={(f) => runUpload('favicon', f)}
              disabled={loading}
              busy={uploading && uploadingKind === 'favicon'}
            />
          </Grid>
        </Grid>

        <Divider sx={{ my: 3 }} />

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Theme
        </Typography>
        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} md={6}>
            <Stack direction="row" spacing={1} alignItems="center">
              <TextField
                size="small"
                fullWidth
                label="Primary brand color"
                value={form.themePrimaryColor}
                onChange={(e) => setForm((p) => ({ ...p, themePrimaryColor: e.target.value }))}
                placeholder={DEFAULT_BRAND_PRIMARY}
                helperText="Hex format #rrggbb (buttons, links, accents)."
                inputProps={{ style: { fontSize: 13 } }}
              />
              <Box
                component="input"
                type="color"
                value={
                  isValidHex6(form.themePrimaryColor)
                    ? form.themePrimaryColor
                    : DEFAULT_BRAND_PRIMARY
                }
                onChange={(e) =>
                  setForm((p) => ({ ...p, themePrimaryColor: e.target.value }))
                }
                sx={{
                  width: 48,
                  height: 40,
                  p: 0,
                  border: 'none',
                  cursor: 'pointer',
                  bgcolor: 'transparent',
                  flexShrink: 0,
                }}
              />
            </Stack>
          </Grid>
        </Grid>

        <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
          Labels and links
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="Organization name"
              value={form.organizationName}
              onChange={(e) => setForm((p) => ({ ...p, organizationName: e.target.value }))}
              placeholder="Optional — shown near the product title"
              inputProps={{ style: { fontSize: 13 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="Browser tab title"
              value={form.documentTitle}
              onChange={(e) => setForm((p) => ({ ...p, documentTitle: e.target.value }))}
              inputProps={{ style: { fontSize: 13 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="Module name"
              value={form.moduleName}
              onChange={(e) => setForm((p) => ({ ...p, moduleName: e.target.value }))}
              inputProps={{ style: { fontSize: 13 } }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              size="small"
              fullWidth
              label="Module subtitle"
              value={form.moduleSubtitle}
              onChange={(e) => setForm((p) => ({ ...p, moduleSubtitle: e.target.value }))}
              inputProps={{ style: { fontSize: 13 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              size="small"
              fullWidth
              label="Performance review guide URL"
              value={form.supportUrl}
              onChange={(e) => setForm((p) => ({ ...p, supportUrl: e.target.value }))}
              placeholder="External help link from the sidebar"
              inputProps={{ style: { fontSize: 13 } }}
            />
          </Grid>
          <Grid item xs={12}>
            <AppButton onClick={handleSave} loading={saving} disabled={loading || uploading}>
              {saving ? 'Saving…' : 'Save branding'}
            </AppButton>
          </Grid>
        </Grid>
      </AppCard>
    </Box>
  );
};

export default OrganizationBranding;
