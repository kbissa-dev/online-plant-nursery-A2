const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { USER_ROLES } = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const {
  requireCustomer,
  requireStaff,
  requireAdmin,
  requireStaffOrCustomer
} = require('../middleware/roleMiddleware');

describe('Middleware', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('authMiddleware - protect', () => {
    it('should set user when valid token provided', async () => {
      const mockUser = {
        _id: 'user123',
        name: 'Test User',
        email: 'test@example.com',
        role: USER_ROLES.CUSTOMER
      };

      const req = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      const res = {};
      const next = sinon.spy();

      sinon.stub(jwt, 'verify').returns({ id: 'user123' });
      sinon.stub(User, 'findById').returns({
        select: sinon.stub().resolves(mockUser)
      });

      await protect(req, res, next);

      expect(req.user).to.equal(mockUser);
      expect(next.calledOnce).to.be.true;
    });

    it('should continue without user when no token provided', async () => {
      const req = {
        headers: {}
      };
      const res = {};
      const next = sinon.spy();

      await protect(req, res, next);

      expect(req.user).to.be.undefined;
      expect(next.calledOnce).to.be.true;
    });

    it('should continue without user when invalid token provided', async () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token'
        }
      };
      const res = {};
      const next = sinon.spy();

      sinon.stub(jwt, 'verify').throws(new Error('Invalid token'));
      const consoleWarnSpy = sinon.spy(console, 'warn');

      await protect(req, res, next);

      expect(req.user).to.be.undefined;
      expect(next.calledOnce).to.be.true;
      expect(consoleWarnSpy.calledWith('[auth] token invalid, proceeding without user')).to.be.true;
    });

    it('should handle malformed authorization header', async () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat'
        }
      };
      const res = {};
      const next = sinon.spy();

      await protect(req, res, next);

      expect(req.user).to.be.undefined;
      expect(next.calledOnce).to.be.true;
    });

    it('should continue when user not found in database', async () => {
      const req = {
        headers: {
          authorization: 'Bearer valid-token'
        }
      };
      const res = {};
      const next = sinon.spy();

      sinon.stub(jwt, 'verify').returns({ id: 'nonexistent' });
      sinon.stub(User, 'findById').returns({
        select: sinon.stub().resolves(null)
      });

      await protect(req, res, next);

      expect(req.user).to.be.null;
      expect(next.calledOnce).to.be.true;
    });
  });

  describe('roleMiddleware - requireCustomer', () => {
    it('should allow access for customer user', () => {
      const req = {
        user: {
          role: USER_ROLES.CUSTOMER,
          isCustomer: () => true
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireCustomer(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should deny access for staff user', () => {
      const req = {
        user: {
          role: USER_ROLES.STAFF,
          isCustomer: () => false
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireCustomer(req, res, next);

      expect(next.called).to.be.false;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Customer access required.' })).to.be.true;
    });

    it('should deny access when no user', () => {
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireCustomer(req, res, next);

      expect(next.called).to.be.false;
      expect(res.status.calledWith(403)).to.be.true;
    });
  });

  describe('roleMiddleware - requireStaff', () => {
    it('should allow access for active staff user', () => {
      const req = {
        user: {
          role: USER_ROLES.STAFF,
          isStaff: () => true,
          isAdmin: () => false,
          isActive: true
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaff(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should allow access for admin user', () => {
      const req = {
        user: {
          role: USER_ROLES.ADMIN,
          isStaff: () => false,
          isAdmin: () => true,
          isActive: true
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaff(req, res, next);

      expect(next.calledOnce).to.be.true;
    });

    it('should deny access for inactive staff', () => {
      const req = {
        user: {
          role: USER_ROLES.STAFF,
          isStaff: () => true,
          isAdmin: () => false,
          isActive: false
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaff(req, res, next);

      expect(next.called).to.be.false;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Account deactivated.' })).to.be.true;
    });

    it('should deny access for customer', () => {
      const req = {
        user: {
          role: USER_ROLES.CUSTOMER,
          isStaff: () => false,
          isAdmin: () => false
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaff(req, res, next);

      expect(next.called).to.be.false;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Staff level access required.' })).to.be.true;
    });
  });

  describe('roleMiddleware - requireAdmin', () => {
    it('should allow access for admin user', () => {
      const req = {
        user: {
          role: USER_ROLES.ADMIN,
          isAdmin: () => true
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireAdmin(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should deny access for staff user', () => {
      const req = {
        user: {
          role: USER_ROLES.STAFF,
          isAdmin: () => false
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireAdmin(req, res, next);

      expect(next.called).to.be.false;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Admin level access required.' })).to.be.true;
    });

    it('should deny access when no user', () => {
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireAdmin(req, res, next);

      expect(next.called).to.be.false;
      expect(res.status.calledWith(403)).to.be.true;
    });
  });

  describe('roleMiddleware - requireStaffOrCustomer', () => {
    it('should allow access for customer', () => {
      const req = {
        user: {
          role: USER_ROLES.CUSTOMER,
          isCustomer: () => true
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaffOrCustomer(req, res, next);

      expect(next.calledOnce).to.be.true;
      expect(res.status.called).to.be.false;
    });

    it('should allow access for active staff', () => {
      const req = {
        user: {
          role: USER_ROLES.STAFF,
          isCustomer: () => false,
          isStaff: () => true,
          isAdmin: () => false,
          isActive: true
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaffOrCustomer(req, res, next);

      expect(next.calledOnce).to.be.true;
    });

    it('should allow access for admin', () => {
      const req = {
        user: {
          role: USER_ROLES.ADMIN,
          isCustomer: () => false,
          isStaff: () => false,
          isAdmin: () => true,
          isActive: true
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaffOrCustomer(req, res, next);

      expect(next.calledOnce).to.be.true;
    });

    it('should deny access for inactive staff', () => {
      const req = {
        user: {
          role: USER_ROLES.STAFF,
          isCustomer: () => false,
          isStaff: () => true,
          isAdmin: () => false,
          isActive: false
        }
      };
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaffOrCustomer(req, res, next);

      expect(next.called).to.be.false;
      expect(res.status.calledWith(403)).to.be.true;
      expect(res.json.calledWith({ message: 'Access denied.' })).to.be.true;
    });

    it('should deny access when no user', () => {
      const req = {};
      const res = {
        status: sinon.stub().returnsThis(),
        json: sinon.spy()
      };
      const next = sinon.spy();

      requireStaffOrCustomer(req, res, next);

      expect(next.called).to.be.false;
      expect(res.status.calledWith(401)).to.be.true;
      expect(res.json.calledWith({ message: 'Authentication required.' })).to.be.true;
    });
  });
});