import mongoose from "mongoose";

const locationSchema = new mongoose.Schema({
    location_code: {
        type: String,
        unique: true,
        require: true,
    },
    type: {
        type: String,
        enum: ["warehouse", "storage"],
        require: true
    },
    childs: [],
    products: [{
        product_code: { type: String },
        quantity: {
            type: Number,
            default: 0
        },
        volume: { type: Number }
    }]
});

const warehouseSchema = new mongoose.Schema({
    warehouse_code: {
        type: String,
        require: true,
    },
    location: [locationSchema]
});

const warehouse = mongoose.model("warehouse", warehouseSchema);
export default warehouse;
