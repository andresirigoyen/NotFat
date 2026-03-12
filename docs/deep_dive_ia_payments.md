# 🔍 Deep Dive: IA y MercadoPago en NotFat

Este documento detalla el ciclo de vida técnico de las dos funciones más avanzadas de la aplicación, conectando el frontend con la infraestructura de Supabase.

---

## 1. Ciclo de Análisis de Comidas con IA

El objetivo es transformar una imagen capturada por el usuario en datos nutricionales precisos en menos de 5 segundos.

### Flujo de Datos
1.  **Captura (Mobile)**: `useAIAnalysis.ts` usa `expo-image-picker` para obtener una imagen de alta calidad (0.8 quality p/ eficiencia).
2.  **Almacenamiento (Supabase Storage)**: La imagen se sube al bucket `meal-images`. El nombre del archivo sigue el patrón `${userId}/${timestamp}.jpg` para evitar colisiones.
3.  **Invocación (Edge Function)**: Se llama a `analyze-meal`. Pasamos el `imageUrl` público y el `userId`.
4.  **IA (Gemini 2.0 Flash)**: La Edge Function utiliza el modelo de Google para:
    -   Detectar ingredientes visualmente.
    -   Estimar porciones y calorías.
    -   Generar un JSON estructurado.
5.  **Persistencia**: La función guarda el registro en la tabla `meals` antes de responder al móvil para asegurar que el historial se actualice inmediatamente.

### Seguridad
-   El bucket de imágenes tiene RLS (Row Level Security) para que los usuarios solo puedan ver sus propias fotos.
-   La Edge Function usa una "Service Role Key" para guardar datos, protegiendo la integridad del esquema.

---

## 2. Ciclo de Suscripciones con MercadoPago

Implementación de un sistema de pagos "Checkout Pro" para Chile/LATAM.

### Flujo de Pago
1.  **Preferencia**: El móvil llama a `create-mp-preference` con el tipo de plan (Mensual/Anual).
2.  **MercadoPago API**: La función crea una "Preference" en los servidores de MP e incluye:
    -   `external_reference`: El `userId` (crucial para el webhook).
    -   `notification_url`: El endpoint del webhook de NotFat.
3.  **Redirección**: El móvil recibe un `init_point` y abre el navegador del sistema para completar el pago de forma segura.
4.  **Confirmación (Webhook)**: MercadoPago envía un POST a `mp-webhook` cuando el pago cambia de estado.
5.  **Activación**: 
    -   Si el pago es `approved`, la función actualiza el campo `subscription_status` a `Premium` en la tabla `profiles`.
    -   El móvil, al detectar el cambio de estado (vía suscripción de Realtime o React Query), desbloquea las funciones premium instantáneamente.

---

## 🛠️ Configuración Pendiente (Action Items)

| Feature | Variable de Entorno Requerida | Edge Function |
| :--- | :--- | :--- |
| **IA** | `GOOGLE_GEMINI_API_KEY` | `analyze-meal` |
| **MP** | `MERCADOPAGO_ACCESS_TOKEN` | `create-mp-preference` |
| **MP** | `SUPABASE_PROJECT_URL` | `create-mp-preference` |

> [!TIP]
> Para testear el Webhook localmente puedes usar herramientas como **ngrok** o el comando `supabase functions serve --no-verify-jwt`.
