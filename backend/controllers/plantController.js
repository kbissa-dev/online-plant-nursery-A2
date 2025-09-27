const mongoose = require('mongoose');
const Plant = require('../models/Plant');

// helper: uniform error for invalid ObjectId
const isBadId = (id) => !mongoose.Types.ObjectId.isValid(id);

// GET /api/plants
const getPlants = async (req, res) => {
  try {
    const query = req.user?.id ? { /* createdBy: req.user.id */ } : {};
    const plants = await Plant.find(query).lean();
    res.json(plants);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/plants
const addPlant = async (req, res) => {
  try {
    const { name, price, stock, description, category } = req.body;

    if (!name || price == null) {
      return res.status(400).json({ message: 'name and price are required' });
    }

    const image = req.file ? req.file.filename : 'placeholder.jpg';

    const plant = await Plant.create({
      name,
      price,
      stock: stock ?? 0,
      description,
      category,
      image,
      createdBy: req.user?.id, // requires auth middleware to be set
    });

    res.status(201).json(plant);
  } catch (err) {
    // validationError -> 400
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/plants/:id
const updatePlant = async (req, res) => {
  const { id } = req.params;
  if (isBadId(id)) return res.status(400).json({ message: 'Invalid plant id' });

  try {
    const update = {
      ...(req.body.name !== undefined && { name: req.body.name }),
      ...(req.body.price !== undefined && { price: req.body.price }),
      ...(req.body.stock !== undefined && { stock: req.body.stock }),
      ...(req.body.description !== undefined && { description: req.body.description }),
      ...(req.body.category !== undefined && { category: req.body.category }),
    };

    if (req.file) {
      update.image = req.file.filename;
    } // keeping old image and not remove them for this project

    const plant = await Plant.findByIdAndUpdate(id, update, { new: true, runValidators: true });
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json(plant);
  } catch (err) {
    if (err.name === 'ValidationError') {
      return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/plants/:id
const deletePlant = async (req, res) => {
  const { id } = req.params;
  if (isBadId(id)) return res.status(400).json({ message: 'Invalid plant id' });

  try {
    const plant = await Plant.findByIdAndDelete(id);
    if (!plant) return res.status(404).json({ message: 'Plant not found' });
    res.json({ message: 'Plant deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getPlants, addPlant, updatePlant, deletePlant };
