#!/bin/bash

# Script para configurar Google Gemini Pro en NotFat AI
echo "🤖 Configurando Google Gemini Pro para NotFat AI..."
echo ""

# Verificar si .env.local existe
if [ ! -f .env.local ]; then
    echo "📝 Creando archivo .env.local..."
    cp .env.example .env.local
    echo "✅ Archivo .env.local creado"
fi

# Solicitar API Key de Gemini
echo ""
echo "🔑 Necesito tu Google Gemini API Key"
echo "📍 Obtén tu API key aquí: https://makersuite.google.com/app/apikey"
echo ""
read -p "Pega tu Google Gemini API Key: " GEMINI_KEY

if [ -z "$GEMINI_KEY" ]; then
    echo "❌ Error: No proporcionaste una API key"
    exit 1
fi

# Actualizar .env.local con la API key
echo ""
echo "💾 Configurando API key en .env.local..."

# Verificar si GOOGLE_GEMINI_API_KEY ya existe
if grep -q "GOOGLE_GEMINI_API_KEY=" .env.local; then
    # Reemplazar la línea existente
    sed -i '' "s/GOOGLE_GEMINI_API_KEY=.*/GOOGLE_GEMINI_API_KEY=\"$GEMINI_KEY\"/" .env.local
else
    # Agregar nueva línea
    echo "GOOGLE_GEMINI_API_KEY=\"$GEMINI_KEY\"" >> .env.local
fi

echo "✅ API Key configurada"

# Verificar configuración de modelo
if grep -q "DEFAULT_LLM_MODEL=" .env.local; then
    sed -i '' "s/DEFAULT_LLM_MODEL=.*/DEFAULT_LLM_MODEL=\"gemini-2.0-flash\"/" .env.local
else
    echo "DEFAULT_LLM_MODEL=\"gemini-2.0-flash\"" >> .env.local
fi

echo "✅ Modelo configurado a gemini-2.0-flash"

# Verificar feature flags
if grep -q "ENABLE_AI_FEATURES=" .env.local; then
    sed -i '' "s/ENABLE_AI_FEATURES=.*/ENABLE_AI_FEATURES=\"true\"/" .env.local
else
    echo "ENABLE_AI_FEATURES=\"true\"" >> .env.local
fi

echo "✅ Features de IA habilitados"

echo ""
echo "🎉 ¡Configuración completada!"
echo ""
echo "📋 Resumen:"
echo "   ✅ Google Gemini Pro conectado"
echo "   ✅ Modelo: gemini-2.0-flash"
echo "   ✅ API Key configurada"
echo "   ✅ Features de IA habilitados"
echo ""
echo "🚀 Ahora puedes:"
echo "   • Escanear comidas con IA"
echo "   • Analizar imágenes con Gemini"
echo "   • Obtener recomendaciones nutricionales"
echo ""
echo "⚠️  Reinicia tu aplicación para aplicar los cambios"
