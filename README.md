# NotFat - React Native (Expo) + Supabase/Prisma Application

Una aplicación completa de nutrición y fitness con React Native (Expo) frontend y Supabase/Prisma backend.

## 🏗️ Arquitectura

### Frontend (React Native + Expo)
- **React Native** con **Expo** para desarrollo multiplataforma
- **TypeScript** para type safety
- **React Navigation** para navegación
- **Zustand** para state management
- **Expo Camera** para escaneo de alimentos
- **Expo Notifications** para notificaciones push

### Backend (Supabase + Prisma)
- **Supabase** como backend-as-a-service
- **PostgreSQL** como base de datos principal
- **Prisma** como ORM y migration tool
- **54 tablas** optimizadas para nutrición y fitness

## 📁 Estructura del Proyecto

```
NotFat/
├── src/
│   ├── components/          # Componentes UI reutilizables
│   ├── screens/            # Pantallas principales
│   ├── hooks/              # Custom React hooks
│   ├── services/           # Servicios de API y Supabase
│   ├── constants/          # Constantes y configuración
│   ├── utils/              # Utilidades y helpers
│   ├── types/              # Definiciones TypeScript
│   ├── store/              # Zustand store
│   └── navigation/         # Configuración de navegación
├── supabase/
│   └── migrations/        # Migraciones de Supabase
├── prisma/
│   ├── schema.prisma       # Esquema Prisma completo
│   └── seed.ts             # Script de seeding
├── tests/                 # Tests unitarios y de integración
├── docs/                  # Documentación
└── assets/                # Imágenes, fuentes, etc.
```

## 🚀 Configuración Inicial

### Prerrequisitos

- Node.js 18+ 
- npm o yarn
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Supabase

### 1. Clonar e Instalar Dependencias

```bash
git clone <repository-url>
cd NotFat
npm install
```

### 2. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/notfat_db?schema=public"

# Supabase Configuration
SUPABASE_URL="https://your-project-id.supabase.co"
SUPABASE_ANON_KEY="your-supabase-anon-key"

# Expo Configuration
EXPO_PUBLIC_SUPABASE_URL="https://your-project-id.supabase.co"
EXPO_PUBLIC_SUPABASE_ANON_KEY="your-supabase-anon-key"
```

### 3. Configurar Base de Datos

#### Opción A: Usar Supabase Cloud

1. Crea un nuevo proyecto en [Supabase](https://supabase.com)
2. Copia el `DATABASE_URL` desde Settings > Database
3. Ejecuta las migraciones manualmente en el SQL Editor de Supabase

#### Opción B: Base de Datos Local

```bash
# Inicia PostgreSQL local
createdb notfat_db

# Genera el cliente Prisma
npx prisma generate

# Aplica el esquema a la BD
npx prisma db push
```

### 4. Poblar Base de Datos (Seeding)

El script de seeding crea 100 usuarios con datos históricos de 30 días:

```bash
# Ejecuta el seed
npx prisma db seed
```

**Qué incluye el seed:**
- **100 usuarios**: 95 regulares, 3 creators, 2 admins
- **Perfiles completos**: Biometría, dietas, objetivos
- **Datos históricos**: 30 días de meals, water_logs, body_metrics
- **Suscripciones**: Activas y caducadas para testing de paywall
- **Datos maestros**: Institutions, nutritionists, additives, daily_tips

### 5. Iniciar Aplicación

```bash
# Iniciar servidor de desarrollo
npm start

# Para iOS
npm run ios

# Para Android  
npm run android

# Para Web
npm run web
```

## 📊 Modelo de Datos

### Tablas Principales

- **profiles**: Usuarios y sus perfiles
- **meals**: Registro de comidas
- **food_items**: Items individuales de cada comida
- **water_logs**: Registro de hidratación
- **body_metrics**: Métricas corporales
- **subscriptions**: Suscripciones de usuarios
- **payments**: Historial de pagos

### Enums Importantes

```typescript
enum user_role {
  user, creator, admin, superadmin
}

