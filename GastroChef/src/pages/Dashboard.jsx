import Navbar from "../components/Navbar.jsx";
import Stock from "../components/Stock.jsx";
import Marketplace from "../components/Marketplace.jsx";
import Laboratory from "../components/Laboratory.jsx";
import RecipeBook from "../components/RecipeBook.jsx";
import ServicePanel from "../components/ServicePanel.jsx";
import { useState } from "react";
import FinancialDashboard from "../components/FinancialDashboard.jsx";

function Dashboard() {
    const [refreshRecipes, setRefreshRecipes] = useState(0);

    const handleDiscover = () => setRefreshRecipes((prev) => prev + 1);

    return (
        <div className="min-h-screen bg-base-200">
            <div className="mx-auto w-full max-w-7xl p-3 md:p-5 space-y-5">
                <Navbar />

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                    <Stock />
                    <Marketplace />
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
                    <Laboratory onDiscover={handleDiscover} />
                    <ServicePanel />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <RecipeBook key={refreshRecipes} />
                    <FinancialDashboard />
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
