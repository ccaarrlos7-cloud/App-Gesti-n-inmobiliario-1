const fs = require('fs');

const file = 'src/components/SettingsModal.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('useEffect(() => {')) {
  content = content.replace(
    "import React, { useState, useRef } from 'react';",
    "import React, { useState, useRef, useEffect } from 'react';"
  );
  
  content = content.replace(
    "  const [tempName, setTempName] = useState(userName);",
    "  const [tempName, setTempName] = useState(userName);\n\n  useEffect(() => {\n    if (isOpen) {\n      setTempName(userName);\n    }\n  }, [isOpen, userName]);"
  );
  
  fs.writeFileSync(file, content);
  console.log('Fixed SettingsModal tempName sync');
} else {
  console.log('Already has useEffect');
}
