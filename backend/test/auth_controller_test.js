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
  updateUserProfile
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

describe('updateUserProfile', () => {
    it('should update customer profile successfully', async () => {
      const req = {
        user: { id: 'customer123' },
        body: {
          name: 'Updated Customer',
          email: 'updated@example.com',
          address: '123 New Street'
        }
      };

      const mockUser = {
        id: 'customer123',
        name: 'Old Name',
        email: 'old@example.com',
        address: '123 Old Street',
        role: USER_ROLES.CUSTOMER,
        loyaltyTier: 'gold',
        isCustomer: () => true,
        getLoyaltyInfo: () => ({ currentTier: 'Gold', discount: 10 })
      };

      mockUser.save = sinon.stub().callsFake(async function() {
        this.name = req.body.name || this.name;
        this.email = req.body.email || this.email;
        this.address = req.body.address || this.address;
        return this;
      });

      sinon.stub(User, 'findById').resolves(mockUser);
      sinon.stub(jwt, 'sign').returns('updated-token');

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await updateUserProfile(req, res);

      expect(User.findById.calledWith('customer123')).to.be.true;
      expect(mockUser.save.calledOnce).to.be.true;
      expect(res.json.calledOnce).to.be.true;
      
      const responseCall = res.json.getCall(0).args[0];
      expect(responseCall.id).to.equal('customer123');
      expect(responseCall.name).to.equal('Updated Customer');
      expect(responseCall.email).to.equal('updated@example.com');
      expect(responseCall.role).to.equal(USER_ROLES.CUSTOMER);
      expect(responseCall.address).to.equal('123 New Street');
      expect(responseCall.loyaltyTier).to.equal('gold');
      expect(responseCall.token).to.equal('updated-token');
    });

    it('should update staff profile successfully (no address field)', async () => {
      const req = {
        user: { id: 'staff123' },
        body: {
          name: 'Updated Staff',
          email: 'staffupdated@example.com',
          address: '123 Ignored Street' // should be ignored for staff
        }
      };

      const mockUser = {
        id: 'staff123',
        name: 'Old Staff Name',
        email: 'oldstaff@example.com',
        role: USER_ROLES.STAFF,
        employeeId: 'EMP001',
        isCustomer: () => false
      };

      mockUser.save = sinon.stub().callsFake(async function() {
        this.name = req.body.name || this.name;
        this.email = req.body.email || this.email;
        // address should not be updated for staff
        return this;
      });

      sinon.stub(User, 'findById').resolves(mockUser);
      sinon.stub(jwt, 'sign').returns('staff-updated-token');

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await updateUserProfile(req, res);

      expect(User.findById.calledWith('staff123')).to.be.true;
      expect(mockUser.save.calledOnce).to.be.true;
      
      const responseCall = res.json.getCall(0).args[0];
      expect(responseCall.id).to.equal('staff123');
      expect(responseCall.name).to.equal('Updated Staff');
      expect(responseCall.email).to.equal('staffupdated@example.com');
      expect(responseCall.role).to.equal(USER_ROLES.STAFF);
      expect(responseCall.token).to.equal('staff-updated-token');
      // make sure it should not include customer specific fields
      expect(responseCall).to.not.have.property('address');
      expect(responseCall).to.not.have.property('loyaltyTier');
      expect(responseCall).to.not.have.property('loyaltyInfo');
    });

    it('should handle partial updates (only name)', async () => {
      const req = {
        user: { id: 'customer123' },
        body: {
          name: 'Only Name Updated'
          // email and address not provided
        }
      };

      const mockUser = {
        id: 'customer123',
        name: 'Old Name',
        email: 'keep@example.com',
        address: 'Keep This Address',
        role: USER_ROLES.CUSTOMER,
        loyaltyTier: 'silver',
        isCustomer: () => true,
        getLoyaltyInfo: () => ({ currentTier: 'Silver', discount: 5 })
      };

      mockUser.save = sinon.stub().callsFake(async function() {
        this.name = req.body.name || this.name;
        this.email = req.body.email || this.email;
        this.address = req.body.address || this.address;
        return this;
      });

      sinon.stub(User, 'findById').resolves(mockUser);
      sinon.stub(jwt, 'sign').returns('partial-token');

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await updateUserProfile(req, res);

      const responseCall = res.json.getCall(0).args[0];
      expect(responseCall.name).to.equal('Only Name Updated');
      expect(responseCall.email).to.equal('keep@example.com');
      expect(responseCall.address).to.equal('Keep This Address');
    });

    it('should handle empty updates (keep all existing values)', async () => {
      const req = {
        user: { id: 'customer123' },
        body: {}
      };

      const mockUser = {
        id: 'customer123',
        name: 'Existing Name',
        email: 'existing@example.com',
        address: 'Existing Address',
        role: USER_ROLES.CUSTOMER,
        loyaltyTier: 'green',
        isCustomer: () => true,
        getLoyaltyInfo: () => ({ currentTier: 'Green', discount: 0 })
      };

      mockUser.save = sinon.stub().callsFake(async function() {
        this.name = req.body.name || this.name;
        this.email = req.body.email || this.email;
        this.address = req.body.address || this.address;
        return this;
      });

      sinon.stub(User, 'findById').resolves(mockUser);
      sinon.stub(jwt, 'sign').returns('no-change-token');

      const res = {
        json: sinon.spy(),
        status: sinon.stub().returnsThis()
      };

      await updateUserProfile(req, res);

      const responseCall = res.json.getCall(0).args[0];
      expect(responseCall.name).to.equal('Existing Name');
      expect(responseCall.email).to.equal('existing@example.com');
      expect(responseCall.address).to.equal('Existing Address');
    });

    it('should return 404 when user not found', async () => {
      const req = {
        user: { id: 'nonexistent123' },
        body: { name: 'New Name' }
      };

      sinon.stub(User, 'findById').resolves(null);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await updateUserProfile(req, res);

      expect(User.findById.calledWith('nonexistent123')).to.be.true;
      expect(res.status.calledWith(404)).to.be.true;
      expect(res.json.calledWith({ message: 'User not found' })).to.be.true;
    });

    it('should return 500 when save fails', async () => {
      const req = {
        user: { id: 'customer123' },
        body: { name: 'New Name' }
      };

      const mockUser = {
        name: 'Old Name',
        isCustomer: () => true
      };

      mockUser.save = sinon.stub().rejects(new Error('Database connection failed'));

      sinon.stub(User, 'findById').resolves(mockUser);

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await updateUserProfile(req, res);

      expect(mockUser.save.calledOnce).to.be.true;
      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Database connection failed' })).to.be.true;
    });

    it('should return 500 when findById fails', async () => {
      const req = {
        user: { id: 'customer123' },
        body: { name: 'New Name' }
      };

      sinon.stub(User, 'findById').rejects(new Error('Database error'));

      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };

      await updateUserProfile(req, res);

      expect(res.status.calledWith(500)).to.be.true;
      expect(res.json.calledWith({ message: 'Database error' })).to.be.true;
    });
  });

});