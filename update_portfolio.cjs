const fs = require('fs');

const file = 'src/components/PortfolioView.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure SettingsModal is imported
if (!content.includes('import SettingsModal')) {
  content = content.replace(
    "import { formatDate, formatNumber } from '../utils';",
    "import { formatDate, formatNumber } from '../utils';\nimport SettingsModal from './SettingsModal';\nimport { User } from 'lucide-react';"
  );
}

// Add state for SettingsModal
if (!content.includes('const [showSettings, setShowSettings]')) {
  content = content.replace(
    'const [search, setSearch] = useState("");',
    'const [search, setSearch] = useState("");\n  const [showSettings, setShowSettings] = useState(false);\n  const { userName, avatarUrl } = useAppContext();'
  );
}

// Replace header
const newHeader = `
      <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900 hidden sm:block">Portfolio</h1>
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
          <input 
            type="text" 
            placeholder="Buscar..."
            className="pl-9 pr-3 py-2 border border-slate-200 rounded-lg w-full bg-slate-50 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white p-2 sm:px-4 sm:py-2 rounded-lg font-medium text-sm transition-colors flex items-center justify-center shadow-sm shrink-0"
          >
            <Plus size={20} className="sm:hidden" />
            <span className="hidden sm:inline">+ Añadir Inmueble</span>
          </button>
          
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 border border-slate-200 hover:bg-slate-200 transition-colors overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-500" />
            )}
          </button>
        </div>
      </header>
`;

content = content.replace(/<header[\s\S]*?<\/header>/, newHeader.trim());

// Add SettingsModal component at the end
if (!content.includes('<SettingsModal isOpen={showSettings}')) {
  content = content.replace(
    '    </div>\n  );\n}',
    '      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />\n    </div>\n  );\n}'
  );
}

fs.writeFileSync(file, content);
console.log('Portfolio updated');
