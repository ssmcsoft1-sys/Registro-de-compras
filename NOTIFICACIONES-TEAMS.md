# Aviso por Microsoft Teams al crear una solicitud

Cuando alguien crea una solicitud de compra, la app puede enviarte un **mensaje en Teams** con el
resumen. Se configura una sola vez. Es gratis y no necesita cuentas extra.

## Paso 1 — Crear el flujo en Teams (te da una URL)
1. En **Microsoft Teams**, abre la app **Workflows** (Flujos de trabajo / Power Automate).
   Si no la ves: menú **···** (más aplicaciones) → busca **Workflows**.
2. **Crear** un flujo nuevo → **Crear desde cero** (o busca la plantilla
   *"Publicar mensaje cuando se recibe una solicitud de webhook"*).
3. **Disparador (paso 1):** elige **"When a Teams webhook request is received"**
   (*Cuando se recibe una solicitud de webhook de Teams*).
   - En "Who can trigger the flow" deja **Anyone** (cualquiera con la URL).
4. **Acción (paso 2):** añade **"Post message in a chat or channel"**
   (*Publicar mensaje en un chat o canal*):
   - **Post as:** *Flow bot*
   - **Post in:** *Chat with Flow bot* (te llega a ti como mensaje privado del bot)
     — o elige *Chat*/*Channel* y la persona/canal que quieras.
   - **Message:** haz clic en el campo y, en el panel de **contenido dinámico**, inserta el valor
     **`text`** del disparador. (Si no aparece "text", escribe en el campo un texto cualquiera y
     luego reemplázalo por el dato dinámico `text` del webhook.)
5. **Guardar**. Al guardar, el disparador muestra una **URL HTTP POST** — cópiala. Es un enlace
   largo que empieza por `https://prod-...logic.azure.com/...`.

> Trata esa URL como una contraseña: quien la tenga puede enviar mensajes a ese flujo.

## Paso 2 — Pegar la URL en la app
- En **Render** (o el host donde esté la app): sección **Environment / Variables de entorno**,
  añade una variable llamada **`TEAMS_WEBHOOK_URL`** con el valor de esa URL. Guarda y deja que
  reinicie.
- ¡Listo! A partir de ahí, cada solicitud nueva te llegará por Teams.

## Cómo se ve el mensaje
```
🛒 Nueva solicitud de compra
Solicitante: ana@candelasoft.com
Proyecto: Proyecto 1
Categoría: Filamento
Descripción: Rollos PLA
Cantidad: 5
Importe estimado: $50.000
Link: https://tienda.com/...
```

## Notas
- Es **opcional**: si no configuras `TEAMS_WEBHOOK_URL`, la app funciona igual (y sigue el contador
  de pendientes dentro de la app).
- Si un día deja de llegar, revisa que el flujo en Teams siga **activado** y que la variable
  `TEAMS_WEBHOOK_URL` tenga la URL correcta.
- Microsoft está retirando los antiguos "Incoming Webhook"; por eso usamos **Workflows/Power
  Automate**, que es el método vigente.
