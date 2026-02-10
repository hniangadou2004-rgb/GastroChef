const recipesPool = [
  // 🟢 Recettes simples (découverte facile)
  {
    name: "Pizza Margherita",
    ingredients: ["Tomate", "Fromage", "Pâte"]
  },
  {
    name: "Burger Classique",
    ingredients: ["Pain", "Steak", "Fromage"]
  },
  {
    name: "Croque Monsieur",
    ingredients: ["Pain", "Fromage", "Jambon"]
  },

  // 🟡 Recettes intermédiaires
  {
    name: "Pasta Bolognese",
    ingredients: ["Pâtes", "Tomate", "Viande"]
  },
  {
    name: "Salade César",
    ingredients: ["Laitue", "Poulet", "Croutons", "Fromage"]
  },
  {
    name: "Tacos Boeuf",
    ingredients: ["Galette", "Viande", "Fromage", "Sauce"]
  },

  // 🔴 Recettes avancées (plus d’ingrédients)
  {
    name: "Burger Gourmet",
    ingredients: ["Pain", "Steak", "Fromage", "Oignon", "Sauce"]
  },
  {
    name: "Pizza 4 Fromages",
    ingredients: ["Pâte", "Fromage", "Fromage Bleu", "Mozzarella", "Parmesan"]
  },
  {
    name: "Ramen",
    ingredients: ["Nouilles", "Bouillon", "Oeuf", "Porc"]
  },

  // 🟣 Recette légendaire (lore)
  {
    name: "Soupe de l'Émeraude",
    ingredients: ["Bouillon", "Herbes", "Légume Mystère"]
  }
];

module.exports = { recipesPool };
