-- BUG-01 fix: 反馈持久化表
-- 在 Supabase SQL Editor 中执行此脚本

CREATE TABLE IF NOT EXISTS report_feedbacks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL,
  type        text NOT NULL CHECK (type IN ('useful', 'wrong', 'not_important')),
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (report_id, user_id)
);

-- 如果已开启 RLS，需同步添加策略（POC 可先禁用 RLS）
-- ALTER TABLE report_feedbacks DISABLE ROW LEVEL SECURITY;
