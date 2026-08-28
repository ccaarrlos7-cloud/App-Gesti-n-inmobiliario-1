const fs = require('fs');

const file = 'src/components/PortfolioView.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('const [showSettings, setShowSettings]')) {
  content = content.replace(
    "const [search, setSearch] = useState('');",
    "const [search, setSearch] = useState('');\n  const [showSettings, setShowSettings] = useState(false);\n  const { userName, avatarUrl } = useAppContext();"
  );
}

fs.writeFileSync(file, content);
console.log('Portfolio updated');
