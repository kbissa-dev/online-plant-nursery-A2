const { expect } = require('chai');
const sinon = require('sinon');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { USER_ROLES } = require('../models/User');
const {
  registerUser,
  loginUser,
  createStaff,
  getProfile,
  // updateUserProfile
} = require('../controllers/authController');

describe('AuthController', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('registerUser', () => {
    it('should create a new customer user successfully', async () => {
      const req = {
        body: {
          name: 'John Smith',
          email: 'john@example.com',
          address: '123 Main St',
          password: 'password123'
        }
      };

      const mockUser = {
        id: 'user123',
        name: 'John Smith',
        email: 'john@example.com',
        address: '123 Main St',
        role: USER_ROLES.CUSTOMER,
        loyaltyTier: 'green'
      };

      sinon.stub(User, 'findOne').resolves(null); // User doesn't exist
      sinon.stub(User, 'create').resolves(mockUser);
      sinon.stub(jwt, 'sign').returns('mock-token');

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await registerUser(req, res);

      expect(User.findOne.calledWith({ email: 'john@example.com' })).to.be.true;
      expect(User.create.calledOnce).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
      expect(res.json.calledWith(sinon.match({
        name: 'John Smith',
        email: 'john@example.com',
        role: USER_ROLES.CUSTOMER,
        token: 'mock-token'
      }))).to.be.true;
    });

    it('should return 400 if user already exists', async () => {
      const req = {
        body: { email: 'existing@example.com' }
      };

      sinon.stub(User, 'findOne').resolves({ email: 'existing@example.com' });

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await registerUser(req, res);

      expect(res.status.calledWith(400)).to.be.true;
      expect(res.json.calledWith({ message: 'User already exists' })).to.be.true;
    });
  });

  describe('loginUser', () => {
    it('should login customer successfully', async () => {
      const req = {
        body: {
          email: 'customer@example.com',
          password: 'password123'
        }
      };

      const mockUser = {
        id: 'user123',
        name: 'Customer User',
        email: 'customer@example.com',
        address: '456 Main St',
        role: USER_ROLES.CUSTOMER,
        loyaltyTier: 'silver',
        isCustomer: () => true,
        canManagePlants: () => false,
        getLoyaltyInfo: () => ({ currentTier: 'Silver', discount: 5 })
      };

      sinon.stub(User, 'findOne').resolves(mockUser);
      sinon.stub(bcrypt, 'compare').resolves(true);
      sinon.stub(jwt, 'sign').returns('customer-token');

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await loginUser(req, res);

      expect(res.json.calledWith(sinon.match({
        id: 'user123',
        name: 'Customer User',
        email: 'customer@example.com',
        address: '456 Main St',
        role: USER_ROLES.CUSTOMER,
        loyaltyTier: 'silver',
        loyaltyInfo: { currentTier: 'Silver', discount: 5 },
        token: 'customer-token'
      }))).to.be.true;
    });

    it('should login staff successfully', async () => {
      const req = {
        body: {
          email: 'staff@example.com',
          password: 'staffpass'
        }
      };

      const mockUser = {
        id: 'staff123',
        name: 'Staff User',
        email: 'staff@example.com',
        role: USER_ROLES.STAFF,
        employeeId: 'EMP001',
        isActive: true,
        isCustomer: () => false,
        canManagePlants: () => true
      };

      sinon.stub(User, 'findOne').resolves(mockUser);
      sinon.stub(bcrypt, 'compare').resolves(true);
      sinon.stub(jwt, 'sign').returns('staff-token');

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await loginUser(req, res);

      expect(res.json.calledWith(sinon.match({
        id: 'staff123',
        name: 'Staff User',
        email: 'staff@example.com',
        role: USER_ROLES.STAFF,
        employeeId: 'EMP001',
        isActive: true,
        token: 'staff-token'
      }))).to.be.true;
    });

    it('should return 401 for invalid credentials', async () => {
      const req = {
        body: {
          email: 'user@example.com',
          password: 'wrongpassword'
        }
      };

      sinon.stub(User, 'findOne').resolves(null);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await loginUser(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: 'Invalid email or password' })).to.be.true;
    });

    it('should return 401 for inactive staff', async () => {
      const req = {
        body: {
          email: 'inactive@example.com',
          password: 'password'
        }
      };

      const mockUser = {
        isCustomer: () => false,
        isActive: false
      };

      sinon.stub(User, 'findOne').resolves(mockUser);
      sinon.stub(bcrypt, 'compare').resolves(true);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await loginUser(req, res);

      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: 'Account deactivated.' })).to.be.true;
    });
  });

  describe('createStaff', () => {
    it('should create staff account when admin', async () => {
      const req = {
        user: {
          _id: 'admin123',
          isAdmin: () => true
        },
        body: {
          name: 'New Staff',
          email: 'newstaff@example.com',
          password: 'staffpass',
          role: USER_ROLES.STAFF,
          employeeId: 'EMP002'
        }
      };

      const mockStaff = {
        id: 'staff456',
        name: 'New Staff',
        email: 'newstaff@example.com',
        role: USER_ROLES.STAFF,
        employeeId: 'EMP002',
        isActive: true
      };

      sinon.stub(User, 'findOne').resolves(null); // User doesn't exist
      sinon.stub(User, 'create').resolves(mockStaff);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await createStaff(req, res);

      expect(User.create.calledWith(sinon.match({
        name: 'New Staff',
        email: 'newstaff@example.com',
        role: USER_ROLES.STAFF,
        employeeId: 'EMP002',
        isActive: true,
        createdBy: 'admin123'
      }))).to.be.true;
      expect(res.status.calledWith(201)).to.be.true;
    });

    it('should return 403 when not admin', async () => {
      const req = {
        user: {
          isAdmin: () => false
        },
        body: {}
      };

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await createStaff(req, res);

      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Admin access level required.' })).to.be.true;
    });
  });

  describe('getProfile', () => {
    it('should return customer profile with loyalty info', async () => {
      const req = {
        user: { id: 'customer123' }
      };

      const mockUser = {
        name: 'Customer Name',
        email: 'customer@example.com',
        role: USER_ROLES.CUSTOMER,
        address: '123 Ann Street',
        loyaltyTier: 'gold',
        isActive: true,
        isCustomer: () => true,
        canManagePlants: () => false,
        getLoyaltyInfo: () => ({ currentTier: 'Gold', discount: 10 })
      };

      sinon.stub(User, 'findById').resolves(mockUser);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await getProfile(req, res);

      expect(res.status.calledWith(200)).to.be.true;
      expect(res.json.calledWith(sinon.match({
        name: 'Customer Name',
        email: 'customer@example.com',
        role: USER_ROLES.CUSTOMER,
        address: '123 Ann Street',
        loyaltyTier: 'gold'
      }))).to.be.true;
    });

    it('should return 404 when user not found', async () => {
      const req = {
        user: { id: 'nonexistent' }
      };

      sinon.stub(User, 'findById').resolves(null);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await getProfile(req, res);

      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'User not found' })).to.be.true;
    });
  });
});