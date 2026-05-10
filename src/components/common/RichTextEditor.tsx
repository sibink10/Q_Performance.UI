import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { Box, FormHelperText, IconButton, Tooltip } from '@mui/material';
import { useMemo } from 'react';
import Quill from 'quill';
import ImageResize from 'quill-image-resize-module-react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';

import { richTextHtmlToPlainText, sanitizeRichTextHtml } from '../../utils/richText';

/** Persist resize output: Image blot’s internal whitelist is closure-scoped in Quill 1.3.x, so subclass. */
type QuillImageFormat = {
  blotName: string;
  tagName: string;
  new (): {
    domNode: HTMLElement;
    format(name: string, value: string): void;
  };
  prototype: {
    domNode: HTMLElement;
    format(name: string, value: string): void;
  };
};

const IMAGE_DOM_ATTRS = ['alt', 'height', 'width', 'style'] as const;

if (typeof window !== 'undefined') {
  Quill.register('modules/imageResize', ImageResize);

  const ImageBase = Quill.import('formats/image') as QuillImageFormat;

  class RichTextImageEmbed extends ImageBase {
    static formats(domNode: HTMLElement) {
      const result: Record<string, string> = {};
      IMAGE_DOM_ATTRS.forEach((attr) => {
        if (domNode.hasAttribute(attr)) {
          result[attr] = domNode.getAttribute(attr) || '';
        }
      });
      return result;
    }

    format(name: string, value: string) {
      if ((IMAGE_DOM_ATTRS as readonly string[]).includes(name)) {
        if (value) {
          this.domNode.setAttribute(name, value);
        } else {
          this.domNode.removeAttribute(name);
        }
      } else {
        super.format(name, value);
      }
    }
  }

  Quill.register(RichTextImageEmbed as unknown as QuillImageFormat, true);
}

type Props = {
  value: string;
  onChange: (nextHtml: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  minHeight?: number | string;
};

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const IMAGE_ACCEPT = 'image/png,image/jpeg,image/jpg,image/gif,image/webp';

const toolbarOptions = [
  ['bold', 'italic', 'underline'],
  [{ list: 'ordered' }, { list: 'bullet' }],
  ['image'],
  ['clean'],
];

type QuillLike = {
  getSelection(focus?: boolean): { index: number; length: number } | null;
  getLength(): number;
  insertEmbed(index: number, type: string, value: string, source?: string): void;
  setSelection(index: number, length?: number, source?: string): void;
};

type ToolbarHandlerContext = { quill: QuillLike };

const formats = ['bold', 'italic', 'underline', 'list', 'bullet', 'image', 'width', 'height', 'style'];

export default function RichTextEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  error,
  helperText,
  minHeight = 92,
}: Props) {
  const plain = richTextHtmlToPlainText(value || '');
  const showError = Boolean(error);

  const modules = useMemo(
    () => ({
      imageResize: {
        parchment: Quill.import('parchment'),
        modules: ['Resize', 'DisplaySize', 'Toolbar'],
      },
      toolbar: {
        container: toolbarOptions,
        handlers: {
          image: function (this: ToolbarHandlerContext) {
            const { quill } = this;
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = IMAGE_ACCEPT;
            input.setAttribute('aria-label', 'Insert image');
            input.onchange = () => {
              const file = input.files?.[0];
              if (!file || !file.type.startsWith('image/')) return;
              if (file.size > MAX_IMAGE_BYTES) return;
              const reader = new FileReader();
              reader.onload = () => {
                const url = reader.result;
                if (typeof url !== 'string') return;
                let range = quill.getSelection(true);
                if (!range) {
                  range = { index: Math.max(0, quill.getLength() - 1), length: 0 };
                }
                quill.insertEmbed(range.index, 'image', url, 'user');
                quill.setSelection(range.index + 1);
              };
              reader.readAsDataURL(file);
            };
            input.click();
          },
        },
      },
    }),
    [],
  );

  return (
    <Box sx={{ width: '100%' }}>
      <Box
        sx={{
          position: 'relative',
          border: '1px solid',
          borderColor: showError ? 'error.main' : 'divider',
          borderRadius: 1,
          // Do not clip: image-resize handles sit slightly outside the image bounds.
          overflow: 'visible',
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
          '& .ql-editor img': {
            maxWidth: '100%',
            height: 'auto',
            verticalAlign: 'middle',
          },
        }}
      >
        <Tooltip
          title="To resize an image, click it, or double-tap it on a touch screen. Drag the corner handles to change the size."
          enterTouchDelay={0}
          arrow
          placement="left"
        >
          <IconButton
            type="button"
            size="small"
            aria-label="How to resize images in the editor"
            sx={{
              position: 'absolute',
              top: 4,
              right: 4,
              zIndex: 2,
              color: 'text.secondary',
              bgcolor: 'action.hover',
              '&:hover': { bgcolor: 'action.selected' },
            }}
          >
            <InfoOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <ReactQuill
          theme="snow"
          value={value || ''}
          onChange={(nextHtml) => {
            // Save sanitized HTML so rendering is deterministic and safe.
            onChange(sanitizeRichTextHtml(nextHtml));
          }}
          onBlur={onBlur}
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

