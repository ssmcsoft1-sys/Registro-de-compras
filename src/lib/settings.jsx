// Contexto global de ajustes: idioma (es/en/de) y moneda (MXN/EUR).
// Expone helpers ya ligados al idioma/moneda actuales: t(), money(), formatDate(),
// meses traducidos y traductores de valores (categoría, método, estado, proyecto).

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  LANGS,
  MONTHS,
  MONTHS_LONG,
  EUR_LOCALE,
  COP_LOCALE,
  FALLBACK_COP_TO_EUR,
  makeT,
  translateCategory,
  translateMethod,
  translateStatus,
  translateProject,
  projectShort,
} from './i18n.js'

const SettingsContext = createContext(null)

const get = (key, fallback) => {
  try {
    return localStorage.getItem(key) || fallback
  } catch {
    return fallback
  }
}

export function SettingsProvider({ children }) {
  const [lang, setLang] = useState(() => {
    const saved = get('lang', 'es')
    return LANGS.includes(saved) ? saved : 'es'
  })
  const [currency, setCurrency] = useState(() => (get('currency', 'COP') === 'EUR' ? 'EUR' : 'COP'))
  const [rate, setRate] = useState(() => Number(get('copToEur', '')) || FALLBACK_COP_TO_EUR)

  useEffect(() => {
    try {
      localStorage.setItem('lang', lang)
    } catch {}
  }, [lang])
  useEffect(() => {
    try {
      localStorage.setItem('currency', currency)
    } catch {}
  }, [currency])

  // Tipo de cambio en vivo COP -> EUR (open.er-api.com, gratis y sin cuenta).
  // Nota: el BCE/Frankfurter no publica el peso colombiano, por eso esta fuente.
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/COP')
      .then((r) => r.json())
      .then((d) => {
        const r = d?.rates?.EUR
        if (r > 0) {
          setRate(r)
          try {
            localStorage.setItem('copToEur', String(r))
          } catch {}
        }
      })
      .catch(() => {}) // si falla, se mantiene el último valor / fallback
  }, [])

  const value = useMemo(() => {
    const t = makeT(lang)
    const eurFmt = new Intl.NumberFormat(EUR_LOCALE[lang], {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    })
    // El peso colombiano usa formato $1.234.567 (es-CO); el euro usa el locale del idioma.
    const money = (n) =>
      currency === 'EUR'
        ? eurFmt.format(Math.round(n * rate))
        : '$' + Math.round(n).toLocaleString(COP_LOCALE)

    const months = MONTHS[lang]
    const monthsLong = MONTHS_LONG[lang]
    const formatDate = (iso) => {
      const [y, m, d] = iso.split('-')
      return `${+d} ${months[+m - 1]} ${y}`
    }

    return {
      lang,
      setLang,
      currency,
      setCurrency,
      rate,
      t,
      money,
      months,
      monthsLong,
      formatDate,
      tCategory: (v) => translateCategory(v, lang),
      tMethod: (v) => translateMethod(v, lang),
      tStatus: (v) => translateStatus(v, lang),
      tProject: (v) => translateProject(v, lang),
      projShort: (v) => projectShort(v, lang),
    }
  }, [lang, currency, rate])

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings debe usarse dentro de <SettingsProvider>')
  return ctx
}
