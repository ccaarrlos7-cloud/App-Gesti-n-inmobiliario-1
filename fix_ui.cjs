const fs = require('fs');

// 1. Fix PortfolioView
let portfolioContent = fs.readFileSync('src/components/PortfolioView.tsx', 'utf8');

const oldPriceSpan = `<span className="font-bold text-slate-900 text-[15px]">{formatNumber(p.price)} €<span className="font-normal text-[11px] text-slate-500">/mes</span></span>`;
const newPriceSpan = `<span className="font-bold text-slate-900 text-[15px]">
                      {p.status === 'En Venta' ? (
                        <>{formatNumber(p.marketValue || p.price)} €</>
                      ) : (
                        <>{formatNumber(p.price)} €<span className="font-normal text-[11px] text-slate-500">/mes</span></>
                      )}
                    </span>`;

portfolioContent = portfolioContent.replace(oldPriceSpan, newPriceSpan);
fs.writeFileSync('src/components/PortfolioView.tsx', portfolioContent);

// 2. Fix DashboardView chart visibility
let dashContent = fs.readFileSync('src/components/DashboardView.tsx', 'utf8');
dashContent = dashContent.replace(
  '<div className="flex-1 w-full relative">',
  '<div className="flex-1 w-full relative min-h-[300px]">'
);
fs.writeFileSync('src/components/DashboardView.tsx', dashContent);

console.log('UI issues fixed');
