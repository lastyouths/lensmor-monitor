// POC D1 Research: 验证 Jina Reader 的连通性
const urlToFetch = process.argv[2] || "https://supabase.com/";

async function testJinaReader(url) {
  console.log(`\n[Test] 正在使用 Jina Reader 抓取: ${url}`);
  try {
    const jinaUrl = `https://r.jina.ai/${url}`;
    const response = await fetch(jinaUrl, {
      method: "GET",
      // 可选：添加 X-Return-Format: markdown
    });
    
    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }
    
    const text = await response.text();
    console.log(`[Success] 成功获取 Markdown 内容，长度: ${text.length} 字符.`);
    console.log(`[Preview] 内容预览:\n${text.substring(0, 300)}...\n`);
    return true;
  } catch (error) {
    console.error(`[Error] 抓取失败: ${error.message}`);
    return false;
  }
}

testJinaReader(urlToFetch);
