/**
 * Classes reutilizaveis para superficies coloridas (KPIs, alertas) com suporte a dark mode.
 */

export const kpiSurfaceThemes = {
  zinc: {
    borda: 'border-zinc-200 dark:border-zinc-700',
    fundo: 'bg-card',
    iconeFundo: 'bg-zinc-100 dark:bg-zinc-800',
    iconeFg: 'text-zinc-600 dark:text-zinc-300',
    valorFg: 'text-zinc-900 dark:text-zinc-100',
  },
  blue: {
    borda: 'border-blue-200 dark:border-blue-800',
    fundo: 'bg-blue-50/50 dark:bg-blue-950/40',
    iconeFundo: 'bg-blue-100 dark:bg-blue-900/60',
    iconeFg: 'text-blue-600 dark:text-blue-300',
    valorFg: 'text-blue-900 dark:text-blue-100',
  },
  amber: {
    borda: 'border-amber-200 dark:border-amber-800',
    fundo: 'bg-amber-50/50 dark:bg-amber-950/40',
    iconeFundo: 'bg-amber-100 dark:bg-amber-900/60',
    iconeFg: 'text-amber-700 dark:text-amber-300',
    valorFg: 'text-amber-900 dark:text-amber-100',
  },
  emerald: {
    borda: 'border-emerald-200 dark:border-emerald-800',
    fundo: 'bg-emerald-50/50 dark:bg-emerald-950/40',
    iconeFundo: 'bg-emerald-100 dark:bg-emerald-900/60',
    iconeFg: 'text-emerald-700 dark:text-emerald-300',
    valorFg: 'text-emerald-900 dark:text-emerald-100',
  },
  red: {
    borda: 'border-red-200 dark:border-red-800',
    fundo: 'bg-red-50/60 dark:bg-red-950/40',
    iconeFundo: 'bg-red-100 dark:bg-red-900/60',
    iconeFg: 'text-red-600 dark:text-red-300',
    valorFg: 'text-red-900 dark:text-red-100',
  },
} as const;

export const alertSurfaceThemes = {
  critico: {
    containerCls:
      'border-red-300 bg-red-50/70 hover:bg-red-50 dark:border-red-800 dark:bg-red-950/50 dark:hover:bg-red-950/70 focus-within:ring-red-400',
    iconCls: 'text-red-600 dark:text-red-400',
    pillCls: 'bg-red-100 text-red-700 dark:bg-red-900/60 dark:text-red-200',
  },
  atencao: {
    containerCls:
      'border-amber-300 bg-amber-50/70 hover:bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50 dark:hover:bg-amber-950/70 focus-within:ring-amber-400',
    iconCls: 'text-amber-600 dark:text-amber-400',
    pillCls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/60 dark:text-amber-200',
  },
  informativo: {
    containerCls:
      'border-zinc-200 bg-zinc-50/70 hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:bg-zinc-900/70 focus-within:ring-zinc-400',
    iconCls: 'text-zinc-600 dark:text-zinc-300',
    pillCls: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200',
  },
} as const;

export const financeIndicatorThemes = {
  blue: {
    borda: 'border-blue-200 dark:border-blue-800',
    fundo: 'bg-blue-50/50 dark:bg-blue-950/40',
    iconeFg: 'text-blue-600 dark:text-blue-300',
    valorFg: 'text-blue-900 dark:text-blue-100',
  },
  emerald: {
    borda: 'border-emerald-200 dark:border-emerald-800',
    fundo: 'bg-emerald-50/50 dark:bg-emerald-950/40',
    iconeFg: 'text-emerald-600 dark:text-emerald-300',
    valorFg: 'text-emerald-900 dark:text-emerald-100',
  },
  amber: {
    borda: 'border-amber-200 dark:border-amber-800',
    fundo: 'bg-amber-50/50 dark:bg-amber-950/40',
    iconeFg: 'text-amber-700 dark:text-amber-300',
    valorFg: 'text-amber-900 dark:text-amber-100',
  },
  zinc: {
    borda: 'border-zinc-200 dark:border-zinc-700',
    fundo: 'bg-card',
    iconeFg: 'text-zinc-600 dark:text-zinc-300',
    valorFg: 'text-zinc-900 dark:text-zinc-100',
  },
  red: {
    borda: 'border-red-200 dark:border-red-800',
    fundo: 'bg-red-50/60 dark:bg-red-950/40',
    iconeFg: 'text-red-600 dark:text-red-300',
    valorFg: 'text-red-900 dark:text-red-100',
  },
  violet: {
    borda: 'border-violet-200 dark:border-violet-800',
    fundo: 'bg-violet-50/50 dark:bg-violet-950/40',
    iconeFg: 'text-violet-600 dark:text-violet-300',
    valorFg: 'text-violet-900 dark:text-violet-100',
  },
} as const;

/** Tabelas HTML manuais (estoque, orcamentos legado, etc.) */
export const crudTableShellClass = 'crud-table-shell';
