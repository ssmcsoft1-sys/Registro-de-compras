# Handoff: Sistema de registro de compras (web/escritorio)

## Overview
Aplicación web de escritorio para que un **responsable/manager** registre y revise las compras de la empresa.
Tiene tres vistas: **Resumen** (dashboard de gastos), **Registrar compra** (formulario) e **Historial**
(listado con filtros). El objetivo principal es ver de un vistazo el gasto total y su desglose
**por proyecto, por categoría y por mes**, incluyendo el gasto mensual de **cada proyecto** por separado.

Idioma de UI: **español**. Moneda: **peso, formato `$1,234,567`** (`Intl` es-MX, sin decimales en los resúmenes).

## About the Design Files
Los archivos de este paquete son **referencias de diseño hechas en HTML** — un prototipo que muestra el
aspecto y el comportamiento previstos, **no código de producción para copiar tal cual**. La tarea es
**recrear este diseño en el entorno del codebase destino** (React, Vue, etc.) usando sus patrones y
librerías establecidas. Si todavía no hay entorno, elige el framework más adecuado (recomendado: React)
e impleméntalo allí.

- `Registro de Compras.dc.html` — el prototipo. Es un "Design Component": markup + una clase de lógica
  (estado, datos semilla, cálculos). **Toda la lógica de cálculo de los gráficos está ahí y es directamente
  portable** (ver sección *State Management*). Ignora el envoltorio propietario `<x-dc>` / `support.js`;
  lo relevante es el JSX-equivalente del `<template>` y la clase `Component`.
- `reference/colors_and_type.css` — tokens del design system **Yago** (colores, tipografía, radios,
  sombras, espaciado). Úsalo como fuente de verdad de los tokens.
- `reference/yago-logo-horizontal.png` — logo de la marca para la barra lateral.

## Fidelity
**Alta fidelidad (hifi).** Colores, tipografía, espaciado e interacciones son definitivos. Recrea la UI
de forma fiel usando las librerías/patrones del codebase. Tipografía: **Red Hat Display** (pesos 500/700/800).
Iconos: **Lucide** (`lucide-react` en React).

---

## Screens / Views

Layout global (las tres vistas comparten el shell):
- **Sidebar fija** a la izquierda: `width: 252px`, fondo `#fff`, borde derecho `1px #e8e8ee`, padding `24px 18px`.
  Contiene el logo (alto 30px), un overline `COMPRAS` y la navegación.
- **Main** a la derecha: columna flex, ocupa el resto. Cabecera fija arriba + área de contenido scrollable.
- **Header**: padding `24px 36px`, fondo `#fff`, borde inferior `1px #e8e8ee`. A la izquierda título (h1, 700/26px)
  + subtítulo (500/14px `#707079`). A la derecha botón primario **"Registrar compra"** (oculto en la vista de registro).
- **Contenido**: `max-width: 1120px`, centrado, padding `30px 36px 56px`.

### 1. Resumen (vista por defecto)
**Propósito:** visión global del gasto.
Estructura (vertical, gap 20px):
1. **Chip de periodo** — pill con icono `calendar`, fondo `--yago-indigo-tint-10`, texto índigo 700/13px: "Ene – Jun 2026".
2. **Card hero "TOTAL GASTADO"** — fondo degradado `--yago-gradient-cta` (`linear-gradient(90deg,#322d91,#e72c6e)`),
   `border-radius: 20px`, padding `30px 34px`, sombra `0 12px 28px rgba(50,45,145,.18)`. Flex space-between.
   - Izquierda: overline `TOTAL GASTADO` (700/12px, letter-spacing .1em, blanco 72%), cifra grande (800/46px blanco),
     pie "Ene – Jun 2026 · N compras".
   - Derecha: 3 KPIs (Recibidas, En envío, Promedio), cada uno valor 800/26px blanco + label 600/12px blanco 72%.
3. **Dos cards en grid `1fr 1fr` (gap 20px):**
   - **"Gastos por proyecto"** (icono `folder`) — barras horizontales, ordenadas desc.
   - **"Gastos por categoría"** (icono `tag`) — barras horizontales, ordenadas desc.
   - Card: `#fff`, `border-radius: 20px`, sombra `0 2px 6px rgba(50,45,145,.08)`, padding 24px.
   - Cada barra: fila label+importe (label 600/14px con punto de color 10px; importe 700/14px), debajo track
     `height:10px`, fondo `#f2f2f5`, `border-radius:60px`, relleno con `width:%` (relativo al máximo del grupo) y color del ítem.
