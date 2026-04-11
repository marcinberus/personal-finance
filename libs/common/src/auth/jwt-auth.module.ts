import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import { JwtStrategy } from './jwt.strategy';

export interface JwtAuthModuleOptions {
  enableTokenSigning?: boolean;
}

@Module({})
export class JwtAuthModule {
  static register(options: JwtAuthModuleOptions = {}): DynamicModule {
    const imports: NonNullable<DynamicModule['imports']> = [PassportModule];

    if (options.enableTokenSigning) {
      imports.push(
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const secret = configService.get<string>('JWT_SECRET');
            if (!secret) {
              throw new Error('JWT_SECRET is not configured');
            }

            return {
              secret,
              signOptions: {
                expiresIn: (configService.get<string>('JWT_EXPIRES_IN') ??
                  '1d') as StringValue,
              },
            };
          },
        }),
      );
    }

    return {
      module: JwtAuthModule,
      imports,
      providers: [JwtStrategy],
      exports: options.enableTokenSigning ? [JwtModule] : [],
    };
  }
}
