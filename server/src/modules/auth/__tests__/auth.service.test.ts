import { AuthService } from '../auth.service';
import { User } from '../../users/user.model';
import { AppError } from '../../../middleware/error.middleware';
import * as bcrypt from 'bcryptjs';

jest.mock('../../users/user.model');
jest.mock('bcryptjs');

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
        toJSON: jest.fn().mockReturnValue({
          _id: '123',
          name: 'John Doe',
          email: 'john@example.com',
          role: 'student',
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User as any).mockImplementation(() => mockUser);

      const result = await authService.register(input);

      expect(result).toEqual({
        _id: '123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'student',
      });
      expect(User.findOne).toHaveBeenCalledWith({ email: input.email });
    });

    it('should throw error if user already exists', async () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockResolvedValue({ email: 'john@example.com' });

      await expect(authService.register(input)).rejects.toThrow(AppError);
    });

    it('should hash password before saving', async () => {
      const input = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        toJSON: jest.fn().mockReturnValue({}),
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      (User as any).mockImplementation(() => mockUser);

      await authService.register(input);

      expect(bcrypt.hash).toHaveBeenCalledWith(input.password, 10);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const input = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: '123',
        email: 'john@example.com',
        passwordHash: 'hashedPassword',
        role: 'student',
        toJSON: jest.fn().mockReturnValue({
          _id: '123',
          email: 'john@example.com',
          role: 'student',
        }),
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await authService.login(input);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user).toEqual({
        _id: '123',
        email: 'john@example.com',
        role: 'student',
      });
    });

    it('should throw error on invalid password', async () => {
      const input = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        passwordHash: 'hashedPassword',
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(authService.login(input)).rejects.toThrow(AppError);
    });

    it('should throw error if user not found', async () => {
      const input = {
        email: 'notfound@example.com',
        password: 'password123',
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);

      await expect(authService.login(input)).rejects.toThrow(AppError);
    });
  });

  describe('refreshAccessToken', () => {
    it('should return new access token', async () => {
      const refreshToken = 'valid-refresh-token';
      const mockUser = {
        _id: '123',
        email: 'john@example.com',
        role: 'student',
        toJSON: jest.fn().mockReturnValue({
          _id: '123',
          email: 'john@example.com',
          role: 'student',
        }),
      };

      jest.spyOn(require('jsonwebtoken'), 'verify').mockReturnValue({
        userId: '123',
      });
      (User.findById as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result.user).toEqual({
        _id: '123',
        email: 'john@example.com',
        role: 'student',
      });
    });
  });
});
