import type React from 'react';
import { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { isValidArticleUrl } from '../../utils/security';
import { Button } from '../common/Button';
import { Checkbox } from '../common/Checkbox';
import { Dialog } from '../common/Dialog';
import { Input } from '../common/Input';

export interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onOpenLogin?: () => void;
  onLoginWithGoogle?: () => void;
  onLoginWithX?: () => void;
  isPublic: boolean;
  rentalCode: string;
  articleUrl: string;
  description: string;
  authorName?: string;
  onSave: (meta: {
    isPublic: boolean;
    rentalCode: string;
    articleUrl: string;
    description: string;
    authorName?: string;
  }) => void;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({
  isOpen,
  onClose,
  isLoggedIn,
  onOpenLogin,
  onLoginWithGoogle,
  onLoginWithX,
  isPublic: initialIsPublic,
  rentalCode: initialRentalCode,
  articleUrl: initialArticleUrl,
  description: initialDescription,
  authorName: initialAuthorName = '',
  onSave,
}) => {
  const { t } = useApp();

  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [rentalCode, setRentalCode] = useState(initialRentalCode);
  const [articleUrl, setArticleUrl] = useState(initialArticleUrl);
  const [description, setDescription] = useState(initialDescription);
  const [authorName, setAuthorName] = useState(initialAuthorName);
  const [urlError, setUrlError] = useState('');

  // Sync internal state when dialog opens or initial props change
  useEffect(() => {
    if (isOpen) {
      setIsPublic(initialIsPublic);
      setRentalCode(initialRentalCode);
      setArticleUrl(initialArticleUrl);
      setDescription(initialDescription);
      setAuthorName(initialAuthorName);
      setUrlError('');
    }
  }, [
    isOpen,
    initialIsPublic,
    initialRentalCode,
    initialArticleUrl,
    initialDescription,
    initialAuthorName,
  ]);

  const handleSave = () => {
    if (articleUrl && !isValidArticleUrl(articleUrl)) {
      setUrlError(t('partyShare.articleUrlInvalid'));
      return;
    }

    onSave({
      isPublic,
      rentalCode: rentalCode.trim(),
      articleUrl: articleUrl.trim(),
      description: description.trim(),
      authorName: authorName.trim(),
    });
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <span className="i-lucide-trophy text-amber-500 text-xl" />
          <span>{t('partyShare.isPublic')}</span>
        </div>
      }
    >
      {!isLoggedIn ? (
        <div className="py-3 flex flex-col gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('auth.loginPrompt')}
          </p>
          {onLoginWithGoogle || onLoginWithX ? (
            <div className="flex flex-col gap-2.5">
              {onLoginWithGoogle && (
                <button
                  type="button"
                  onClick={onLoginWithGoogle}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-sm transition cursor-pointer"
                >
                  <span className="i-lucide-chrome text-red-500 text-lg" />
                  <span>{t('auth.loginWithGoogle')}</span>
                </button>
              )}
              {onLoginWithX && (
                <button
                  type="button"
                  onClick={onLoginWithX}
                  className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 font-semibold text-xs sm:text-sm text-slate-800 dark:text-slate-100 shadow-sm transition cursor-pointer"
                >
                  <span className="i-lucide-twitter text-sky-500 text-lg" />
                  <span>{t('auth.loginWithX')}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="flex justify-end gap-2.5 pt-2">
              <Button variant="secondary" onClick={onClose}>
                {t('close')}
              </Button>
              <Button
                variant="primary"
                icon="i-lucide-log-in"
                onClick={() => {
                  onClose();
                  onOpenLogin?.();
                }}
              >
                {t('auth.login')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="py-2 flex flex-col gap-4">
          {/* Public Toggle Checkbox */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <div className="flex items-start gap-2">
              <Checkbox
                id="modal-party-is-public"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                label={t('partyShare.isPublic')}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 ml-6">
              {t('partyShare.isPublicHelp')}
            </p>
          </div>

          {/* Author Name Input (Trainer Name) */}
          <Input
            id="modal-party-author-name"
            label={t('partyShare.authorName')}
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder={t('partyShare.authorNamePlaceholder')}
            className="text-xs"
          />

          {/* Rental Team Code Input */}
          <Input
            id="modal-party-rental-code"
            label={t('partyShare.rentalCode')}
            value={rentalCode}
            onChange={(e) => setRentalCode(e.target.value)}
            placeholder={t('partyShare.rentalCodePlaceholder')}
            className="text-xs"
          />

          {/* Article URL Input */}
          <div>
            <Input
              id="modal-party-article-url"
              label={t('partyShare.articleUrl')}
              value={articleUrl}
              onChange={(e) => {
                setArticleUrl(e.target.value);
                if (urlError) setUrlError('');
              }}
              placeholder={t('partyShare.articleUrlPlaceholder')}
              className="text-xs"
            />
            {urlError && (
              <p className="text-xs text-red-500 mt-1">{urlError}</p>
            )}
          </div>

          {/* Description Input */}
          <Input
            id="modal-party-description"
            label={t('partyShare.description')}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('partyShare.descriptionPlaceholder')}
            className="text-xs"
          />

          {/* Modal Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" onClick={onClose}>
              {t('close')}
            </Button>
            <Button
              variant="primary"
              icon="i-lucide-check"
              onClick={handleSave}
            >
              {t('saveParty')}
            </Button>
          </div>
        </div>
      )}
    </Dialog>
  );
};