enum meal_type_enum {
  breakfast, lunch, dinner, snack
}

enum meal_status {
  analyzing, complete, error, no_nutritional_info
}
```

## 🛠️ Comandos Disponibles

### Desarrollo
```bash
npm start              # Iniciar Expo
npm run ios           # Abrir en iOS Simulator
npm run android       # Abrir en Android Emulator
npm run web           # Abrir en navegador
```

### Base de Datos
```bash
npx prisma generate   # Generar cliente Prisma
npx prisma db push    # Aplicar schema a BD
npx prisma migrate    # Crear migración
npx prisma studio     # Abrir Prisma Studio
npx prisma db seed    # Poblar BD con datos de prueba
```

### Calidad
```bash
npm run lint          # Ejecutar ESLint
npm run lint:fix      # Corregir automáticamente
npm run type-check    # Verificar tipos TypeScript
npm test             # Ejecutar tests
```

## 🔐 Seguridad Implementada

### Role-Based Access Control
- **user**: Acceso básico a funcionalidades
- **creator**: Puede crear códigos promocionales
- **admin**: Acceso completo a panel de administración
- **superadmin**: Acceso total al sistema

### Validaciones
- Todos los modelos tienen relaciones UUID con profiles
- Campos de role protegidos contra modificaciones no autorizadas
- Validación de datos en todos los niveles

## 📱 Funcionalidades Principales

### Core Features
- ✅ Registro y análisis de alimentos con IA
- ✅ Seguimiento de hidratación
- ✅ Métricas corporales y progreso
- ✅ Objetivos nutricionales personalizados
- ✅ Integración con Apple Health/Google Fit

### Premium Features
- ✅ Sistema de suscripciones con paywall
- ✅ Recomendaciones personalizadas
- ✅ Coach nutricional IA
- ✅ Análisis avanzado de alimentos

### Administración
- ✅ Panel de administración
- ✅ Sistema de códigos promocionales
- ✅ Analytics y reportes
- ✅ Gestión de usuarios y roles

## 🧪 Testing

```bash
# Ejecutar todos los tests
npm test

# Tests en modo watch
npm run test:watch

# Coverage report
npm run test:coverage
```

## 📦 Build para Producción

```bash
# Build para producción
npm run build

# iOS
expo build:ios

# Android
expo build:android

# Web
expo build:web
```

## 🚀 Deploy

### Supabase Deploy

1. **Configurar proyecto en Supabase**
   ```bash
   supabase login
   supabase init
   supabase link --project-ref your-project-id
   ```

2. **Aplicar migraciones**
   ```bash
   supabase db push
   ```

3. **Deploy frontend**
   ```bash
   expo build:web
   # Subir build/ a tu hosting preferido
   ```

### Environment Variables de Producción

```env
NODE_ENV=production
ENVIRONMENT=production
DATABASE_URL=postgresql://...
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-prod-anon-key
```

## 🤝 Contribución

1. Fork del proyecto
2. Crear feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push al branch (`git push origin feature/amazing-feature`)
5. Abrir Pull Request

## 📝 Licencia

Este proyecto está bajo licencia MIT. Ver [LICENSE](LICENSE) para más detalles.

## 🆘 Soporte

- **Email**: support@notfat.app
- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/your-repo/issues)

## 🔄 Flujo de Desarrollo Típico

1. **Setup inicial**: `npm install` + configurar `.env`
2. **BD**: `npx prisma db push` + `npx prisma db seed`
3. **Desarrollo**: `npm start`
4. **Cambios en BD**: Modificar `prisma/schema.prisma` → `npx prisma db push`
5. **Testing**: `npm test`
6. **Deploy**: `npm run build` + deploy

---

**NotFat** - Transformando la nutrición con tecnología 🥗💪
