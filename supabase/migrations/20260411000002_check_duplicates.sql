-- Ver duplicados
SELECT role, content, created_at, COUNT(*) 
FROM coach_messages 
WHERE user_id = '85548e55-8210-4701-8330-6360c550d296'
GROUP BY role, content, created_at 
HAVING COUNT(*) > 1;

-- O eliminar todos los mensajes y empezar de nuevo
-- DELETE FROM coach_messages WHERE user_id = '85548e55-8210-4701-8330-6360c550d296';