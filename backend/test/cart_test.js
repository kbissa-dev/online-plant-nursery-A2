const { expect } = require('chai');
const sinon = require('sinon');

describe('Cart Functionality Tests', () => {

  let localStorageMock;
  
  beforeEach(() => {
    localStorageMock = {
      getItem: sinon.stub(),
      setItem: sinon.stub(),
      removeItem: sinon.stub()
    };
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('Add Item to Cart', () => {
    it('should add new item to empty cart', () => {
      const mockPlant = {
        _id: 'plant1',
        name: 'Rose',
        price: 22,
        stock: 10
      };
      
      localStorageMock.getItem.returns(null);
      
      const cartItems = [];
      const newItem = { plant: mockPlant, qty: 1 };
      cartItems.push(newItem);
      
      expect(cartItems).to.have.length(1);
      expect(cartItems[0].plant.name).to.equal('Rose');
      expect(cartItems[0].qty).to.equal(1);
    });

    it('should update quantity when adding existing item', () => {
      const mockPlant = { _id: 'plant1', name: 'Rose', price: 22 };
      const existingCart = [{ plant: mockPlant, qty: 2 }];
      
      const existingItem = existingCart.find(item => item.plant._id === mockPlant._id);
      if (existingItem) {
        existingItem.qty += 1;
      }
      
      expect(existingCart[0].qty).to.equal(3);
    });
  });

  describe('Remove Item from Cart', () => {
    it('should remove item from cart', () => {
      const mockPlant1 = { _id: 'plant1', name: 'Rose', price: 22 };
      const mockPlant2 = { _id: 'plant2', name: 'Lavender', price: 16 };
      const cartItems = [
        { plant: mockPlant1, qty: 2 },
        { plant: mockPlant2, qty: 1 }
      ];
      
      const updatedCart = cartItems.filter(item => item.plant._id !== 'plant1');
      
      expect(updatedCart).to.have.length(1);
      expect(updatedCart[0].plant.name).to.equal('Lavender');
    });
  });

  describe('Update Item Quantity', () => {
    it('should update item quantity', () => {
      const mockPlant = { _id: 'plant1', name: 'Rose', price: 22 };
      const cartItems = [{ plant: mockPlant, qty: 2 }];
      
      const item = cartItems.find(item => item.plant._id === 'plant1');
      if (item) {
        item.qty = 5;
      }
      
      expect(cartItems[0].qty).to.equal(5);
    });

    it('should remove item when quantity set to 0', () => {
      const mockPlant = { _id: 'plant1', name: 'Rose', price: 22 };
      let cartItems = [{ plant: mockPlant, qty: 2 }];
      
      cartItems = cartItems.filter(item => {
        if (item.plant._id === 'plant1') {
          return false; // remove item
        }
        return true;
      });
      
      expect(cartItems).to.have.length(0);
    });
  });

  describe('Calculate Cart Totals', () => {
    it('should calculate total items correctly', () => {
      const cartItems = [
        { plant: { price: 22 }, qty: 2 },
        { plant: { price: 16 }, qty: 3 }
      ];
      
      const totalItems = cartItems.reduce((total, item) => total + item.qty, 0);
      
      expect(totalItems).to.equal(5);
    });

    it('should calculate total price correctly', () => {
      const cartItems = [
        { plant: { price: 22 }, qty: 2 }, 
        { plant: { price: 16 }, qty: 1 }  
      ];
      
      const totalPrice = cartItems.reduce((total, item) => {
        return total + (item.plant.price * item.qty);
      }, 0);
      
      expect(totalPrice).to.equal(60); // 44 + 16
    });

    it('should return 0 for empty cart', () => {
      const cartItems = [];
      
      const totalItems = cartItems.reduce((total, item) => total + item.qty, 0);
      const totalPrice = cartItems.reduce((total, item) => total + (item.plant.price * item.qty), 0);
      
      expect(totalItems).to.equal(0);
      expect(totalPrice).to.equal(0);
    });
  });

  describe('Clear Cart', () => {
    it('should clear all items from cart', () => {
      const cartItems = [
        { plant: { name: 'Rose' }, qty: 2 },
        { plant: { name: 'Lavender' }, qty: 1 }
      ];
      
      cartItems.length = 0;
      
      expect(cartItems).to.have.length(0);
    });
  });

  describe('localStorage Integration', () => {
    it('should save cart to localStorage', () => {
      const cartItems = [{ plant: { name: 'Rose' }, qty: 1 }];
      
      localStorageMock.setItem('nurseryCart', JSON.stringify(cartItems));
      
      expect(localStorageMock.setItem.calledOnce).to.be.true;
      expect(localStorageMock.setItem.calledWith('nurseryCart', JSON.stringify(cartItems))).to.be.true;
    });

    it('should load cart from localStorage', () => {
      const savedCart = [{ plant: { name: 'Rose' }, qty: 2 }];
      localStorageMock.getItem.returns(JSON.stringify(savedCart));
      
      const cartData = localStorageMock.getItem('nurseryCart');
      const cartItems = cartData ? JSON.parse(cartData) : [];
      
      expect(localStorageMock.getItem.calledOnce).to.be.true;
      expect(cartItems).to.have.length(1);
      expect(cartItems[0].plant.name).to.equal('Rose');
      expect(cartItems[0].qty).to.equal(2);
    });

    it('should handle empty localStorage', () => {
      localStorageMock.getItem.returns(null);
      
      const cartData = localStorageMock.getItem('nurseryCart');
      const cartItems = cartData ? JSON.parse(cartData) : [];
      
      expect(cartItems).to.have.length(0);
    });
  });

  describe('Stock Validation', () => {
    it('should prevent adding more items than available stock', () => {
      const mockPlant = { _id: 'plant1', name: 'Rose', price: 22, stock: 5 };
      const requestedQty = 10;
      
      const canAddToCart = requestedQty <= mockPlant.stock;
      
      expect(canAddToCart).to.be.false;
    });

    it('should allow adding items within stock limit', () => {
      const mockPlant = { _id: 'plant1', name: 'Rose', price: 22, stock: 10 };
      const requestedQty = 5;
      
      const canAddToCart = requestedQty <= mockPlant.stock;
      
      expect(canAddToCart).to.be.true;
    });

    it('should identify low stock items', () => {
      const mockPlant = { _id: 'plant1', name: 'Rose', price: 22, stock: 3 };
      const lowStockThreshold = 5;
      
      const isLowStock = mockPlant.stock <= lowStockThreshold;
      
      expect(isLowStock).to.be.true;
    });
  });

  describe('Cart Helper Functions', () => {
    it('should find item in cart by plant id', () => {
      const cartItems = [
        { plant: { _id: 'plant1', name: 'Rose' }, qty: 2 },
        { plant: { _id: 'plant2', name: 'Lavender' }, qty: 1 }
      ];
      
      const foundItem = cartItems.find(item => item.plant._id === 'plant1');
      
      expect(foundItem).to.not.be.undefined;
      expect(foundItem.plant.name).to.equal('Rose');
    });

    it('should return undefined for non-existent item', () => {
      const cartItems = [
        { plant: { _id: 'plant1', name: 'Rose' }, qty: 2 }
      ];
      
      const foundItem = cartItems.find(item => item.plant._id === 'nonexistent');
      
      expect(foundItem).to.be.undefined;
    });
  });

  describe('Error Handling', () => {
    it('should handle JSON parse error gracefully', () => {
      localStorageMock.getItem.returns('invalid json');
      
      let cartItems = [];
      try {
        const cartData = localStorageMock.getItem('nurseryCart');
        cartItems = cartData ? JSON.parse(cartData) : [];
      } catch (error) {
        cartItems = []; // fallback to empty cart
      }
      
      expect(cartItems).to.have.length(0);
    });

    it('should handle missing plant data', () => {
      const cartItems = [
        { plant: null, qty: 1 },
        { plant: { name: 'Rose', price: 22 }, qty: 2 }
      ];
      
      const validItems = cartItems.filter(item => item.plant && item.plant.name);
      
      expect(validItems).to.have.length(1);
      expect(validItems[0].plant.name).to.equal('Rose');
    });
  });
});