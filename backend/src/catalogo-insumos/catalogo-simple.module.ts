import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: false,
    }),
  ],
  controllers: [],
  providers: [],
  exports: [],
})
export class CatalogoSimpleModule {}
