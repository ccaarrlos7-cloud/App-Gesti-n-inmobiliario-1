const fs = require('fs');

const file = 'src/components/CalculatorView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('import SettingsModal')) {
  content = content.replace(
    "import { formatNumber } from '../utils';",
    "import { formatNumber } from '../utils';\nimport SettingsModal from './SettingsModal';\nimport { User } from 'lucide-react';"
  );
}

if (!content.includes('const [showSettings, setShowSettings]')) {
  content = content.replace(
    "const isEs = language === 'Español';",
    "const isEs = language === 'Español';\n  const [showSettings, setShowSettings] = useState(false);\n  const { userName, avatarUrl } = useAppContext();"
  );
}

const newHeader = `
      <header className="min-h-[64px] py-3 bg-white border-b border-slate-200 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[18px] font-semibold text-slate-900 flex items-center gap-2 hidden sm:flex">
          <Calculator size={20} className="text-blue-600" />
          {isEs ? 'Calculadora' : 'Calculator'}
        </h1>
        
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
          <h1 className="text-[18px] font-semibold text-slate-900 flex items-center gap-2 sm:hidden">
            <Calculator size={20} className="text-blue-600" />
            {isEs ? 'Calculadora' : 'Calculator'}
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Placeholder invisible para igualar el espaciado si los otros tienen botón */}
          <div className="w-[40px] sm:w-[150px] invisible hidden md:block"></div>
          
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

if (!content.includes('<SettingsModal isOpen={showSettings}')) {
  content = content.replace(
    '    </div>\n  );\n}',
    '      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} />\n    </div>\n  );\n}'
  );
}

fs.writeFileSync(file, content);
console.log('Calculator updated');
