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

  const whatsAppIntentUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(
    `${shareText} ${shareUrl}`
  )}`;

  const weiboIntentUrl = `https://service.weibo.com/share/share.php?url=${encodeURIComponent(
    shareUrl
  )}&title=${encodeURIComponent(shareText)}`;

  const kakaoIntentUrl = `https://story.kakao.com/s/share?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(shareText)}`;

  const canWebShare =
    typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleWebShare = async () => {
    if (!canWebShare) return;
    try {
      await navigator.share({
        title: title || t('share.shareTitle'),
        text: shareText,
        url: shareUrl,
      });
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing via Web Share API:', error);
      }
    }
  };

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

        {/* Web Share API Button (if supported) */}
        {canWebShare && (
          <button
            type="button"
            onClick={handleWebShare}
            className="w-full py-2.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center gap-2 transition duration-150 shadow-xs cursor-pointer"
          >
            <span className="i-lucide-share text-sm" />
            <span>{t('share.shareViaDevice')}</span>
          </button>
        )}

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

            {/* WhatsApp */}
            <a
              href={whatsAppIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold text-xs flex items-center justify-center gap-2 no-underline transition duration-150 shadow-xs"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0012.04 2zm.01 1.67c4.56 0 8.25 3.69 8.25 8.24 0 2.2-.86 4.28-2.42 5.83a8.217 8.217 0 01-5.83 2.42c-1.46 0-2.89-.39-4.14-1.13l-.3-.18-3.08.81.82-3-.19-.3a8.188 8.188 0 01-1.26-4.45c0-4.55 3.69-8.24 8.25-8.24zm4.52 11.66c-.25-.13-1.47-.72-1.7-.81-.23-.08-.39-.13-.56.13-.17.25-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.13-1.06-.39-2.02-1.25-.75-.67-1.26-1.5-1.41-1.75-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.44.13-.15.17-.25.25-.42.08-.17.04-.31-.02-.44-.06-.13-.56-1.35-.77-1.85-.2-.49-.41-.42-.56-.43h-.48c-.17 0-.44.06-.67.31-.23.25-.88.86-.88 2.1 0 1.24.9 2.44 1.03 2.61.13.17 1.78 2.72 4.31 3.81.6.26 1.07.42 1.44.53.61.19 1.16.17 1.6.1.49-.07 1.47-.6 1.68-1.18.21-.58.21-1.07.15-1.18-.07-.11-.23-.17-.48-.29z" />
              </svg>
              <span>{t('share.shareToWhatsApp')}</span>
            </a>

            {/* Weibo */}
            <a
              href={weiboIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#E6162D] hover:bg-[#cf1326] text-white font-bold text-xs flex items-center justify-center gap-2 no-underline transition duration-150 shadow-xs"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M10.09 17.58c-3.79.43-7.05-1.55-7.29-4.43-.24-2.87 2.63-5.55 6.43-5.98 3.79-.43 7.05 1.55 7.29 4.43.24 2.87-2.64 5.55-6.43 5.98zm-1.04-6.47c-.24-.04-.49.07-.58.29-.09.21.01.45.24.54.49.21.75.76.62 1.28-.13.52-.63.89-1.17.87-.24 0-.44.17-.44.4 0 .23.19.42.43.43.83.03 1.61-.53 1.81-1.34.2-.81-.2-1.68-.91-2.07zm1.88-2.61c-.34-.04-.68.13-.8.46-.13.33.02.7.35.84 1.34.58 2.05 2.11 1.7 3.55-.35 1.44-1.74 2.44-3.23 2.33-.35-.03-.66.23-.68.58-.03.35.23.66.58.68 1.94.15 3.75-1.15 4.21-3.03.46-1.88-.47-3.87-2.13-4.41zm9.32 1.09c-.43-.37-1.12-.41-1.6-.08-.47.33-.61.94-.36 1.47.45.96.64 2.04.53 3.14-.37 3.66-3.82 6.36-7.7 6.03-3.88-.33-6.72-3.57-6.35-7.23.36-3.66 3.82-6.36 7.7-6.03.49.04.97.13 1.43.27.48.15 1-.12 1.15-.6.15-.48-.12-1-.6-1.15-.59-.18-1.21-.3-1.84-.35-4.73-.41-8.96 2.88-9.4 7.35-.44 4.47 3.03 8.42 7.76 8.83 4.73.41 8.96-2.88 9.4-7.35.13-1.35-.11-2.68-.67-3.86-.2-.42-.5-.42-.26-.42z" />
              </svg>
              <span>{t('share.shareToWeibo')}</span>
            </a>

            {/* KakaoTalk */}
            <a
              href={kakaoIntentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-2.5 px-3 rounded-xl bg-[#FEE500] hover:bg-[#ebd400] text-[#191919] font-bold text-xs flex items-center justify-center gap-2 no-underline transition duration-150 shadow-xs"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-3.5 h-3.5 fill-current shrink-0"
                aria-hidden="true"
              >
                <path d="M12 3c-5.52 0-10 3.58-10 8 0 2.84 1.83 5.34 4.61 6.74-.2.75-.74 2.7-1.08 3.97-.13.48.18.52.37.35.32-.29 3.59-2.45 4.2-2.88.61.08 1.25.12 1.9.12 5.52 0 10-3.58 10-8s-4.48-8-10-8zm-5.07 9.87h-.95V7.9h.95v4.97zm2.7 0H8.7V7.9h.93v2.09l1.45-2.09h1.15l-1.58 2.21 1.7 2.76h-1.15l-1.27-2.12-.3.42v1.7zm4.33 0h-.95V7.9h.95v4.97zm2.7 0h-.93V7.9h.93v2.09l1.45-2.09h1.15l-1.58 2.21 1.7 2.76h-1.15l-1.27-2.12-.3.42v1.7z" />
              </svg>
              <span>{t('share.shareToKakao')}</span>
            </a>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
