-- Coach messages RLS - minimal version
ALTER TABLE IF EXISTS coach_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coach messages" ON coach_messages;
CREATE POLICY "Users can view own coach messages" ON coach_messages FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own coach messages" ON coach_messages;
CREATE POLICY "Users can insert own coach messages" ON coach_messages FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own coach messages" ON coach_messages;
CREATE POLICY "Users can delete own coach messages" ON coach_messages FOR DELETE USING (auth.uid() = user_id);