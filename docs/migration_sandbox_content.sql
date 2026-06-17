-- sandbox 内容持久化表（在 Supabase SQL Editor 执行）
CREATE TABLE IF NOT EXISTS sandbox_content (
  id text PRIMARY KEY DEFAULT 'default',
  content jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 插入默认空行，防止首次读取 404
INSERT INTO sandbox_content (id, content)
VALUES ('default', '{}')
ON CONFLICT (id) DO NOTHING;
