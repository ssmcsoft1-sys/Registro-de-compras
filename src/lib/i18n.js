// Internacionalización: español (principal), inglés y alemán.
// Los datos se guardan SIEMPRE en español (valores canónicos); aquí se traduce
// solo lo que se MUESTRA, incluyendo categorías, métodos, proyectos y estados.

export const LANGS = ['es', 'en', 'de']
export const FALLBACK_COP_TO_EUR = 0.00023 // ~1 EUR ≈ 4300 COP, si falla la consulta en vivo

// Locale para formatear moneda según idioma.
export const EUR_LOCALE = { es: 'es-ES', en: 'en-IE', de: 'de-DE' }
export const COP_LOCALE = 'es-CO' // peso colombiano: formato $1.234.567

export const MONTHS = {
  es: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
}
export const MONTHS_LONG = {
  es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
  en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
}

// ── Traducción de valores de datos (canónico en español -> idioma) ──
const CATEGORY = {
  'Componentes mecánicos': { en: 'Mechanical components', de: 'Mechanische Komponenten' },
  'Componentes eléctricos': { en: 'Electrical components', de: 'Elektrische Komponenten' },
  Filamento: { en: 'Filament', de: 'Filament' },
  Servicios: { en: 'Services', de: 'Dienstleistungen' },
  'Material de oficina': { en: 'Office supplies', de: 'Bürobedarf' },
}
const METHOD = {
  'Tarjeta corporativa': { en: 'Corporate card', de: 'Firmenkarte' },
  Transferencia: { en: 'Transfer', de: 'Überweisung' },
  Efectivo: { en: 'Cash', de: 'Bargeld' },
}
const STATUS = {
  Recibido: { en: 'Received', de: 'Empfangen' },
  'En envío': { en: 'In transit', de: 'Unterwegs' },
}
const REQ_STATUS = {
  Pendiente: { en: 'Pending', de: 'Ausstehend' },
  Comprada: { en: 'Purchased', de: 'Gekauft' },
  Rechazada: { en: 'Rejected', de: 'Abgelehnt' },
}
export function translateReqStatus(value, lang) {
  if (lang === 'es') return value
  return REQ_STATUS[value]?.[lang] ?? value
}

const PROJECT_WORD = { es: 'Proyecto', en: 'Project', de: 'Projekt' }
const ALL_PROJECTS = { es: 'Todos los proyectos', en: 'All projects', de: 'Alle Projekte' }
const ALL_SHORT = { es: 'Todos', en: 'All', de: 'Alle' }

export function translateCategory(value, lang) {
  if (lang === 'es') return value
  return CATEGORY[value]?.[lang] ?? value
}
export function translateMethod(value, lang) {
  if (lang === 'es') return value
  return METHOD[value]?.[lang] ?? value
}
export function translateStatus(value, lang) {
  if (lang === 'es') return value
  return STATUS[value]?.[lang] ?? value
}
export function translateProject(value, lang) {
  if (value === 'Todos los proyectos') return ALL_PROJECTS[lang]
  if (lang === 'es') return value
  return value.replace('Proyecto', PROJECT_WORD[lang])
}
export function projectShort(value, lang) {
  if (value === 'Todos los proyectos') return ALL_SHORT[lang]
  return value.replace('Proyecto ', 'P')
}

