require("dotenv").config();
const mongoose = require("mongoose");
const Save = require("../models/Save");
const Recipe = require("../models/Recipe");

// Put your user ID and restaurant name here
const USER_ID = "698c7fc40d03c9fea1149330";
const RESTAURANT_NAME = "testResto";

const runCheat = async () => {
    try {
        await mongoose.connect(
            process.env.MONGO_URI || "mongodb://localhost:27017/GastroChef"
        );

        const recipeIds = (await Recipe.find({}, "_id")).map((r) => r._id);

        const save = await Save.findOneAndUpdate(
            { user: USER_ID },
            {
                $set: {
                    restaurantName: RESTAURANT_NAME,
                    learnedRecipes: recipeIds
                },
                $setOnInsert: {
                    satisfaction: 20
                }
            },
            { upsert: true, new: true }
        ).populate("learnedRecipes", "name");

        console.log("✅ Toutes les recettes ont été débloquées !");
        console.log(`👤 User: ${USER_ID}`);
        console.log(`🍽️ Restaurant: ${save.restaurantName}`);
        console.log(`📖 Recettes débloquées: ${save.learnedRecipes.length}`);
        save.learnedRecipes.forEach((recipe) => console.log(`- ${recipe.name}`));
    } catch (err) {
        console.error("❌ Erreur cheat", err);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

runCheat();
