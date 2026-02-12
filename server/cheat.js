require("dotenv").config();

const mongoose = require("mongoose");

const Save = require("./models/Save");
const Recipe = require("./models/Recipe");

const USER_ID = "000000000000000000000000";
const RESTAURANT_NAME = "My Restaurant";

const runCheat = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/GastroChef");

        const recipeIds = (await Recipe.find({}, "_id")).map((r) => r._id);

        const save = await Save.findOneAndUpdate(
            {
                user: USER_ID
            },
            {
                $set: {
                    restaurantName: RESTAURANT_NAME,
                    learnedRecipes: recipeIds
                },
                $setOnInsert: {
                    satisfaction: 20,
                    treasury: 100,
                    inventory: {}
                }
            },
            {
                upsert: true,
                new: true
            }
        ).populate("learnedRecipes", "name");

        console.log("All recipes have been unlocked.");
        console.log(`User: ${USER_ID}`);
        console.log(`Restaurant: ${save.restaurantName}`);
        console.log(`Unlocked recipes: ${save.learnedRecipes.length}`);
        save.learnedRecipes.forEach((recipe) => console.log(`- ${recipe.name}`));
    } catch (error) {
        console.error("Cheat command failed.", error);
        process.exitCode = 1;
    } finally {
        await mongoose.connection.close();
    }
};

runCheat();
