import mongoose from "mongoose";

const transectionSchema = new mongoose.Schema({
    transection_date: {
        type: Date,
        require: true,
    },
    warehouse_code: {
        type: String,
        require: true,
    },
    products: [{
        product_code: String,
        qty: Number,
        volume: Number,
        location_code: String,
        from_location_code: String,
        to_location_code: String,
    }]
});

const transection = mongoose.model("transection", transectionSchema);
export default transection;
