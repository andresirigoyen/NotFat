import { useState } from 'react';

export const useAIChat = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (message: string) => {
    console.log('🚀 sendMessage called with:', message)
    if (!message.trim()) {
      console.log('❌ Empty message, returning null')
      return null;
    }

    setLoading(true);
    setError(null);
    console.log('📡 Starting API call...')

    try {
      // Llamada directa sin autenticación para probar
      const testResponse = await fetch('https://jcfezqakxulmtdvioxbc.supabase.co/functions/v1/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Sin Authorization header para probar
        },
        body: JSON.stringify({ message })
      });

      console.log('📡 Test API call status:', testResponse.status)
      
      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        console.log('❌ Error response:', errorText);
        throw new Error(`HTTP ${testResponse.status}: ${errorText}`)
      }

      const data = await testResponse.json()
      console.log('📊 Test API response:', data)

      if (data.error) {
        throw new Error(data.error)
      }

      return data.response;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al conectar con la IA';
      setError(errorMessage);
      console.error('❌ AI Chat Error:', err);
      
      // Devolver mensaje de error en lugar de null
      return `Lo siento, tuve un problema: ${errorMessage}. Por favor intenta de nuevo.`;
    } finally {
      setLoading(false);
    }
  };

  const generateRecipe = async (ingredients: string) => {
    if (!ingredients.trim()) return null;

    setLoading(true);
    setError(null);

    try {
      const testResponse = await fetch('https://jcfezqakxulmtdvioxbc.supabase.co/functions/v1/generate-recipe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Sin Authorization header para probar
        },
        body: JSON.stringify({ ingredients })
      });

      if (!testResponse.ok) {
        const errorText = await testResponse.text();
        throw new Error(`HTTP ${testResponse.status}: ${errorText}`)
      }

      const data = await testResponse.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      return data.recipe;
    } catch (err: any) {
      setError(err.message || 'Error al generar receta');
      console.error('❌ Recipe Generation Error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    sendMessage,
    generateRecipe,
    loading,
    error,
  };
};
