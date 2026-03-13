# 🤖 Conectar Google Gemini Pro a NotFat AI

Tu NotFat AI ya está configurado para usar Google Gemini Pro! Aquí está todo lo que necesitas saber:

## 📋 Estado Actual

✅ **Ya configurado:**
- Función `analyze-meal` con Gemini 2.0 Flash
- Integración en Supabase Edge Functions
- Hook `useAIAnalysis` en la app móvil
- Variables de entorno preparadas

## 🔑 Pasos para Conectar

### Opción 1: Script Automático (Recomendado)
```bash
./setup-gemini.sh
```

### Opción 2: Manual

1. **Obtén tu API Key:**
   - Ve a: https://makersuite.google.com/app/apikey
   - Crea una nueva API key
   - Copia la key

2. **Configura en .env.local:**
   ```bash
   # Si no existe, copia el ejemplo:
   cp .env.example .env.local
   
   # Edita .env.local y agrega:
   GOOGLE_GEMINI_API_KEY="tu-api-key-aqui"
   DEFAULT_LLM_MODEL="gemini-2.0-flash"
   ENABLE_AI_FEATURES="true"
   ```

## 🚀 Funcionalidades Disponibles

Una vez conectado, tendrás acceso a:

- 📸 **Análisis de comidas por imagen**
- 🥗 **Detección nutricional automática**
- 🎯 **Recomendaciones personalizadas**
- 📊 **Health score con IA**
- 💬 **Coach nutricional inteligente**

## 🧪 Probar la Conexión

Para verificar que todo funciona:

1. **Inicia la app:** `npm start` o `expo start`
2. **Ve a la pantalla de escaneo**
3. **Toma una foto de comida**
4. **Verifica el análisis con IA**

## 🔧 Configuración Técnica

La integración usa:
- **Modelo:** Gemini 2.0 Flash
- **Endpoint:** Supabase Edge Functions
- **Función:** `analyze-meal`
- **Timeout:** 30 segundos
- **Retries:** 3 intentos

## 🚨 Solución de Problemas

Si no funciona:
1. Verifica tu API key de Gemini
2. Confirma que tengas créditos en Google Cloud
3. Revisa los logs de Supabase Functions
4. Asegúrate de tener conexión a internet

## 📞 Soporte

Si necesitas ayuda:
- Revisa los logs en la consola
- Verifica la configuración de Supabase
- Contacta al equipo de desarrollo

---

**¡Listo!** Tu NotFat AI ahora está conectado con Google Gemini Pro 🎉
