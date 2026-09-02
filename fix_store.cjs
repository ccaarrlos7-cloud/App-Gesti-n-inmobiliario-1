const fs = require('fs');

const file = 'src/store.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "await supabase.from('profiles').update({ name }).eq('id', session.user.id);",
  "await supabase.from('profiles').upsert({ id: session.user.id, name }, { onConflict: 'id' });"
);

content = content.replace(
  "await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id);",
  "await supabase.from('profiles').upsert({ id: session.user.id, avatar_url: url }, { onConflict: 'id' });"
);

fs.writeFileSync(file, content);
console.log('Fixed profile updates');
