const fs = require('fs');

function fix(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Fix PortfolioView.tsx DocumentViewerModal case
  if (filePath.includes('PortfolioView')) {
    content = content.replace("import { DocumentViewerModal } from './DocumentViewerModal';\nimport { DocumentViewerModal } from './DocumentViewerModal';\n\nexport function PortfolioView({ isEs }: { isEs: boolean }) {", "import { DocumentViewerModal } from './DocumentViewerModal';\n\nexport function PortfolioView({ isEs }: { isEs: boolean }) {");
  }

  // Fix CRMView.tsx import and state
  if (filePath.includes('CRMView')) {
    if (!content.includes("import { DocumentViewerModal } from './DocumentViewerModal';")) {
      content = content.replace("export function CRMView({ isEs }: { isEs: boolean }) {", "import { DocumentViewerModal } from './DocumentViewerModal';\n\nexport function CRMView({ isEs }: { isEs: boolean }) {");
    }
    if (!content.includes("const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);")) {
      content = content.replace("const [isModalOpen, setIsModalOpen] = useState(false);", "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);");
    }
  }

  fs.writeFileSync(filePath, content);
}

fix('src/components/PortfolioView.tsx');
fix('src/components/CRMView.tsx');
console.log('Fixed imports and states');
