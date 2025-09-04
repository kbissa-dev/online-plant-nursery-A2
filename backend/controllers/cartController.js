const mongoose = require('mongoose');
const Cart = require('../models/Cart');
const Plant = require('../models/Plant');
const PricingService = require('../services/pricingService');

//was repeating checking conditions in each "cart" function, so adding this to keep the code DRY (principle)
const validatePlantAndStock = async (plantId, qty) => {    
    if (!plantId || !qty || qty < 1) {
        return { error: 'Invalid input', status: 400 };
    }

    const plant = await Plant.findById(plantId);
    if (!plant) {
        return { error: 'Plant not found', status: 404 };
    }

    if (qty > plant.stock) {
        return { error: 'Insufficient stock', status: 400 };
    }

    return { plant };
};

const getCartWithPricing = async (userId, user) => {
    const cart = await Cart.findOne({ userId }).populate('items.plant');

    if (!cart) {
        return {
            userId,
            items: [],
            pricing: {
                subtotalInCents: 0,
                totalDiscountInCents: 0,
                totalInCents: 0,
                discounts: [],
                subtotal: "0.00",
                totalDiscount: "0.00",
                total: "0.00"
            }
        };
    }

    const pricing = await PricingService.calculateTotals(cart, user);

    return {
        ...cart.toObject(),
        pricing
    };
    
};

const addToCart = async (req, res) => { 
    try {
        const { plantId, qty } = req.body;
        const userId = req.user.id;

        const validation = await validatePlantAndStock(plantId, qty);
        if (validation.error) {
            return res.status(validation.status).json({ error: validation.error });
        }        

        //find if user cart already exist, if not create new one
        let cart = await Cart.findOne({ userId });
        
        if (!cart) {
            cart = new Cart({
                userId,
                items: [{ plant: plantId, qty }]
            });

        } else {
            //make sure same item is not already in the cart
            const existingItemIndex = cart.items.findIndex(
                item => item.plant.toString() === plantId
            );
            
            //if same item already exist in cart then just increase qty instead of another item line
            if (existingItemIndex !== -1) {
                const newTotalQty = cart.items[existingItemIndex].qty + qty;
                if (newTotalQty > validation.plant.stock) {
                    return res.status(400).json({ error: 'Insufficient stock' });
                }

                cart.items[existingItemIndex].qty = newTotalQty;
                
            } else {
                cart.items.push({ plant: plantId, qty });
            }                
            
        }
        
        await cart.save();        
        
        const cartWithPricing = await getCartWithPricing(userId, req.user);
        res.status(200).json(cartWithPricing);
        
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await getPopulatedCart(userId);
        const cartWithPricing = await PricingService.calculateTotals(cart, req.user);
        res.json(cartWithPricing);

        //return an empty cart if no cart is found
        if (!cart) {
            return res.status(200).json({ items: [] });
        }

        res.status(200).json(cartWithPricing);

    } catch (error) {
        console.error('Get cart error:', error);
        return res.status(500).json({ error: 'Server error' });
    }
};

const updateCartItem = async (req, res) => {
    try {
        const { plantId, qty } = req.body;
        const userId = req.body.id;

        const validation = await validatePlantAndStock(plantId, qty);
        if (validation.error) {
            return res.status(validation.status).json({ error: validation.error });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const itemIndex = cart.item.findIndex(
            item => item.plant.toString() === plantId
        );

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found' });
        }

        cart.items[itemIndex].qty = qty;
        await cart.save();

        const cartWithPricing = await getCartWithPricing(userId, req.user);
        res.status(200).json(cartWithPricing);

    } catch (error) {
        console.error('Update cart item error:', error);
        res.status(500).json({ error: 'Server error' });
    }  
};

const removeFromCart = async (req, res) => {
    try {
        const { plantId } = req.params;
        const { userId } = req.user.id;

        if (!plantId) {
            return res.status(400).json({ error: 'Plant ID required' });
        }

        const cart = await Cart.findOne({ userId });
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        const initialItemCount = cart.items.length;
        cart.items = cart.items.filter(
            item => item.plant.toString() !== plantId
        );

        if (cart.items.length === initialItemCount) {
            return res.status(404).json({ error: 'Item not found' });
        }

        await cart.save();

        const cartWithPricing = await getCartWithPricing(userId, req.user);
        res.status(200).json(cartWithPricing);

    } catch (error) {
        console.error('Remove from cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const clearCart = async (req, res) => {
    try {
        const userId = req.user.id;

        await Cart.findOneAndDelete(
            { userId },
            { items: [] },
            { upsert: true }
        );

        res.status(200).json({ 
            userId, 
            items: [],
            pricing: {
                subtotalInCents: 0,
                totalDiscountInCents: 0,
                totalInCents: 0,
                discounts: [],
                subtotal: "0.00",
                totalDiscount: "0.00",
                total: "0.00"
            }
        });
        
    } catch (error) {
        console.error('Clear cart error:', error);
        res.status(500).json({ error: 'Server error' });
    }
};

const getCartPricing = async (req, res) => {
    try {
        const userId = req.user.id;
        const cart = await Cart.findOne({ userId }).populate('items.plant');

        if (!cart || !cart.items.length) {
            return res.status(200).json({
                subtotalInCents: 0,
                totalDiscountInCents: 0,
                totalInCents: 0,
                discounts: [],
                subtotal: "0.00",
                totalDiscount: "0.00",
                total: "0.00"
            });
        }

        const pricing = await PricingService.calculateTotals(cart, req.user);
        res.status(200).json(pricing);

    } catch (error) {
        console.error('Get cart pricing error:', error);
        res.status(500).json({ error: 'Server error' });
    }

};

module.exports = { addToCart, getCart, updateCartItem, removeFromCart, clearCart, getCartPricing };