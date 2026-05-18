const fs = require('fs');
const files = ['supabase/migrations/20260510_support_chat.sql', 'supabase/migrations/20260517_b2b_chat_referrals.sql'];
files.forEach(f => {
  let text = fs.readFileSync(f, 'utf8');
  text = text.replace(/CREATE POLICY "([^"]+)"\s+ON ([^\s]+)/g, 'DROP POLICY IF EXISTS "$1" ON $2;\nCREATE POLICY "$1" ON $2');
  fs.writeFileSync(f, text);
});
