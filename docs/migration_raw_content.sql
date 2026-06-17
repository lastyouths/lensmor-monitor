-- 新增 raw_content 列，用于存储每次 Jina 抓取的完整 Markdown 原文
-- 供下次分析时直接作为 diff 基准使用
ALTER TABLE reports ADD COLUMN IF NOT EXISTS raw_content text;
