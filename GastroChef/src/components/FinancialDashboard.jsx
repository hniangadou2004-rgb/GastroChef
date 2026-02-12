import { useMemo } from "react";

import { useGame } from "../context/GameContext";

function SimpleLineChart({ values }) {
    if (!values.length) {
        return <p className="text-sm opacity-70">No data available.</p>;
    }

    const max = Math.max(...values);
    const min = Math.min(...values);
    const rawRange = Math.max(max - min, 1);
    const roughStep = rawRange / 4;
    const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
    const normalizedStep = roughStep / magnitude;

    const niceStep =
        normalizedStep <= 1
            ? 1
            : normalizedStep <= 2
                ? 2
                : normalizedStep <= 5
                    ? 5
                    : 10;

    const step = niceStep * magnitude;
    let lowerBound = Math.floor(min / step) * step;
    let upperBound = lowerBound + step * 4;

    while (upperBound < max) {
        lowerBound += step;
        upperBound += step;
    }

    while (lowerBound > min) {
        lowerBound -= step;
        upperBound -= step;
    }

    const range = Math.max(upperBound - lowerBound, step * 4);

    const points = values
        .map((v, i) => {
            const x = (i / Math.max(values.length - 1, 1)) * 100;
            const y = 100 - ((v - lowerBound) / range) * 100;
            return `${x},${y}`;
        })
        .join(" ");

    const yTicks = [0, 1, 2, 3, 4].map((stepIndex) => upperBound - (step * stepIndex));

    return (
        <div className="w-full">
            <div className="flex gap-2">
                <div className="flex h-44 flex-col justify-between text-xs opacity-70 pt-2 pb-2">
                    {yTicks.map((value, index) => (
                        <span key={index}>{new Intl.NumberFormat("en-US").format(Math.round(value))}$</span>
                    ))}
                </div>
                <div className="relative h-44 w-full rounded-lg bg-base-200 p-2">
                    <svg viewBox="0 0 100 100" className="h-full w-full">
                        {[0, 1, 2, 3, 4].map((stepIndex) => {
                            const y = stepIndex * 25;
                            return <line key={`y-${stepIndex}`} x1="0" y1={y} x2="100" y2={y} stroke="rgba(148,163,184,0.35)" strokeWidth="0.7" />;
                        })}
                        {[0, 1, 2, 3, 4].map((stepIndex) => {
                            const x = stepIndex * 25;
                            return <line key={`x-${stepIndex}`} x1={x} y1="0" x2={x} y2="100" stroke="rgba(148,163,184,0.2)" strokeWidth="0.5" />;
                        })}
                        <polyline fill="none" stroke="currentColor" strokeWidth="2.3" points={points} className="text-primary" />
                    </svg>
                </div>
            </div>
        </div>
    );
}

function SimpleBarChart({ items }) {
    if (!items.length) {
        return <p className="text-sm opacity-70">No expenses.</p>;
    }

    const max = Math.max(...items.map((i) => i.value), 1);

    return (
        <div className="space-y-2">
            {items.map((item) => (
                <div key={item.label}>
                    <div className="flex justify-between text-sm">
                        <span>{item.label}</span>
                        <span>{item.value}💰</span>
                    </div>
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

        if (!ordered.length) {
            return [treasury];
        }

        const totalDelta = ordered.reduce((sum, tx) => sum + tx.amount, 0);
        let runningTreasury = treasury - totalDelta;

        return ordered.map((tx) => {
            runningTreasury += tx.amount;
            return runningTreasury;
        });
    }, [transactions, treasury]);

    const expenseBreakdown = useMemo(() => {
        const map = {};

        transactions
            .filter((tx) => tx.category === "expense")
            .forEach((tx) => {
                const key = tx.type;
                map[key] = (map[key] || 0) + Math.abs(tx.amount);
            });

        return Object.entries(map).map(([label, value]) => ({ label, value }));
    }, [transactions]);

    return (
        <div className="card bg-base-100 shadow p-4 space-y-4">
            <h2 className="card-title">📊 Financial Dashboard</h2>

            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Live Treasury</div>
                    <div className="stat-value text-success">{treasury} 💰</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
                <div className="w-full">
                    <h3 className="font-semibold mb-2">Treasury Evolution</h3>
                    <SimpleLineChart values={treasuryEvolution} />
                </div>

                <div className="w-full">
                    <h3 className="font-semibold mb-2">Expense Breakdown</h3>
                    <SimpleBarChart items={expenseBreakdown} />
                </div>
            </div>

            <div>
                <h3 className="font-semibold mb-2">Net Margin by Sold Dish</h3>
                <div className="overflow-x-auto">
                    <table className="table table-zebra">
                        <thead>
                            <tr>
                                <th>Dish</th>
                                <th>Sold</th>
                                <th>Recipe Price</th>
                                <th>Price / Dish</th>
                                <th>Margin / Dish</th>
                                <th>Total Net Profit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {margins.length === 0 ? (
                                <tr>
                                    <td colSpan="5">No sales yet.</td>
                                </tr>
                            ) : (
                                margins.map((item) => (
                                    <tr key={item.recipeName}>
                                        <td>{item.recipeName}</td>
                                        <td>{item.sold}</td>
                                        <td>{(Math.round((item.recipePrice || 0) * 100) / 100) - (Math.round(item.marginPerDish * 100) / 100)}💰</td>
                                        <td>{Math.round((item.recipePrice || 0) * 100) / 100}💰</td>
                                        <td>{Math.round(item.marginPerDish * 100) / 100}💰</td>
                                        <td>{Math.round(item.netProfit * 100) / 100}💰</td>
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
