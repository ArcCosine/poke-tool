import type React from 'react';
import { Layout } from '../../components/common/Layout';
import { useApp } from '../../context/AppContext';
import {
  type LinkCategory,
  USEFUL_LINKS,
  type UsefulLinkItem,
} from '../../data/usefulLinks';

interface CategoryConfig {
  category: LinkCategory;
  titleKey: string;
  icon: string;
  iconBg: string;
  iconColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    category: 'official',
    titleKey: 'links.categories.official',
    icon: 'i-lucide-badge-check',
    iconBg: 'bg-blue-50 dark:bg-blue-950/60',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  {
    category: 'damageCalculator',
    titleKey: 'links.categories.damageCalculator',
    icon: 'i-lucide-calculator',
    iconBg: 'bg-rose-50 dark:bg-rose-950/60',
    iconColor: 'text-rose-600 dark:text-rose-400',
  },
  {
    category: 'strategy',
    titleKey: 'links.categories.strategy',
    icon: 'i-lucide-swords',
    iconBg: 'bg-purple-50 dark:bg-purple-950/60',
    iconColor: 'text-purple-600 dark:text-purple-400',
  },
  {
    category: 'metagame',
    titleKey: 'links.categories.metagame',
    icon: 'i-lucide-trophy',
    iconBg: 'bg-amber-50 dark:bg-amber-950/60',
    iconColor: 'text-amber-600 dark:text-amber-400',
  },
  {
    category: 'database',
    titleKey: 'links.categories.database',
    icon: 'i-lucide-book-open',
    iconBg: 'bg-emerald-50 dark:bg-emerald-950/60',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
  },
];

export const LinksPage: React.FC = () => {
  const { t } = useApp();

  return (
    <Layout activePage="links">
      <div className="space-y-8 max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="border-b border-slate-200 dark:border-slate-800 pb-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-3">
            <span className="i-lucide-compass text-sm" />
            Pokémon Resources
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight mb-3 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
            {t('links.title')}
          </h1>
          <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base leading-relaxed">
            {t('links.subtitle')}
          </p>
        </div>

        {/* Categories & Links List */}
        <div className="space-y-6">
          {CATEGORIES.map((cat) => {
            const links = USEFUL_LINKS.filter(
              (item: UsefulLinkItem) => item.category === cat.category
            );
            if (links.length === 0) return null;

            return (
              <section
                key={cat.category}
                className="bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 sm:p-7 shadow-sm transition-all"
              >
                {/* Category Header */}
                <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${cat.iconBg} ${cat.iconColor}`}
                  >
                    <span className={`${cat.icon} text-lg`} />
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                    {t(cat.titleKey)}
                  </h2>
                </div>

                {/* Links List */}
                <ul className="space-y-2.5 list-none p-0 m-0">
                  {links.map((link) => (
                    <li
                      key={link.id}
                      className="p-3 sm:p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-indigo-50/60 dark:hover:bg-slate-800/90 border border-slate-200/60 dark:border-slate-800/60 transition-colors duration-150 flex items-center justify-between gap-3"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex-1 min-w-0 flex flex-wrap items-center gap-2 no-underline text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors"
                      >
                        <span className="font-semibold group-hover:underline break-words">
                          {link.name}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-md font-normal bg-slate-200/70 dark:bg-slate-700/70 text-slate-700 dark:text-slate-300 shrink-0">
                          （{t(`links.languages.${link.langKey}`)}）
                        </span>
                        <span
                          className="i-lucide-external-link text-xs text-slate-400 group-hover:text-indigo-500 dark:text-slate-500 transition-colors shrink-0"
                          aria-hidden="true"
                        />
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </Layout>
  );
};
