import { useSettings } from '../lib/settings.jsx'

const LANG_LABELS = { es: 'ES', en: 'EN', de: 'DE' }

export function LanguageSwitch() {
  const { lang, setLang } = useSettings()
  return (
    <div className="switch" role="group" aria-label="Idioma">
      {['es', 'en', 'de'].map((code) => (
        <button
          key={code}
          type="button"
          className={`switch__btn${lang === code ? ' switch__btn--active' : ''}`}
          onClick={() => setLang(code)}
        >
          {LANG_LABELS[code]}
        </button>
      ))}
    </div>
  )
}

export function CurrencySwitch() {
  const { currency, setCurrency } = useSettings()
  return (
    <div className="switch" role="group" aria-label="Moneda">
      <button
        type="button"
        className={`switch__btn${currency === 'COP' ? ' switch__btn--active' : ''}`}
        onClick={() => setCurrency('COP')}
      >
        $ COP
      </button>
      <button
        type="button"
        className={`switch__btn${currency === 'EUR' ? ' switch__btn--active' : ''}`}
        onClick={() => setCurrency('EUR')}
      >
        € EUR
      </button>
    </div>
  )
}
