const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");

// POST /api/orders
router.post("/", orderController.createOrder);

module.exports = router;
