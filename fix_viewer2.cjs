const fs = require('fs');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Ensure import
  if (!content.includes('DocumentViewerModal')) {
    content = content.replace("import {", "import { DocumentViewerModal } from './DocumentViewerModal';\nimport {");
  }

  // Ensure state
  if (!content.includes('setViewingDoc')) {
    content = content.replace(/const \[isModalOpen, setIsModalOpen\] = useState\(false\);/, "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);");
    // CRMView.tsx
    content = content.replace(/const \[viewMode, setViewMode\] = useState/, "const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);\n  const [viewMode, setViewMode] = useState");
  }

  fs.writeFileSync(filePath, content);
}

fix('src/components/PortfolioView.tsx');
fix('src/components/CRMView.tsx');
console.log('Fixed states');
