-- Tabla: user_usage para persistir límites diarios
CREATE TABLE IF NOT EXISTS user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  usage_date DATE DEFAULT CURRENT_DATE,
  scans_count INTEGER DEFAULT 0,
  messages_count INTEGER DEFAULT 0,
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, usage_date)
);

-- Habilitar RLS
ALTER TABLE user_usage ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Los usuarios pueden ver sus propios límites
CREATE POLICY "Users can view own usage" ON user_usage FOR SELECT USING (auth.uid() = user_id);

-- Función para incrementar contadores de forma atómica y segura
CREATE OR REPLACE FUNCTION increment_user_usage(
  target_user_id UUID,
  column_name TEXT -- 'scans_count' o 'messages_count'
) RETURNS VOID AS $$
BEGIN
  INSERT INTO user_usage (user_id, usage_date, scans_count, messages_count, last_activity)
  VALUES (
    target_user_id, 
    CURRENT_DATE, 
    CASE WHEN column_name = 'scans_count' THEN 1 ELSE 0 END,
    CASE WHEN column_name = 'messages_count' THEN 1 ELSE 0 END,
    NOW()
  )
  ON CONFLICT (user_id, usage_date) DO UPDATE SET
    scans_count = CASE WHEN column_name = 'scans_count' THEN user_usage.scans_count + 1 ELSE user_usage.scans_count END,
    messages_count = CASE WHEN column_name = 'messages_count' THEN user_usage.messages_count + 1 ELSE user_usage.messages_count END,
    last_activity = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
