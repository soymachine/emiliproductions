# Emili · Presupuestos y facturas

App web para gestionar **clientes**, **presupuestos** (con dibujo de cada ventana, corredera o puerta generado a partir de sus medidas) y **facturas**, con descarga en **PDF**. Sustituye a InGnio con algo más sencillo, con letra grande y usable desde el móvil en obra.

**Coste: 0 €.** Todo funciona en el plan gratuito *Spark* de Firebase (no pide tarjeta):
- Firebase Hosting sirve la web (HTTPS y dominio `*.web.app` incluidos).
- Firebase Authentication para el login de Emili.
- Cloud Firestore guarda los datos (la cuota gratuita da para miles de presupuestos).
- No hay servidor: los PDF y los dibujos se generan en el propio navegador.

## Qué hace

| Pantalla | Funciones |
|---|---|
| Inicio | Accesos rápidos, presupuestos recientes, facturas pendientes de cobro |
| Clientes | Alta/edición, buscador, historial de presupuestos y facturas, importación desde CSV/Excel (InGnio) |
| Artículos | Catálogo de tipos (ventanas, correderas, puertas, fijos, otros) con su dibujo y medidas/precio por defecto |
| Presupuestos | Elegir cliente (o crearlo al momento), añadir artículos, cambiar dibujo/medidas/cantidad/precio, IVA 21 % o 10 %, PDF, duplicar, convertir en factura |
| Facturas | Se crean desde un presupuesto (numeración correlativa anual), PDF sin dibujos, marcar como pagada, totales por año |
| Ajustes | Datos fiscales, logo, IVA por defecto, condiciones del presupuesto, pie de factura, copia de seguridad |

Numeración: `P-2026-001` para presupuestos y `F-2026-001` para facturas; se reinicia cada año. Las facturas emitidas no se pueden modificar ni borrar (lo garantizan las reglas de seguridad).

## Puesta en marcha (una sola vez)

1. **Crear el proyecto Firebase** en <https://console.firebase.google.com> → *Añadir proyecto* (sin Google Analytics). Se queda en plan Spark (gratuito).
2. **Authentication** → *Comenzar* → activar *Correo electrónico/contraseña*. En la pestaña *Usuarios*, *Añadir usuario* con el email y contraseña de Emili.
3. **Firestore Database** → *Crear base de datos* → modo producción, ubicación `eur3 (europe-west)`.
4. **Configuración del proyecto** → *Tus apps* → icono web `</>` → registrar la app. Copiar los valores de `firebaseConfig`.
5. En este repositorio:
   - `cp .env.example .env.local` y rellenar los valores del paso 4.
   - En `.firebaserc` poner el ID del proyecto.
   - En `firestore.rules` cambiar `cambiar@ejemplo.com` por el email de Emili **en minúsculas**.
6. Desplegar:
   ```bash
   npm install
   npx firebase login
   npm run deploy
   ```
   La web queda en `https://<id-del-proyecto>.web.app`.

Al entrar por primera vez se crea el catálogo de artículos inicial y unos datos de empresa de ejemplo: ve a **Ajustes** para poner los datos reales y el logo.

### Despliegue automático (opcional)

`.github/workflows/deploy.yml` despliega al hacer push a `main` (GitHub Actions es gratis). Hay que configurar en GitHub → *Settings → Secrets and variables → Actions*:
- Variables: `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`.
- Secreto `FIREBASE_SERVICE_ACCOUNT`: JSON de una cuenta de servicio (Consola Google Cloud → IAM → Cuentas de servicio) con los roles *Firebase Hosting Admin* y *Firebase Rules Admin*.

## Importar clientes de InGnio

Exporta los clientes desde InGnio a CSV o Excel. En **Clientes → Importar** se sube el fichero, la app adivina qué columna es cada dato (nombre, NIF, dirección, CP, población, provincia, teléfonos, email), se puede corregir, y se saltan los NIF repetidos.

## Desarrollo

```bash
npm install
npm run emulators      # en una terminal: Auth + Firestore locales (necesita Java)
npm run dev:emu        # en otra: la app en http://localhost:3000 contra los emuladores
npm test               # tests de cálculos, numeración, dibujos e importación
npm run build          # genera la web estática en out/
```

Para entrar en local crea un usuario `cambiar@ejemplo.com` desde la UI de los emuladores (<http://localhost:4000>).

Estructura:
- `src/app/…` — pantallas (Next.js, exportación estática).
- `src/lib/db.ts` — acceso a Firestore (numeración con transacciones, conversión a factura).
- `src/lib/drawings/` — generador de dibujos paramétricos (mismo dibujo en pantalla y en PDF).
- `src/lib/pdf/` — PDF de presupuesto y factura (`@react-pdf/renderer`).
- `src/lib/money.ts` — importes en céntimos para evitar errores de redondeo.
- `firestore.rules` — solo la cuenta de Emili puede acceder; facturas inmutables.

## Pendiente / a tener en cuenta

- **Verifactu** (sistema de facturación de la AEAT): será obligatorio para autónomos previsiblemente en 2027. El modelo ya guarda facturas inmutables con numeración correlativa; habrá que añadir la huella encadenada, el QR y el envío a la AEAT. Confirmar plazos con la gestoría.
- **Copias de seguridad**: el plan gratuito no hace backups automáticos de Firestore. Usar *Ajustes → Descargar copia de seguridad* periódicamente.
- Facturas rectificativas: no incluidas todavía.
