# Iglesia Revoluciona - Portal de Ofrendas

Portal de donaciones PWA para Iglesia Revoluciona. Una aplicación móvil-primero con Next.js 14+ que funciona como una aplicación nativa en Android y iOS.

## Características

- PWA (Progressive Web App) con soporte offline
- Diseño móvil-primero con experiencia nativa
- Teclado numérico en móviles para entrada de montos
- Portal de administración con autenticación
- Estadísticas en tiempo real
- Toggle para habilitar/deshabilitar el portal
- Base de datos en memoria (ideal para demos y testing)
- Diseño responsive y accesible

## Estructura del Proyecto

```
regiven/
├── public/
│   ├── manifest.json          # PWA manifest
│   ├── icon-192.png           # Icono 192x192 (reemplazar)
│   └── icon-512.png           # Icono 512x512 (reemplazar)
├── src/
│   ├── app/
│   │   ├── page.tsx           # Formulario de donación
│   │   ├── gracias/           # Página de agradecimiento
│   │   ├── deshabilitado/     # Portal deshabilitado
│   │   ├── admin/             # Login administrativo
│   │   │   └── dashboard/     # Panel administrativo
│   │   └── api/
│   │       ├── donations/     # API de donaciones
│   │       ├── settings/      # API de configuración
│   │       └── auth/          # API de autenticación
│   ├── lib/
│   │   └── store.ts           # Base de datos en memoria
│   └── middleware.ts          # Middleware de rutas
├── .env.local                 # Variables de entorno
└── package.json
```

## Instalación

1. Clonar o descargar el proyecto
2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno en `.env.local`:
```
ADMIN_USER=admin
ADMIN_PASSWORD=regiven2024
```

4. Ejecutar en desarrollo:
```bash
npm run dev
```

5. Abrir en el navegador: http://localhost:3000

## Deployment en Vercel

1. Push el código a GitHub
2. Importar el proyecto en Vercel
3. Configurar las variables de entorno:
   - `ADMIN_USER`: Usuario administrador
   - `ADMIN_PASSWORD`: Contraseña administrador
4. Deploy

## Rutas

### Públicas
- `/` - Formulario de donación
- `/gracias` - Página de agradecimiento (con parámetros de monto y fecha)
- `/deshabilitado` - Mostrado cuando el portal está deshabilitado

### Administrativas
- `/admin` - Login administrativo
- `/admin/dashboard` - Panel de control (requiere autenticación)

### API
- `POST /api/donations` - Crear donación
- `GET /api/donations` - Listar donaciones (admin)
- `GET /api/settings` - Obtener configuración del portal
- `PUT /api/settings` - Actualizar configuración (admin)
- `POST /api/auth` - Login
- `DELETE /api/auth` - Logout

## Características PWA

La aplicación incluye:
- Manifest para instalación en dispositivo
- Meta tags para iOS/Android
- Display standalone (sin barra del navegador)
- Safe area insets para iOS
- Viewport optimizado para prevenir zoom
- Theme color negro

Para instalar como app:
- **iOS**: Safari > Compartir > Agregar a pantalla de inicio
- **Android**: Chrome > Menú > Agregar a pantalla de inicio

## Características de la UI

### Formulario de Donación
- Logo circular negro con "re" blanco
- 6 botones de montos predefinidos (RD$500 - RD$25,000)
- Input personalizado con teclado numérico en móviles
- Formato de moneda dominicana (RD$)
- Validación de montos
- Botón de donación con estado de carga
- Mensaje de seguridad

### Página de Agradecimiento
- Checkmark de confirmación
- Verso bíblico (2 Corintios 9:7)
- Detalles de la donación (monto, fecha, hora)
- Botón para volver al inicio

### Panel Administrativo
- Toggle para habilitar/deshabilitar portal
- Estadísticas totales y del día
- Tabla de historial de donaciones
- Auto-refresh cada 10 segundos
- Logout seguro

## Base de Datos

La aplicación usa una base de datos en memoria que se reinicia cuando se reinicia el servidor. Esto es ideal para:
- Demos y pruebas
- Desarrollo
- Despliegue en Vercel sin configuración adicional

Para producción, se recomienda migrar a una base de datos persistente como:
- PostgreSQL con Vercel Postgres
- MongoDB Atlas
- Supabase
- PlanetScale

## Seguridad

- Autenticación basada en sesión con cookies HTTP-only
- Validación de entrada en todos los endpoints
- Middleware para proteger rutas administrativas
- Variables de entorno para credenciales
- HTTPS en producción (Vercel)

## Personalización

### Colores
Modificar en `tailwind.config.ts` o directamente en los componentes:
- Negro: `#000000` - Color principal
- Gris claro: `#f3f4f6` - Botones no seleccionados
- Gris texto: `#9ca3af` - Texto secundario

### Montos Predefinidos
Editar en `src/app/page.tsx`:
```typescript
const PRESET_AMOUNTS = [500, 1000, 2500, 5000, 10000, 25000];
```

### Iconos PWA
Reemplazar los archivos placeholder:
- `public/icon-192.png` - 192x192 pixels
- `public/icon-512.png` - 512x512 pixels

## Tecnologías

- **Next.js 14+** - Framework React con App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Estilos utility-first
- **PWA** - Manifest y meta tags
- **In-Memory Store** - Base de datos temporal

## Soporte de Navegadores

- Chrome/Edge 90+
- Safari 14+
- Firefox 88+
- iOS Safari 14+
- Chrome Android 90+

## Licencia

Propiedad de Iglesia Revoluciona

## Contacto

Para soporte o preguntas, contactar al equipo de tecnología de Iglesia Revoluciona.
