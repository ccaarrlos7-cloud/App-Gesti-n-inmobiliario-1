const fs = require('fs');

const file = 'src/components/DashboardView.tsx';
let content = fs.readFileSync(file, 'utf8');

const newHeader = `
      <header className="min-h-[64px] py-3 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between px-4 sm:px-8 shrink-0">
        <h1 className="text-[20px] font-bold text-slate-900 dark:text-white hidden sm:block">{userName}</h1>
        
        <div className="relative flex-1 min-w-[150px] sm:min-w-[200px] sm:mx-4">
          <h1 className="text-[20px] font-bold text-slate-900 dark:text-white sm:hidden">{userName}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Placeholder invisible para igualar el espaciado si los otros tienen botón */}
          <div className="w-[40px] sm:w-[150px] invisible hidden md:block"></div>
          
          <button onClick={() => setShowSettings(true)} className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors overflow-hidden shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt={userName} className="w-full h-full object-cover" />
            ) : (
              <User size={20} className="text-slate-500 dark:text-slate-300" />
            )}
          </button>
        </div>
      </header>
`;

content = content.replace(/<header[\s\S]*?<\/header>/, newHeader.trim());

fs.writeFileSync(file, content);
console.log('Dashboard updated');
