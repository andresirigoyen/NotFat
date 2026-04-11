-- Tabla: user_activity_profile
CREATE TABLE IF NOT EXISTS user_activity_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  activity_level VARCHAR(50),
  daily_steps INTEGER DEFAULT 0,
  weekly_workouts INTEGER DEFAULT 0,
  last_active_date DATE,
  preferences JSONB DEFAULT '{}'::jsonb
);

-- Tabla: daily_tips
CREATE TABLE IF NOT EXISTS daily_tips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(50),
  is_active BOOLEAN DEFAULT true
);

-- Tabla: coach_insights
CREATE TABLE IF NOT EXISTS coach_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  insight_type VARCHAR(50),
  title VARCHAR(255),
  content TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Insertar algunos tips iniciales
INSERT INTO daily_tips (title, content, category) VALUES
('Hidratación', 'Bebe al menos 8 vasos de agua al día para mantenerte hidratado.', 'hydration'),
('Más proteína', 'Añade proteína a cada comida para mantenerte satisfecho más tiempo.', 'nutrition'),
('Duerme bien', 'Intenta dormir 7-8 horas para una mejor recuperación.', 'sleep'),
('Movimiento', 'Camina 10 minutos después de comer para mejorar la digestión.', 'activity');

-- Habilitar RLS
ALTER TABLE user_activity_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_insights ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own activity" ON user_activity_profile FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own activity" ON user_activity_profile FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can view tips" ON daily_tips FOR SELECT USING (true);
CREATE POLICY "Users can view own insights" ON coach_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON coach_insights FOR INSERT WITH CHECK (auth.uid() = user_id);