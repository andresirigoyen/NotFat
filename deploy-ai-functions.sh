#!/bin/bash

echo "🚀 Desplegando funciones de NotFat AI con Gemini Pro..."

# Desplegar función de chat
echo "📝 Desplegando función ai-chat..."
supabase functions deploy ai-chat --no-verify-jwt

# Desplegar función de generación de recetas
echo "🍳 Desplegando función generate-recipe..."
supabase functions deploy generate-recipe --no-verify-jwt

echo ""
echo "✅ Funciones desplegadas exitosamente!"
echo ""
echo "🎉 NotFat AI con Gemini Pro está listo!"
echo ""
echo "📋 Funciones disponibles:"
echo "   • ai-chat: Conversaciones con IA nutricional"
echo "   • generate-recipe: Generación de recetas personalizadas"
echo "   • analyze-meal: Análisis de imágenes (ya existente)"
echo ""
echo "🔗 Tu NotFat AI ahora está conectado con Gemini Pro!"