// ── Mensajes de interfaz ──
export const MESSAGES = {
  es: {
    'nav.resumen': 'Resumen',
    'nav.registrar': 'Registrar compra',
    'nav.historial': 'Historial',
    'nav.compras': 'COMPRAS',
    'nav.logout': 'Cerrar sesión',

    'header.title.resumen': 'Resumen de compras robótica',
    'header.subtitle.resumen': 'Gastos por proyecto, categoría y mes',
    'header.title.registrar': 'Registrar compra',
    'header.subtitle.registrar': 'Añade una nueva compra al registro',
    'header.title.historial': 'Historial de compras',
    'header.subtitle.historial': 'Todas las compras registradas',
    'header.registerBtn': 'Registrar compra',

    'login.title': 'Registro de compras',
    'login.subtitle': 'Introduce la contraseña del equipo para entrar.',
    'login.password': 'Contraseña',
    'login.enter': 'Entrar',
    'login.entering': 'Entrando…',
    'login.error': 'Contraseña incorrecta',

    'resumen.allPeriod': 'Todo el periodo',
    'resumen.totalSpent': 'TOTAL GASTADO',
    'resumen.received': 'Recibidas',
    'resumen.inTransit': 'En envío',
    'resumen.average': 'Promedio',
    'resumen.byProject': 'Gastos por proyecto',
    'resumen.byCategory': 'Gastos por categoría',
    'resumen.byMonth': 'Gasto por mes',
    'resumen.chipAll': 'Todos',
    'resumen.captionAll': 'Mostrando el total de todos los proyectos',
    'resumen.captionProject': 'Gasto mensual de {project}',
    'resumen.noBars': 'Sin gastos en este periodo.',

    'common.purchases': 'compras',

    'form.importe': 'Importe',
    'form.fecha': 'Fecha',
    'form.proyecto': 'Proyecto',
    'form.categoria': 'Categoría',
    'form.proveedor': 'Proveedor',
    'form.metodo': 'Método de pago',
    'form.pagadoPor': 'Pagado por',
    'form.descripcion': 'Descripción',
    'form.estado': 'Estado',
    'form.recibo': 'Comprobante o factura',
    'form.selecciona': 'Selecciona…',
    'form.ph.proveedor': 'Comercio o proveedor',
    'form.ph.descripcion': 'Qué se compró y para qué',
    'form.ph.pagadoPor': 'Quién hizo el pago',
    'form.upload': 'Subir comprobante o factura (foto o PDF)',
    'form.reciboError': 'El archivo supera 2 MB. Usa una foto más ligera o un PDF más pequeño.',
    'form.cancel': 'Cancelar',
    'form.save': 'Guardar compra',
    'form.saveChanges': 'Guardar cambios',
    'err.importe': 'Indica un importe válido',
    'err.proyecto': 'Selecciona un proyecto',
    'err.categoria': 'Selecciona una categoría',
    'err.proveedor': 'Indica el proveedor',
    'err.descripcion': 'Añade una descripción',

    'hist.search': 'Buscar descripción o proveedor',
    'hist.allMonths': 'Todos los meses',
    'hist.allProjects': 'Todos los proyectos',
    'hist.allCategories': 'Todas las categorías',
    'hist.clear': 'Limpiar filtros',
    'hist.col.fecha': 'FECHA',
    'hist.col.proyecto': 'PROYECTO',
    'hist.col.categoria': 'CATEGORÍA',
    'hist.col.metodo': 'MÉTODO',
    'hist.col.descripcion': 'DESCRIPCIÓN',
    'hist.col.importe': 'IMPORTE',
    'hist.col.estado': 'ESTADO',
    'hist.empty.title': 'Sin resultados',
    'hist.empty.sub': 'Prueba a cambiar los filtros',
    'hist.edit': 'Editar compra',
    'hist.delete': 'Eliminar compra',
    'hist.viewReceipt': 'Ver comprobante',
    'hist.receipt': 'Comprobante',
    'hist.download': 'Descargar',
    'hist.paidBy': 'Pagó',
    'hist.close': 'Cerrar',
    'hist.statusToReceived': 'Marcar como Recibido',
    'hist.statusToTransit': 'Marcar como En envío',
    'hist.deleteConfirm': '¿Eliminar esta compra?\n\n{desc}\n{date} · {amount}\n\nEsta acción no se puede deshacer.',

    'toast.created': 'Compra registrada correctamente',
    'toast.updated': 'Compra actualizada',
    'toast.deleted': 'Compra eliminada',
    'toast.saveError': 'No se pudo guardar. Revisa la conexión.',
    'toast.updateError': 'No se pudo actualizar. Revisa la conexión.',
    'toast.deleteError': 'No se pudo eliminar. Revisa la conexión.',

    'app.booting': 'Cargando…',
    'app.loading': 'Cargando compras…',
    'app.connError': 'No se pudo conectar con el servidor.',
    'app.retry': 'Reintentar',

    'nav.solicitudes': 'Solicitudes',
    'header.title.solicitudes': 'Solicitudes de compra',
    'header.subtitle.solicitudes': 'Pide una compra y sigue su estado',
    'sol.new': 'Nueva solicitud',
    'sol.solicitante': 'Solicitante',
    'sol.ph.solicitante': 'Tu nombre',
    'sol.importeEstimado': 'Importe estimado (opcional)',
    'sol.nota': 'Nota / justificación (opcional)',
    'sol.ph.nota': 'Para qué se necesita',
    'sol.create': 'Crear solicitud',
    'sol.list': 'Solicitudes',
    'sol.empty.title': 'Sin solicitudes',
    'sol.empty.sub': 'Crea la primera solicitud',
    'sol.reject': 'Rechazar',
    'sol.buy': 'Registrar compra',
    'sol.delete': 'Eliminar solicitud',
    'sol.by': 'por {name}',
    'sol.estimated': 'Estimado: {amount}',
    'sol.managerNote': 'Nota del responsable: {nota}',
    'sol.rejectPrompt': 'Motivo del rechazo (opcional):',
    'sol.deleteConfirm': '¿Eliminar esta solicitud?',
    'sol.buyTitle': 'Registrar compra de la solicitud',
    'toast.reqCreated': 'Solicitud creada',
    'toast.reqRejected': 'Solicitud rechazada',
    'toast.reqDeleted': 'Solicitud eliminada',
    'toast.bought': 'Compra registrada',
    'toast.reqError': 'No se pudo completar. Revisa la conexión.',
  },
  en: {
    'nav.resumen': 'Summary',
    'nav.registrar': 'New purchase',
    'nav.historial': 'History',
    'nav.compras': 'PURCHASES',
    'nav.logout': 'Log out',

    'header.title.resumen': 'Robotics purchase summary',
    'header.subtitle.resumen': 'Spending by project, category and month',
    'header.title.registrar': 'New purchase',
    'header.subtitle.registrar': 'Add a new purchase to the log',
    'header.title.historial': 'Purchase history',
    'header.subtitle.historial': 'All recorded purchases',
    'header.registerBtn': 'New purchase',

    'login.title': 'Purchase log',
    'login.subtitle': 'Enter the team password to continue.',
    'login.password': 'Password',
    'login.enter': 'Sign in',
    'login.entering': 'Signing in…',
    'login.error': 'Incorrect password',

    'resumen.allPeriod': 'Entire period',
    'resumen.totalSpent': 'TOTAL SPENT',
    'resumen.received': 'Received',
    'resumen.inTransit': 'In transit',
    'resumen.average': 'Average',
    'resumen.byProject': 'Spending by project',
    'resumen.byCategory': 'Spending by category',
    'resumen.byMonth': 'Spending by month',
    'resumen.chipAll': 'All',
    'resumen.captionAll': 'Showing the total of all projects',
    'resumen.captionProject': 'Monthly spending for {project}',
    'resumen.noBars': 'No spending in this period.',

    'common.purchases': 'purchases',

    'form.importe': 'Amount',
    'form.fecha': 'Date',
    'form.proyecto': 'Project',
    'form.categoria': 'Category',
    'form.proveedor': 'Supplier',
    'form.metodo': 'Payment method',
    'form.pagadoPor': 'Paid by',
    'form.descripcion': 'Description',
    'form.estado': 'Status',
    'form.recibo': 'Receipt or invoice',
    'form.selecciona': 'Select…',
    'form.ph.proveedor': 'Store or supplier',
    'form.ph.descripcion': 'What was bought and what for',
    'form.ph.pagadoPor': 'Who made the payment',
    'form.upload': 'Upload receipt or invoice (photo or PDF)',
    'form.reciboError': 'The file is larger than 2 MB. Use a lighter photo or a smaller PDF.',
    'form.cancel': 'Cancel',
    'form.save': 'Save purchase',
    'form.saveChanges': 'Save changes',
    'err.importe': 'Enter a valid amount',
    'err.proyecto': 'Select a project',
    'err.categoria': 'Select a category',
    'err.proveedor': 'Enter the supplier',
    'err.descripcion': 'Add a description',

    'hist.search': 'Search description or supplier',
    'hist.allMonths': 'All months',
    'hist.allProjects': 'All projects',
    'hist.allCategories': 'All categories',
    'hist.clear': 'Clear filters',
    'hist.col.fecha': 'DATE',
    'hist.col.proyecto': 'PROJECT',
    'hist.col.categoria': 'CATEGORY',
    'hist.col.metodo': 'METHOD',
    'hist.col.descripcion': 'DESCRIPTION',
    'hist.col.importe': 'AMOUNT',
    'hist.col.estado': 'STATUS',
    'hist.empty.title': 'No results',
    'hist.empty.sub': 'Try changing the filters',
    'hist.edit': 'Edit purchase',
    'hist.delete': 'Delete purchase',
    'hist.viewReceipt': 'View receipt',
    'hist.receipt': 'Receipt',
    'hist.download': 'Download',
    'hist.paidBy': 'Paid by',
    'hist.close': 'Close',
    'hist.statusToReceived': 'Mark as Received',
    'hist.statusToTransit': 'Mark as In transit',
    'hist.deleteConfirm': 'Delete this purchase?\n\n{desc}\n{date} · {amount}\n\nThis action cannot be undone.',

    'toast.created': 'Purchase saved successfully',
    'toast.updated': 'Purchase updated',
    'toast.deleted': 'Purchase deleted',
    'toast.saveError': 'Could not save. Check your connection.',
    'toast.updateError': 'Could not update. Check your connection.',
    'toast.deleteError': 'Could not delete. Check your connection.',

    'app.booting': 'Loading…',
    'app.loading': 'Loading purchases…',
    'app.connError': 'Could not connect to the server.',
    'app.retry': 'Retry',

    'nav.solicitudes': 'Requests',
    'header.title.solicitudes': 'Purchase requests',
    'header.subtitle.solicitudes': 'Request a purchase and track its status',
    'sol.new': 'New request',
    'sol.solicitante': 'Requester',
    'sol.ph.solicitante': 'Your name',
    'sol.importeEstimado': 'Estimated amount (optional)',
    'sol.nota': 'Note / justification (optional)',
    'sol.ph.nota': "What it's needed for",
    'sol.create': 'Create request',
    'sol.list': 'Requests',
    'sol.empty.title': 'No requests',
    'sol.empty.sub': 'Create the first request',
    'sol.reject': 'Reject',
    'sol.buy': 'Register purchase',
    'sol.delete': 'Delete request',
    'sol.by': 'by {name}',
    'sol.estimated': 'Estimated: {amount}',
    'sol.managerNote': "Manager's note: {nota}",
    'sol.rejectPrompt': 'Reason for rejection (optional):',
    'sol.deleteConfirm': 'Delete this request?',
    'sol.buyTitle': 'Register purchase for the request',
    'toast.reqCreated': 'Request created',
    'toast.reqRejected': 'Request rejected',
    'toast.reqDeleted': 'Request deleted',
    'toast.bought': 'Purchase registered',
    'toast.reqError': 'Could not complete. Check your connection.',
  },
  de: {
    'nav.resumen': 'Übersicht',
    'nav.registrar': 'Einkauf erfassen',
    'nav.historial': 'Verlauf',
    'nav.compras': 'EINKÄUFE',
    'nav.logout': 'Abmelden',

    'header.title.resumen': 'Übersicht Roboter-Einkäufe',
    'header.subtitle.resumen': 'Ausgaben nach Projekt, Kategorie und Monat',
    'header.title.registrar': 'Einkauf erfassen',
    'header.subtitle.registrar': 'Einen neuen Einkauf hinzufügen',
    'header.title.historial': 'Einkaufsverlauf',
    'header.subtitle.historial': 'Alle erfassten Einkäufe',
    'header.registerBtn': 'Einkauf erfassen',

    'login.title': 'Einkaufsregister',
    'login.subtitle': 'Gib das Team-Passwort ein, um fortzufahren.',
    'login.password': 'Passwort',
    'login.enter': 'Anmelden',
    'login.entering': 'Anmeldung…',
    'login.error': 'Falsches Passwort',

    'resumen.allPeriod': 'Gesamter Zeitraum',
    'resumen.totalSpent': 'GESAMTAUSGABEN',
    'resumen.received': 'Empfangen',
    'resumen.inTransit': 'Unterwegs',
    'resumen.average': 'Durchschnitt',
    'resumen.byProject': 'Ausgaben nach Projekt',
    'resumen.byCategory': 'Ausgaben nach Kategorie',
    'resumen.byMonth': 'Ausgaben nach Monat',
    'resumen.chipAll': 'Alle',
    'resumen.captionAll': 'Gesamtsumme aller Projekte',
    'resumen.captionProject': 'Monatliche Ausgaben für {project}',
    'resumen.noBars': 'Keine Ausgaben in diesem Zeitraum.',

    'common.purchases': 'Einkäufe',

    'form.importe': 'Betrag',
    'form.fecha': 'Datum',
    'form.proyecto': 'Projekt',
    'form.categoria': 'Kategorie',
    'form.proveedor': 'Lieferant',
    'form.metodo': 'Zahlungsmethode',
    'form.pagadoPor': 'Bezahlt von',
    'form.descripcion': 'Beschreibung',
    'form.estado': 'Status',
    'form.recibo': 'Beleg oder Rechnung',
    'form.selecciona': 'Auswählen…',
    'form.ph.proveedor': 'Geschäft oder Lieferant',
    'form.ph.descripcion': 'Was wurde gekauft und wofür',
    'form.ph.pagadoPor': 'Wer hat bezahlt',
    'form.upload': 'Beleg oder Rechnung hochladen (Foto oder PDF)',
    'form.reciboError': 'Die Datei ist größer als 2 MB. Verwende ein kleineres Foto oder PDF.',
    'form.cancel': 'Abbrechen',
    'form.save': 'Einkauf speichern',
    'form.saveChanges': 'Änderungen speichern',
    'err.importe': 'Gib einen gültigen Betrag ein',
    'err.proyecto': 'Wähle ein Projekt',
    'err.categoria': 'Wähle eine Kategorie',
    'err.proveedor': 'Gib den Lieferanten ein',
    'err.descripcion': 'Füge eine Beschreibung hinzu',

    'hist.search': 'Beschreibung oder Lieferant suchen',
    'hist.allMonths': 'Alle Monate',
    'hist.allProjects': 'Alle Projekte',
    'hist.allCategories': 'Alle Kategorien',
    'hist.clear': 'Filter zurücksetzen',
    'hist.col.fecha': 'DATUM',
    'hist.col.proyecto': 'PROJEKT',
    'hist.col.categoria': 'KATEGORIE',
    'hist.col.metodo': 'METHODE',
    'hist.col.descripcion': 'BESCHREIBUNG',
    'hist.col.importe': 'BETRAG',
    'hist.col.estado': 'STATUS',
    'hist.empty.title': 'Keine Ergebnisse',
    'hist.empty.sub': 'Ändere die Filter',
    'hist.edit': 'Einkauf bearbeiten',
    'hist.delete': 'Einkauf löschen',
    'hist.viewReceipt': 'Beleg ansehen',
    'hist.receipt': 'Beleg',
    'hist.download': 'Herunterladen',
    'hist.paidBy': 'Bezahlt von',
    'hist.close': 'Schließen',
    'hist.statusToReceived': 'Als Empfangen markieren',
    'hist.statusToTransit': 'Als Unterwegs markieren',
    'hist.deleteConfirm': 'Diesen Einkauf löschen?\n\n{desc}\n{date} · {amount}\n\nDiese Aktion kann nicht rückgängig gemacht werden.',

    'toast.created': 'Einkauf erfolgreich gespeichert',
    'toast.updated': 'Einkauf aktualisiert',
    'toast.deleted': 'Einkauf gelöscht',
    'toast.saveError': 'Speichern fehlgeschlagen. Prüfe die Verbindung.',
    'toast.updateError': 'Aktualisierung fehlgeschlagen. Prüfe die Verbindung.',
    'toast.deleteError': 'Löschen fehlgeschlagen. Prüfe die Verbindung.',

    'app.booting': 'Laden…',
    'app.loading': 'Einkäufe werden geladen…',
    'app.connError': 'Verbindung zum Server fehlgeschlagen.',
    'app.retry': 'Erneut versuchen',

    'nav.solicitudes': 'Anfragen',
    'header.title.solicitudes': 'Einkaufsanfragen',
    'header.subtitle.solicitudes': 'Einen Einkauf anfragen und Status verfolgen',
    'sol.new': 'Neue Anfrage',
    'sol.solicitante': 'Anfragende(r)',
    'sol.ph.solicitante': 'Dein Name',
    'sol.importeEstimado': 'Geschätzter Betrag (optional)',
    'sol.nota': 'Notiz / Begründung (optional)',
    'sol.ph.nota': 'Wofür wird es benötigt',
    'sol.create': 'Anfrage erstellen',
    'sol.list': 'Anfragen',
    'sol.empty.title': 'Keine Anfragen',
    'sol.empty.sub': 'Erstelle die erste Anfrage',
    'sol.reject': 'Ablehnen',
    'sol.buy': 'Einkauf erfassen',
    'sol.delete': 'Anfrage löschen',
    'sol.by': 'von {name}',
    'sol.estimated': 'Geschätzt: {amount}',
    'sol.managerNote': 'Notiz des Verantwortlichen: {nota}',
    'sol.rejectPrompt': 'Grund für die Ablehnung (optional):',
    'sol.deleteConfirm': 'Diese Anfrage löschen?',
    'sol.buyTitle': 'Einkauf für die Anfrage erfassen',
    'toast.reqCreated': 'Anfrage erstellt',
    'toast.reqRejected': 'Anfrage abgelehnt',
    'toast.reqDeleted': 'Anfrage gelöscht',
    'toast.bought': 'Einkauf erfasst',
    'toast.reqError': 'Konnte nicht abgeschlossen werden. Prüfe die Verbindung.',
  },
}

// Crea la función de traducción para un idioma, con interpolación {var}.
export function makeT(lang) {
  const dict = MESSAGES[lang] || MESSAGES.es
  return (key, vars) => {
    let s = dict[key] ?? MESSAGES.es[key] ?? key
    if (vars) for (const k of Object.keys(vars)) s = s.replaceAll(`{${k}}`, vars[k])
    return s
  }
}
