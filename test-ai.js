
const { createClient } = require('@supabase/supabase-js');

async function testAi() {
  const supabaseUrl = 'https://jcfezqakxulmtdvioxbc.supabase.co';
  const supabaseKey = 'sb_publishable_rK2k5id-FQeR_fS2pxe0Ig_WLFA6gAc';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  console.log('--- Probando conexión con Supabase Edge Function ---');
  
  try {
    const { data, error } = await supabase.functions.invoke('process-prompt', {
      body: { 
        message: 'Hola Coach, ¿qué me recomiendas para desayunar mañana?', 
        userId: '00000000-0000-0000-0000-000000000000' 
      }
    });

    if (error) {
      console.log('Error detectado:', error);
      if (error.message.includes('401')) {
        console.log('Nota: El error 401 es normal si las claves del .env son locales o inválidas para el CLI externo.');
      }
    } else {
      console.log('¡Respuesta de la IA recibida!');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error('Error fatal durante la prueba:', err.message);
  }
}

testAi();
