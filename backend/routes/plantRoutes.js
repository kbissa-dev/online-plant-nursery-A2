const router = require('express').Router();
const c = require('../controllers/plantController');
// const auth = require('../middleware/auth'); // enable later if needed
// router.use(auth);
router.get('/', c.getPlants);
router.post('/', c.addPlant);
router.put('/:id', c.updatePlant);
router.delete('/:id', c.deletePlant);
module.exports = router;
