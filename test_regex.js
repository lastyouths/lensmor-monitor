const fs = require('fs');
const htmlContent = fs.readFileSync('test_sandbox.html', 'utf8');

const truncatedContent = htmlContent
  .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
  .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
  .replace(/<[^>]+>/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()
  .substring(0, 12000);

console.log("Length:", truncatedContent.length);
console.log("Preview:", truncatedContent.substring(0, 100));
