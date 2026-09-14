import type React from 'react';
import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Button } from './Button';
import { Dialog } from './Dialog';

export interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  shareUrl: string;
  shareText: string;
}

export const ShareDialog: React.FC<ShareDialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  shareUrl,
  shareText,
}) => {
  const { t } = useApp();
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  const xIntentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    shareText
  )}&url=${encodeURIComponent(shareUrl)}`;

  const blueskyIntentUrl = `https://bsky.app/intent/compose?text=${encodeURIComponent(
    `${shareText} ${shareUrl}`
  )}`;

  const lineIntentUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(shareText)}`;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
          <span className="i-lucide-share-2 text-xl" />
          {title || t('share.shareTitle')}
        </div>
      }
      actions={
        <Button variant="secondary" onClick={onClose}>
          {t('pokemonSearchModal.close')}
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {description || t('share.shareDesc')}
        </p>

        {/* Share URL & Copy */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={shareUrl}
            className="w-full text-xs font-mono py-2 px-3 bg-slate-100 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 select-all focus:outline-none"
          />
          <Button
            onClick={handleCopy}
            variant="primary"
            className="shrink-0 text-xs py-2"
            icon={isCopied ? 'i-lucide-check' : 'i-lucide-copy'}
          >
            {isCopied ? t('share.copied') : t('share.copyUrl')}
          </Button>
        </div>

        {/* Social Share Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* X (Twitter) */}
            <a
              href={xIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-black dark:bg-slate-800 dark:hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-2 no-underline transition duration-150 shadow-xs"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>{t('share.shareToX')}</span>
            </a>

            {/* Bluesky */}
            <a
              href={blueskyIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#0285FF] hover:bg-[#0070d6] text-white font-bold text-xs flex items-center justify-center gap-2 no-underline transition duration-150 shadow-xs"
            >
              <svg
                viewBox="0 0 568 501"
                className="w-3.5 h-3.5 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M123.121 33.664C188.241 82.553 258.281 181.68 284 234.873c25.719-53.192 95.759-152.32 160.879-201.21C491.866-1.611 568-28.906 568 57.947c0 17.346-9.945 145.713-15.778 166.555-20.275 72.453-94.155 90.933-159.875 79.748C507.222 323.8 536.444 388.56 473.333 453.32c-119.25 122.392-172.272-30.859-185.702-70.281-2.462-7.227-3.614-10.608-3.631-7.733-.017-2.875-1.169.506-3.631 7.733-13.43 39.422-66.452 192.673-185.702 70.281-63.111-64.76-33.889-129.52 80.986-149.07-65.72 11.185-139.6-7.295-159.875-79.748C9.945 203.66 0 75.293 0 57.947 0-28.906 76.135-1.612 123.121 33.664Z" />
              </svg>
              <span>{t('share.shareToBluesky')}</span>
            </a>

            {/* LINE */}
            <a
              href={lineIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white font-bold text-xs flex items-center justify-center gap-2 no-underline transition duration-150 shadow-xs"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M19.365 9.864c0-4.72-4.32-8.56-9.63-8.56-5.31 0-9.63 3.84-9.63 8.56 0 4.23 3.42 7.77 8.07 8.42.31.07.74.21.85.48.1.25.06.63.03.88l-.13.82c-.04.25-.19.98.86.53 1.05-.44 5.67-3.34 7.74-5.72 1.25-1.42 1.81-2.88 1.81-4.41zM6.92 11.69H5.54a.43.43 0 01-.43-.43V8.52a.43.43 0 01.43-.43h1.38c.24 0 .43.19.43.43v.38c0 .24-.19.43-.43.43H6.35v.42h.57c.24 0 .43.19.43.43v.38c0 .24-.19.43-.43.43H6.35v.72h.57c.24 0 .43.19.43.43v.38c0 .24-.19.43-.43.43zm2.59 0h-.44a.43.43 0 01-.43-.43V8.52a.43.43 0 01.43-.43h.44c.24 0 .43.19.43.43v2.74a.43.43 0 01-.43.43zm3.76 0h-.44a.43.43 0 01-.43-.43V9.77l-1.39 1.83a.43.43 0 01-.35.16h-.06a.43.43 0 01-.43-.43V8.52a.43.43 0 01.43-.43h.44c.24 0 .43.19.43.43v1.49l1.39-1.83a.43.43 0 01.35-.16h.06c.24 0 .43.19.43.43v2.74a.43.43 0 01-.43.43zm3.76 0h-1.82a.43.43 0 01-.43-.43V8.52a.43.43 0 01.43-.43h1.82c.24 0 .43.19.43.43v.38c0 .24-.19.43-.43.43h-1.39v.42h.57c.24 0 .43.19.43.43v.38c0 .24-.19.43-.43.43h-.57v.72h1.39c.24 0 .43.19.43.43v.38c0 .24-.19.43-.43.43z" />
              </svg>
              <span>{t('share.shareToLine')}</span>
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
