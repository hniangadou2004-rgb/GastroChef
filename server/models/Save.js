const mongoose = require("mongoose");

const SaveSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            unique: true
        },
        restaurantName: {
            type: String,
            required: true
        },
        learnedRecipes: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Recipe"
            }
        ],
        satisfaction: {
            type: Number,
            default: 20
        },
        treasury: {
            type: Number,
            default: 100
        },
        inventory: {
            type: Map,
            of: Number,
            default: {}
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Save", SaveSchema);
