import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { fetchIngredients } from "../api/ingredients.api";

const GameContext = createContext(null);

export function GameProvider({ children }) {
  const [ingredients, setIngredients] = useState([]);
  const [loadingIngredients, setLoadingIngredients] = useState(true);
  const [knownRecipes, setKnownRecipes] = useState([]);
  const [satisfaction, setSatisfaction] = useState(20);
  const [treasury, setTreasury] = useState(100);
  const [inventory, setInventory] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [margins, setMargins] = useState([]);

  const token = localStorage.getItem("token");

  // ====================== Load ingredients ======================
  useEffect(() => {
    const loadIngredients = async () => {
      try {
        const data = await fetchIngredients();
        setIngredients(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoadingIngredients(false);
      }
    };
    loadIngredients();
  }, []);

  // ====================== Load player save ======================
  const loadSave = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/save", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setKnownRecipes([]);
        return;
      }
      const data = await res.json();
      setKnownRecipes(data.learnedRecipes || []);
      setSatisfaction(data.satisfaction ?? 20);
      setTreasury(data.treasury ?? 100);
      setInventory(data.inventory || {});
    } catch (error) {
      console.error("Erreur chargement save:", error);
    }
  };

  // ====================== Load economy overview ======================
  const loadEconomy = async () => {
    if (!token) return;
    try {
      const res = await fetch("http://localhost:5000/api/economy/overview", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Impossible de charger l'économie");
      const data = await res.json();

      setTreasury(data.treasury ?? 0);
      setSatisfaction(data.satisfaction ?? 20);
      setTransactions(data.transactions || []);
      setMargins(data.margins || []);

      const stockMap = {};
      (data.stock || []).forEach((item) => {
        stockMap[item._id] = item.quantity;
      });
      setInventory(stockMap);
    } catch (err) {
      console.error(err);
    }
  };

  // ====================== Load save + economy on mount ======================
  useEffect(() => {
    if (!token) return;
    loadSave();
    loadEconomy();
  }, [token]);

  // ====================== Actions ======================
  const discoverRecipe = (recipe) => {
    if (!recipe) return;
    setKnownRecipes((prev) => {
      const recipeId = recipe._id?.toString();
      const alreadyKnown = prev.some(
        (r) => r._id?.toString() === recipeId
      );
      return alreadyKnown ? prev : [...prev, recipe];
    });
  };

  const buyIngredient = async (ingredientId, quantity = 1) => {
    if (!token) return;

    try {
      const res = await fetch("http://localhost:5000/api/economy/buy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ingredientId, quantity })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Erreur achat");

      setTreasury(data.treasury);
      setInventory((prev) => ({
        ...prev,
        [data.ingredientId]: Number(prev[data.ingredientId] || 0) + data.quantityAdded
      }));

      await loadEconomy();
      return data;
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const updateEconomyFromSocket = ({ treasury: nextTreasury, satisfaction: nextSatisfaction }) => {
    if (typeof nextTreasury === "number") setTreasury(nextTreasury);
    if (typeof nextSatisfaction === "number") setSatisfaction(nextSatisfaction);
    loadEconomy();
  };

  // ====================== Computed state ======================
  const ingredientStock = useMemo(
    () =>
      ingredients.map((ingredient) => ({
        ...ingredient,
        quantity: Number(inventory?.[ingredient._id] || 0)
      })),
    [ingredients, inventory]
  );

  return (
    <GameContext.Provider
      value={{
        ingredients,
        ingredientStock,
        loadingIngredients,
        knownRecipes,
        discoverRecipe,
        satisfaction,
        setSatisfaction,
        treasury,
        inventory,
        transactions,
        margins,
        buyIngredient,
        loadEconomy,
        updateEconomyFromSocket
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export const useGame = () => useContext(GameContext);
