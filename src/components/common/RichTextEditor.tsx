import { Box, FormHelperText } from '@mui/material';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

import { richTextHtmlToPlainText, sanitizeRichTextHtml } from '../../utils/richText';

type Props = {
  value: string;
  onChange: (nextHtml: string) => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  minHeight?: number | string;
};

const toolbarOptions = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['clean'],
];

const modules = { toolbar: toolbarOptions };
const formats = ['bold', 'italic', 'underline', 'list', 'bullet'];

export default function RichTextEditor({
  value,
  onChange,
  placeholder,
  error,
  helperText,
  minHeight = 92,
}: Props) {
  const plain = richTextHtmlToPlainText(value || '');
  const showError = Boolean(error);

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          border: '1px solid',
          borderColor: showError ? 'error.main' : 'divider',
          borderRadius: 1,
          overflow: 'hidden',
          bgcolor: '#fff',
          '& .ql-toolbar.ql-snow': {
            border: 'none',
            borderBottom: '1px solid',
            borderColor: showError ? 'error.main' : 'divider',
          },
          '& .ql-container.ql-snow': {
            border: 'none',
          },
          '& .ql-editor': {
            minHeight,
            fontFamily: 'inherit',
            fontSize: 14,
            lineHeight: 1.5,
          },
        }}
      >
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={(nextHtml) => {
            // Save sanitized HTML so rendering is deterministic and safe.
            onChange(sanitizeRichTextHtml(nextHtml));
          }}
          placeholder={placeholder}
          modules={modules}
          formats={formats}
        />
      </Box>
      {helperText ? (
        <FormHelperText error={showError} sx={{ mx: 0 }}>
          {helperText}
        </FormHelperText>
      ) : null}
      {/* Keep layout stable when helper text is not shown */}
      {!helperText && showError ? (
        <FormHelperText error sx={{ mx: 0 }}>
          {' '}
        </FormHelperText>
      ) : null}
      {/* `plain` computed so parent validation can rely on `value`; not rendered */}
      <Box sx={{ display: 'none' }}>{plain}</Box>
    </Box>
  );
}

