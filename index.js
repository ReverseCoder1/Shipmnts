import express from "express";
import dotenv from 'dotenv';
import warehouse from "./models/warehouse.js"
import transection from "./models/transection.js"
import { connectMongo } from "./connect.js"

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

connectMongo().then(() => {
    app.listen(PORT, () => console.log("Server Start at port:", PORT));
}).catch(err => console.error("DB Connection Failed:", err));


// API : 1 Create Warehouse --> post request

app.post('/api/create_location', async (req, res) => {
    try {
        const { location_code, parent_location_code } = req.body;
        if (!location_code) {
            return res.status(400).json({ success: false, message: "Invalid data" });
        }

        const existing = await warehouse.findOne({ "location.location_code": location_code })
        if (existing) {
            return res.status(400).json({ success: false, message: "Already exist data" });
        }

        if (parent_location_code === null) {
            const newwarehouse = new warehouse({
                location_code: location_code,
                locations: [{
                    location_code,
                    type: 'warehouse',
                    childs: [],
                    products: []
                }]
            });

            await newwarehouse.validate();
            await warehouse.create(newwarehouse);

            return res.status(201).json({
                success: true, message: "warehouse created successfully", data: {
                    location_code,
                    parent_location_code: null,
                    type: 'warehouse',
                }
            });
        }

        const warehouse1 = await warehouse.findOne({ "location.location_code": parent_location_code });
        if (!warehouse1) {
            return res.status(404).json({ success: false, message: " warehouse not found" });
        }
        const newlocation = {
            location_code,
            tyoe: 'storage',
            childs: [],
            products: []
        };

        parent.childs.push(newlocation);
        await warehouse.save();

        return res.status(201).json({
            success: true, message: "Location addes successfully", data: {
                location_code,
                parent_location_code,
                type: "storage"
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// API: 2  Get Warehouses in Tree Format

app.get('api/warehouse/:warehouse_code', async (req, res) => {
    try {
        const data = await warehouse.findById(req.params.warehouse_code);
        if (!data) res.status(404).json({ message: "Ware housenot found." });
        res.status(200).json(data);
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});


// API : 3 Add Products to Warehouse

app.post('/api/transaction/receipt', async (req, res) => {
    try {
        const { transection_date, warehouse_code, products } = req.body;

        if (!transection_date || !warehouse_code || !products) {
            return res.status(400).json({ success: false, message: "Invalid Input" })
        }

        // find warehouse

        const warehouse1 = await warehouse.findOne({ warehouse_code: warehouse_code });
        if (!warehouse1) {
            return res.status(404).json({ success: false, message: "warehouse not found" })
        }

        // find exact location in that warehouse

        function findLocation(locations, code) {
            for (let loc of locations) {
                if (loc.location_code == code) {
                    return loc;
                }
                if (loc.childs && loc.childs.length) {
                    const found = findLocation(loc.childs, code);
                    if (found) return found;
                }
            }
            return null;
        }

        for (let item of products) {
            const { product_code, qty, volumn, location_code } = item;
            if (!product_code || !qty || !volumn || !location_code) {
                return res.status(400).json({ success: false, message: "Missing product feild" });
            }

            const location = findLocation(warehouse.locations, location_code);

            if (!location) {
                return res.status(400).json({
                    success: false,
                    message: `location ${location_code} dose not belong to warehouse ${warehouse_code}`
                });
            }
            location.products.push({ product_code, qty, volumn, transection_date });
        }
        await warehouse.save();

        return res.status(200).json({ success: true, message: "Products added successfully" })
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
})

// API: 4 Deliver Product Out of Warehouse

app.post('/api/transaction/delivery', async (req, res) => {
    try {
        const { transection_date, warehouse_code, products } = req.body;
        if (!transection_date || !warehouse_code || !products) {
            return res.status(400).json({ success: false, message: "Invalid Input" })
        }

        // find warehouse

        const warehouse1 = await warehouse.findOne({ warehouse_code: warehouse_code });
        if (!warehouse1) {
            return res.status(404).json({ success: false, message: "warehouse not found" })
        }

        function findLocation(locations, code) {
            for (let loc of locations) {
                if (loc.location_code == code) {
                    return loc;
                }
                if (loc.childs && loc.childs.length) {
                    const found = findLocation(loc.childs, code);
                    if (found) return found;
                }
            }
            return null;
        }

        for (let item of products) {
            const { product_code, qty, volumn, location_code } = item;
            if (!product_code || !qty || !volumn || !location_code) {
                return res.status(400).json({ success: false, message: "Missing product feild" });
            }

            const location = findLocation(warehouse.locations, location_code);
            if (!location) {
                return res.status(400).json({
                    success: false,
                    message: `location ${location_code} dose not belong to warehouse ${warehouse_code}`
                });
            }

            const product = location.products.find(p => { p.product_code == product_code });
            if (!product) {
                return res.status(400).json({ success: false, message: `Product ${product_code} not found` });
            }
            // check stock is available or not
            if (product.qty < qty) {
                return res.status(400).json({
                    success: false, message: `Insufficient Qty at ${location_code}`
                });
            }

            product.qty -= qty;
        }
        await warehouse.save();
        return res.status(200).json({ success: true, message: "Product delivered successfully" });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
})