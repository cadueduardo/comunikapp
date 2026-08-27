import { UsuariosModule } from './usuarios.module';
import { UsuariosController } from './usuarios.controller';
import { PerfisAcessoController } from './perfis-acesso.controller';

describe('UsuariosModule — ordem das rotas aninhadas', () => {
  it('registra PerfisAcessoController antes de UsuariosController', () => {
    const controllers = Reflect.getMetadata(
      'controllers',
      UsuariosModule,
    ) as unknown[];

    expect(controllers.indexOf(PerfisAcessoController)).toBeGreaterThan(-1);
    expect(controllers.indexOf(UsuariosController)).toBeGreaterThan(-1);
    expect(controllers.indexOf(PerfisAcessoController)).toBeLessThan(
      controllers.indexOf(UsuariosController),
    );
  });

  it('declara GET /usuarios/perfis estático antes de GET /usuarios/:id', () => {
    expect(
      Reflect.getMetadata('path', UsuariosController.prototype.listarPerfis),
    ).toBe('perfis');
    expect(
      Reflect.getMetadata('path', UsuariosController.prototype.obter),
    ).toBe(':id');
  });
});