4. **Card "Gasto por mes"** (icono `bar-chart-3`, ancho completo) — **incluye selector de proyecto**:
   - Cabecera flex space-between: título + fila de chips **Todos · Proyecto 1 · Proyecto 2 · Proyecto 3 · Proyecto 4**.
     Chip activo: fondo `#322d91`, texto blanco; inactivo: fondo `--yago-indigo-tint-10`, texto índigo. Pill 700/12px, padding `6px 13px`.
   - Gráfico de barras verticales (6 meses ene–jun): contenedor flex align-end, cada columna con barra
     `max-width:48px`, altura `%` (relativa al mes máximo), `border-radius:8px 8px 0 0`. Encima el importe (700/12px),
     debajo el mes (600/13px `#9797a3`).
   - Color de barra: degradado índigo `linear-gradient(180deg,#4843a8,#322d91)` cuando "Todos"; color sólido del
     proyecto cuando hay uno seleccionado.
   - Pie (500/12px `#9797a3`): "Mostrando el total de todos los proyectos" / "Gasto mensual de Proyecto X".

### 2. Registrar compra
**Propósito:** alta de una compra. Card centrada `max-width: 780px`, padding 32px.
Campos (grid `1fr 1fr`, gap 18px), label 700/13px índigo con asterisco magenta `#e72c6e` en obligatorios:
- **Importe** * — input con prefijo `$`, `inputmode=decimal`.
- **Fecha** — `input[type=date]`, valor por defecto hoy.
- **Proyecto** * — select (Proyecto 1–4).
- **Categoría** * — select (5 categorías).
- **Proveedor** * — input texto.
- **Método de pago** — select (Tarjeta corporativa / Transferencia / Efectivo).
- **Descripción** * — textarea (ancho completo).
- **Estado** — segmented de 2 botones: **Recibido** (icono `check`) / **En envío** (icono `truck`).
  Activo: fondo `#322d91`, blanco; inactivo: `#fff`, borde `1.5px #e8e8ee`, texto índigo. Alto 46px, pill.
- **Foto del recibo** — dropzone (`border:1.5px dashed #b9b6e0`, `border-radius:12px`, fondo `#f7f7fb`).
  `input[type=file]` oculto; al subir muestra miniatura 38×38 + nombre.
Inputs: borde `1px #e8e8ee`, `border-radius:8px`, padding `~12px 14px`, 500–600/15px.
Acciones (abajo derecha): **Cancelar** (botón secundario, borde índigo 1.5px, pill) + **Guardar compra** (primario índigo, pill).
Validación: importe > 0, proyecto, categoría, proveedor y descripción obligatorios; error en magenta bajo el campo.
Al guardar: añade la compra, limpia el formulario, navega a Historial y muestra un toast de confirmación.

### 3. Historial
**Propósito:** listado de todas las compras con filtros.
- **Barra de filtros** (flex, wrap, gap 12px): buscador (pill, icono `search`, busca en descripción+proveedor),
  select de mes, select de proyecto, select de categoría. Todos pill, borde `1px #e8e8ee`.
- **Resumen de resultados**: "N compras · $total" + botón texto **"Limpiar filtros"** (icono `x`, índigo 700/13px).
- **Tabla** (card `border-radius:20px`, sombra sm): cabecera grid + filas grid.
  Columnas (`grid-template-columns: 96px 1fr 110px 168px 130px 116px 120px`, gap 14px):
  **FECHA · DESCRIPCIÓN · PROYECTO · CATEGORÍA · MÉTODO · IMPORTE · ESTADO**.
  - Cabecera: 700/11px, letter-spacing .06em, `#9797a3`, borde inferior `1px #e8e8ee`.
  - Fila: padding `15px 22px`, borde inferior `1px #f2f2f5`.
    - Fecha: "12 jun 2026" (600/13px `#4f4f57`).
    - Descripción: 600/14px `#111114` + proveedor debajo 500/12px `#9797a3` (ambos con ellipsis).
    - Proyecto: punto de color 8px + "P1…P4".
    - Importe: 700/14px, alineado a la derecha.
    - Estado: chip — **Recibido** (icono `check`, fondo `rgba(31,138,91,.12)`, texto `#1f8a5b`) /
      **En envío** (icono `truck`, fondo `--yago-yellow-tint #fbe6a8`, texto `#6b4500`). Pill 700/12px.
  - Estado vacío: icono `inbox`, "Sin resultados" + "Prueba a cambiar los filtros".

---

## Interactions & Behavior
- **Navegación**: sidebar cambia entre vistas (resumen / registrar / historial). Sin recarga; es SPA.
- **Selector de proyecto en "Gasto por mes"**: cambia el dataset de las barras y el color, recalcula alturas.
- **Botones**: press scale 0.97 (120ms, `cubic-bezier(.2,.9,.1,1.1)`) según el design system.
- **Toast** de confirmación: fija, abajo-centro, fondo `#1f1c5e`, pill, icono `check-circle` verde; entra con
  `@keyframes toastIn` (opacity + translateY 12px→0, 0.28s), se oculta solo a los ~2.8s.
