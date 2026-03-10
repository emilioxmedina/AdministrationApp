import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { User } from '../entities/user.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<Omit<User, 'password'>> {
    const [existingEmail, existingUsername] = await Promise.all([
      this.usersService.findByEmail(dto.email),
      this.usersService.findByUsername(dto.username),
    ]);

    if (existingEmail) throw new ConflictException('Email already in use');
    if (existingUsername) throw new ConflictException('Username already in use');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      username: dto.username,
      email: dto.email,
      password: hashed,
      role: dto.role,
    });

    const { password: _, ...result } = user as User & { password: string };
    return result;
  }

  async login(dto: LoginDto): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, (user as any).password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user);
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });
      const user = await this.usersService.findById(payload.sub);
      if (!user) throw new UnauthorizedException();

      const accessToken = this.jwtService.sign(
        { sub: user.id, email: user.email, role: user.role },
        {
          secret: this.configService.get<string>('JWT_SECRET', 'secret'),
          expiresIn: this.configService.get('JWT_EXPIRES_IN', '15m'),
        } as any,
      );
      return { accessToken };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  private issueTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = { sub: user.id, email: user.email, role: user.role };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signOptions = (secret: string, expiresIn: string): any => ({ secret, expiresIn });

    const accessToken = this.jwtService.sign(
      payload,
      signOptions(
        this.configService.get<string>('JWT_SECRET', 'secret'),
        this.configService.get<string>('JWT_EXPIRES_IN', '15m'),
      ),
    );

    const refreshToken = this.jwtService.sign(
      payload,
      signOptions(
        this.configService.get<string>('JWT_REFRESH_SECRET', 'refresh_secret'),
        this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
      ),
    );

    return { accessToken, refreshToken };
  }
}
