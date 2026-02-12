const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
        type: {
            type: String,
            enum: ["BUY_INGREDIENT", "ORDER_SERVED", "ORDER_TIMEOUT", "LAB_EXPERIMENT"],
            required: true
        },
        amount: { type: Number, required: true },
        category: { type: String, enum: ["income", "expense"], required: true },
        metadata: { type: Object, default: {} }
    },
    { timestamps: true }
);

module.exports = mongoose.model("Transaction", TransactionSchema);
