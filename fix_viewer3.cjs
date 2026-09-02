const fs = require('fs');

function replace(file, search, replaceWith) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(search, replaceWith);
  fs.writeFileSync(file, content);
}

replace('src/components/PortfolioView.tsx', 
  "export function PortfolioView({ isEs }: { isEs: boolean }) {", 
  "import { DocumentViewerModal } from './DocumentViewerModal';\n\nexport function PortfolioView({ isEs }: { isEs: boolean }) {");

replace('src/components/PortfolioView.tsx', 
  "const [isModalOpen, setIsModalOpen] = useState(false);", 
  "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);");

replace('src/components/CRMView.tsx', 
  "export function CRMView({ isEs }: { isEs: boolean }) {", 
  "import { DocumentViewerModal } from './DocumentViewerModal';\n\nexport function CRMView({ isEs }: { isEs: boolean }) {");

replace('src/components/CRMView.tsx', 
  "const [isModalOpen, setIsModalOpen] = useState(false);", 
  "const [isModalOpen, setIsModalOpen] = useState(false);\n  const [viewingDoc, setViewingDoc] = useState<{url: string, name: string} | null>(null);");

console.log('Fixed imports and states directly');
