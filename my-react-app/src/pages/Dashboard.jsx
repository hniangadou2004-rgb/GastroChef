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
      {/* Navbar */}
      <Navbar />

      {/* Contenu principal */}
      <div className="p-4 space-y-6">
        {/* Ligne supérieure : Stock + Marketplace */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Stock />
          <Marketplace />
        </div>

        {/* Ligne centrale : Laboratoire + ServicePanel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Laboratory onDiscover={handleDiscover} />
          <ServicePanel />
        </div>

        {/* Ligne inférieure : Livre de recettes */}
        <div>
          <RecipeBook key={refreshRecipes} />
        </div>

        <FinancialDashboard />
      </div>
    </div>
  );
}

export default Dashboard;
