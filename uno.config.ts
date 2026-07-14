import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetUno,
  presetWebFonts,
  transformerDirectives,
  transformerVariantGroup,
} from 'unocss';

export default defineConfig({
  shortcuts: {
    'btn-primary': 'px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all duration-200 active:scale-95 cursor-pointer',
    'btn-secondary': 'px-4 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-slate-100 rounded-lg font-medium border border-slate-700 dark:border-slate-600 transition-all duration-200 cursor-pointer',
    'glass': 'bg-white/10 dark:bg-slate-900/30 backdrop-blur-md border border-white/20 dark:border-slate-800/50',
    'card-premium': 'glass p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:border-indigo-500/30 transition-all duration-300',
    'input-premium': 'w-full px-4 py-2 bg-slate-900/50 dark:bg-slate-950/50 border border-slate-700/80 rounded-lg focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-slate-200',
  },
  theme: {
    colors: {
      primary: {
        50: '#f5f3ff',
        100: '#ede9fe',
        500: '#6366f1',
        600: '#4f46e5',
        700: '#4338ca',
      },
      darkBg: '#0b0f19',
    },
  },
  presets: [
    presetUno(),
    presetAttributify(),
    presetIcons({
      scale: 1.2,
      warn: true,
      extraProperties: {
        'display': 'inline-block',
        'vertical-align': 'middle',
      },
    }),
    presetWebFonts({
      provider: 'google',
      fonts: {
        sans: ['Outfit', 'Inter:400,500,600,700'],
      },
    }),
  ],
  transformers: [
    transformerDirectives(),
    transformerVariantGroup(),
  ],
});
