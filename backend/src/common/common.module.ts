import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthInterceptor } from './interceptors/jwt-auth.interceptor';

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: JwtAuthInterceptor,
    },
  ],
})
export class CommonModule {}
