import { useMemo } from "react";
import { useGame } from "../context/GameContext";

function SimpleLineChart({ values }) {
  if (!values.length) return <p className="text-sm opacity-70">Pas de données</p>;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = Math.max(max - min, 1);
  const points = values
    .map((v, i) => `${(i / Math.max(values.length - 1, 1)) * 100},${100 - ((v - min) / range) * 100}`)
    .join(" ");

  return (
    <svg viewBox="0 0 100 100" className="w-full h-36 bg-base-200 rounded-lg">
      <polyline fill="none" stroke="currentColor" strokeWidth="2" points={points} className="text-primary" />
    </svg>
  );
}

function SimpleBarChart({ items }) {
  if (!items.length) return <p className="text-sm opacity-70">Pas de dépenses</p>;
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.label}>
          <div className="flex justify-between text-sm"><span>{item.label}</span><span>{item.value}💰</span></div>
          <progress className="progress progress-error w-full" value={item.value} max={max} />
        </div>
      ))}
    </div>
  );
}

function FinancialDashboard() {
  const { treasury, transactions, margins } = useGame();

  const treasuryEvolution = useMemo(() => {
    const ordered = [...transactions].reverse();
    let running = 100;
    return ordered.map((tx) => {
      running += tx.amount;
      return running;
    });
  }, [transactions]);

  const expenseBreakdown = useMemo(() => {
    const map = {};
    transactions.filter((tx) => tx.category === "expense").forEach((tx) => {
      const key = tx.type;
      map[key] = (map[key] || 0) + Math.abs(tx.amount);
    });
    return Object.entries(map).map(([label, value]) => ({ label, value }));
  }, [transactions]);

  return (
    <div className="card bg-base-100 shadow p-4 space-y-4">
      <h2 className="card-title">📊 Dashboard Financier</h2>

      <div className="stats shadow">
        <div className="stat">
          <div className="stat-title">Trésorerie temps réel</div>
          <div className="stat-value text-success">{treasury} 💰</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="font-semibold mb-2">Évolution Trésorerie</h3>
          <SimpleLineChart values={treasuryEvolution} />
        </div>
        <div>
          <h3 className="font-semibold mb-2">Répartition Dépenses</h3>
          <SimpleBarChart items={expenseBreakdown} />
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Marge nette par plat vendu</h3>
        <div className="overflow-x-auto">
          <table className="table table-zebra">
            <thead>
              <tr>
                <th>Plat</th>
                <th>Vendus</th>
                <th>Bénéfice net</th>
                <th>Marge / plat</th>
              </tr>
            </thead>
            <tbody>
              {margins.length === 0 ? (
                <tr><td colSpan="4">Aucune vente pour l'instant.</td></tr>
              ) : (
                margins.map((item) => (
                  <tr key={item.recipeName}>
                    <td>{item.recipeName}</td>
                    <td>{item.sold}</td>
                    <td>{Math.round(item.netProfit * 100) / 100}💰</td>
                    <td>{Math.round(item.marginPerDish * 100) / 100}💰</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default FinancialDashboard;