- **Validación de formulario**: en submit; resalta errores bajo cada campo.
- **Subida de recibo**: `FileReader` → data URL → miniatura (en producción, subir a tu storage).
- **Filtros de historial**: combinables (mes + proyecto + categoría + búsqueda), aplican en vivo.
- Hover: ratón; móvil no es objetivo (diseño de escritorio).

## State Management
Estado (ver clase `Component` en el `.dc.html`):
- `view`: `'resumen' | 'registrar' | 'historial'`.
- `monthProject`: `'all' | 'Proyecto 1..4'` — filtro del gráfico mensual.
- `q`, `fMonth`, `fProyecto`, `fCategoria` — filtros del historial.
- `form`: `{ importe, fecha, proyecto, categoria, proveedor, descripcion, metodo, estado, recibo, errors }`.
- `purchases`: array de compras. Modelo de cada compra:
  `{ id, fecha (YYYY-MM-DD), proyecto, categoria, descripcion, proveedor, metodo, estado, importe (number), recibo }`.
- `toast`: string | null.

Cálculos derivados (recomputados a partir de `purchases`, todos portables tal cual):
- **total**, **conteo**, **recibidas**, **en envío**, **promedio**.
- **byProyecto / byCategoria**: suma por grupo, orden desc, `pct` relativo al máximo del grupo.
- **byMonth**: suma por mes (filtrada por `monthProject`), altura relativa al mes máximo.
- **rows** del historial: filtradas + ordenadas por fecha desc; total filtrado.
En producción, `purchases` vendrá de una API/DB; el resto de cálculos se mantienen.

## Design Tokens
Fuente: `reference/colors_and_type.css` (variables `--yago-*`). Resumen de lo usado:
- **Índigo (primario)**: 900 `#1f1c5e` · 800 `#2a2680` · 700 `#322d91` (PRIMARY) · 600 `#4843a8` · 500 `#6863c2` · 300 `#b9b6e0` · 100 `#e7e6f3`.
  Tinte: `--yago-indigo-tint-10 rgba(50,45,145,.10)`.
- **Acentos**: magenta `#e72c6e`; verde `#1f8a5b` (+ tinte `rgba(31,138,91,.12)`); amarillo tinte `#fbe6a8` / texto `#6b4500`.
- **Degradados**: CTA `linear-gradient(90deg,#322d91,#e72c6e)`; avatar `linear-gradient(135deg,#4843a8,#1f1c5e)`.
- **Neutros**: paper `#f7f7fb` · surface `#fff` · gray-50 `#f2f2f5` · 100 `#e8e8ee` · 400 `#9797a3` · 500 `#707079` · 600 `#4f4f57` · 900 `#111114`.
- **Colores de proyecto (data-viz)**: P1 `#322d91` · P2 `#4843a8` · P3 `#6863c2` · P4 `#b9b6e0`.
- **Colores de categoría (data-viz)**: Mecánicos `#322d91` · Eléctricos `#6863c2` · Filamento `#e72c6e` · Servicios `#1f8a5b` · Material de oficina `#f5b400`.
- **Tipografía**: Red Hat Display. Escala usada: 800/46px (hero), 700/26px (h1), 700/16px (títulos card), 600/14px (body), 500/13–12px (captions).
- **Radios**: 8px (inputs/barras), 12px (nav/dropzone), 20px (cards), 60px (pills/chips/botones), 50% (avatares/puntos).
- **Sombras** (índigo-tintadas): sm `0 2px 6px rgba(50,45,145,.08)` (cards) · lg `0 12px 28px rgba(50,45,145,.14-.18)` (hero/toast).
- **Espaciado**: escala de 4px; gutter entre cards 20px; padding de página 30–36px.
- **Motion**: `cubic-bezier(.2,.8,.2,1)`, duraciones 120/200/320ms.

## Assets
- **Logo**: `reference/yago-logo-horizontal.png`.
- **Iconos**: Lucide (`calendar, folder, tag, bar-chart-3, plus, plus-circle, list, layout-dashboard, search, x,
  check, truck, upload, check-circle, inbox`). En React usar `lucide-react`.
- **Fuente**: Red Hat Display (Google Fonts o webfont local; en el design system se carga vía `@font-face`).
- **Datos**: el prototipo usa 19 compras semilla de ejemplo (ene–jun 2026) — reemplazar por datos reales.

## Files
- `Registro de Compras.dc.html` — prototipo completo (markup + lógica/estado/cálculos).
- `reference/colors_and_type.css` — tokens del design system Yago.
- `reference/yago-logo-horizontal.png` — logo.
