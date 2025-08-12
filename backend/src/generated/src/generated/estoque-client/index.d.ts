/**
 * Client
 **/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types; // general types
import $Public = runtime.Types.Public;
import $Utils = runtime.Types.Utils;
import $Extensions = runtime.Types.Extensions;
import $Result = runtime.Types.Result;

export type PrismaPromise<T> = $Public.PrismaPromise<T>;

/**
 * Model EstoqueLocalizacao
 *
 */
export type EstoqueLocalizacao =
  $Result.DefaultSelection<Prisma.$EstoqueLocalizacaoPayload>;
/**
 * Model EstoqueItem
 *
 */
export type EstoqueItem = $Result.DefaultSelection<Prisma.$EstoqueItemPayload>;
/**
 * Model EstoqueMovimentacao
 *
 */
export type EstoqueMovimentacao =
  $Result.DefaultSelection<Prisma.$EstoqueMovimentacaoPayload>;
/**
 * Model EstoqueLote
 *
 */
export type EstoqueLote = $Result.DefaultSelection<Prisma.$EstoqueLotePayload>;
/**
 * Model EstoqueSobra
 *
 */
export type EstoqueSobra =
  $Result.DefaultSelection<Prisma.$EstoqueSobraPayload>;
/**
 * Model EstoqueAproveitamento
 *
 */
export type EstoqueAproveitamento =
  $Result.DefaultSelection<Prisma.$EstoqueAproveitamentoPayload>;

/**
 * Enums
 */
export namespace $Enums {
  export const TipoMovimentacao: {
    ENTRADA: 'ENTRADA';
    SAIDA: 'SAIDA';
    AJUSTE: 'AJUSTE';
    INVENTARIO: 'INVENTARIO';
    TRANSFERENCIA: 'TRANSFERENCIA';
  };

  export type TipoMovimentacao =
    (typeof TipoMovimentacao)[keyof typeof TipoMovimentacao];

  export const StatusLote: {
    ATIVO: 'ATIVO';
    VENCIDO: 'VENCIDO';
    CONSUMIDO: 'CONSUMIDO';
    BLOQUEADO: 'BLOQUEADO';
  };

  export type StatusLote = (typeof StatusLote)[keyof typeof StatusLote];

  export const StatusSobra: {
    DISPONIVEL: 'DISPONIVEL';
    APROVEITADA: 'APROVEITADA';
    VENCIDA: 'VENCIDA';
    DESCARTADA: 'DESCARTADA';
    RESERVADA: 'RESERVADA';
  };

  export type StatusSobra = (typeof StatusSobra)[keyof typeof StatusSobra];
}

export type TipoMovimentacao = $Enums.TipoMovimentacao;

export const TipoMovimentacao: typeof $Enums.TipoMovimentacao;

export type StatusLote = $Enums.StatusLote;

export const StatusLote: typeof $Enums.StatusLote;

export type StatusSobra = $Enums.StatusSobra;

export const StatusSobra: typeof $Enums.StatusSobra;

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more EstoqueLocalizacaos
 * const estoqueLocalizacaos = await prisma.estoqueLocalizacao.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions
    ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition>
      ? Prisma.GetEvents<ClientOptions['log']>
      : never
    : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] };

  /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more EstoqueLocalizacaos
   * const estoqueLocalizacaos = await prisma.estoqueLocalizacao.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(
    optionsArg?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>,
  );
  $on<V extends U>(
    eventType: V,
    callback: (
      event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent,
    ) => void,
  ): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void;

  /**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(
    query: string,
    ...values: any[]
  ): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(
    query: TemplateStringsArray | Prisma.Sql,
    ...values: any[]
  ): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(
    query: string,
    ...values: any[]
  ): Prisma.PrismaPromise<T>;

  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(
    arg: [...P],
    options?: { isolationLevel?: Prisma.TransactionIsolationLevel },
  ): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>;

  $transaction<R>(
    fn: (
      prisma: Omit<PrismaClient, runtime.ITXClientDenyList>,
    ) => $Utils.JsPromise<R>,
    options?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    },
  ): $Utils.JsPromise<R>;

  $extends: $Extensions.ExtendsHook<
    'extends',
    Prisma.TypeMapCb<ClientOptions>,
    ExtArgs,
    $Utils.Call<
      Prisma.TypeMapCb<ClientOptions>,
      {
        extArgs: ExtArgs;
      }
    >
  >;

  /**
   * `prisma.estoqueLocalizacao`: Exposes CRUD operations for the **EstoqueLocalizacao** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more EstoqueLocalizacaos
   * const estoqueLocalizacaos = await prisma.estoqueLocalizacao.findMany()
   * ```
   */
  get estoqueLocalizacao(): Prisma.EstoqueLocalizacaoDelegate<
    ExtArgs,
    ClientOptions
  >;

  /**
   * `prisma.estoqueItem`: Exposes CRUD operations for the **EstoqueItem** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more EstoqueItems
   * const estoqueItems = await prisma.estoqueItem.findMany()
   * ```
   */
  get estoqueItem(): Prisma.EstoqueItemDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.estoqueMovimentacao`: Exposes CRUD operations for the **EstoqueMovimentacao** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more EstoqueMovimentacaos
   * const estoqueMovimentacaos = await prisma.estoqueMovimentacao.findMany()
   * ```
   */
  get estoqueMovimentacao(): Prisma.EstoqueMovimentacaoDelegate<
    ExtArgs,
    ClientOptions
  >;

  /**
   * `prisma.estoqueLote`: Exposes CRUD operations for the **EstoqueLote** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more EstoqueLotes
   * const estoqueLotes = await prisma.estoqueLote.findMany()
   * ```
   */
  get estoqueLote(): Prisma.EstoqueLoteDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.estoqueSobra`: Exposes CRUD operations for the **EstoqueSobra** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more EstoqueSobras
   * const estoqueSobras = await prisma.estoqueSobra.findMany()
   * ```
   */
  get estoqueSobra(): Prisma.EstoqueSobraDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.estoqueAproveitamento`: Exposes CRUD operations for the **EstoqueAproveitamento** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more EstoqueAproveitamentos
   * const estoqueAproveitamentos = await prisma.estoqueAproveitamento.findMany()
   * ```
   */
  get estoqueAproveitamento(): Prisma.EstoqueAproveitamentoDelegate<
    ExtArgs,
    ClientOptions
  >;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF;

  export type PrismaPromise<T> = $Public.PrismaPromise<T>;

  /**
   * Validator
   */
  export import validator = runtime.Public.validator;

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError;
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError;
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError;
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError;
  export import PrismaClientValidationError = runtime.PrismaClientValidationError;

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag;
  export import empty = runtime.empty;
  export import join = runtime.join;
  export import raw = runtime.raw;
  export import Sql = runtime.Sql;

  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal;

  export type DecimalJsLike = runtime.DecimalJsLike;

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics;
  export type Metric<T> = runtime.Metric<T>;
  export type MetricHistogram = runtime.MetricHistogram;
  export type MetricHistogramBucket = runtime.MetricHistogramBucket;

  /**
   * Extensions
   */
  export import Extension = $Extensions.UserArgs;
  export import getExtensionContext = runtime.Extensions.getExtensionContext;
  export import Args = $Public.Args;
  export import Payload = $Public.Payload;
  export import Result = $Public.Result;
  export import Exact = $Public.Exact;

  /**
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
   */
  export type PrismaVersion = {
    client: string;
  };

  export const prismaVersion: PrismaVersion;

  /**
   * Utility Types
   */

  export import JsonObject = runtime.JsonObject;
  export import JsonArray = runtime.JsonArray;
  export import JsonValue = runtime.JsonValue;
  export import InputJsonObject = runtime.InputJsonObject;
  export import InputJsonArray = runtime.InputJsonArray;
  export import InputJsonValue = runtime.InputJsonValue;

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
     * Type of `Prisma.DbNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class DbNull {
      private DbNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.JsonNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class JsonNull {
      private JsonNull: never;
      private constructor();
    }

    /**
     * Type of `Prisma.AnyNull`.
     *
     * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
     *
     * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
     */
    class AnyNull {
      private AnyNull: never;
      private constructor();
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull;

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull;

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull;

  type SelectAndInclude = {
    select: any;
    include: any;
  };

  type SelectAndOmit = {
    select: any;
    omit: any;
  };

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> =
    T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<
    T extends (...args: any) => $Utils.JsPromise<any>,
  > = PromiseType<ReturnType<T>>;

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
    [P in K]: T[P];
  };

  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K;
  }[keyof T];

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K;
  };

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>;

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & (T extends SelectAndInclude
    ? 'Please either choose `select` or `include`.'
    : T extends SelectAndOmit
      ? 'Please either choose `select` or `omit`.'
      : {});

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  } & K;

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> = T extends object
    ? U extends object
      ? (Without<T, U> & U) | (Without<U, T> & T)
      : U
    : T;

  /**
   * Is T a Record?
   */
  type IsObject<T extends any> =
    T extends Array<any>
      ? False
      : T extends Date
        ? False
        : T extends Uint8Array
          ? False
          : T extends bigint
            ? False
            : T extends object
              ? True
              : False;

  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T;

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O>; // With K possibilities
    }[K];

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>;

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<
    __Either<O, K>
  >;

  type _Either<O extends object, K extends Key, strict extends Boolean> = {
    1: EitherStrict<O, K>;
    0: EitherLoose<O, K>;
  }[strict];

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1,
  > = O extends unknown ? _Either<O, K, strict> : never;

  export type Union = any;

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K];
  } & {};

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never;

  export type Overwrite<O extends object, O1 extends object> = {
    [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<
    Overwrite<
      U,
      {
        [K in keyof U]-?: At<U, K>;
      }
    >
  >;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O
    ? O[K]
    : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown
    ? AtStrict<O, K>
    : never;
  export type At<
    O extends object,
    K extends Key,
    strict extends Boolean = 1,
  > = {
    1: AtStrict<O, K>;
    0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function
    ? A
    : {
        [K in keyof A]: A[K];
      } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
      ?
          | (K extends keyof O ? { [P in K]: O[P] } & O : O)
          | ({ [P in keyof O as P extends K ? P : never]-?: O[P] } & O)
      : never
  >;

  type _Strict<U, _U = U> = U extends unknown
    ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>>
    : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False;

  // /**
  // 1
  // */
  export type True = 1;

  /**
  0
  */
  export type False = 0;

  export type Not<B extends Boolean> = {
    0: 1;
    1: 0;
  }[B];

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
      ? 1
      : 0;

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >;

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0;
      1: 1;
    };
    1: {
      0: 1;
      1: 1;
    };
  }[B1][B2];

  export type Keys<U extends Union> = U extends unknown ? keyof U : never;

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;

  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object
    ? {
        [P in keyof T]: P extends keyof O ? O[P] : never;
      }
    : never;

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>,
  > = IsObject<T> extends True ? U : T;

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<
            UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never
          >
        : never
      : {} extends FieldPaths<T[K]>
        ? never
        : K;
  }[keyof T];

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never;
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>;
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T;

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<
    T,
    K extends Enumerable<keyof T> | keyof T,
  > = Prisma__Pick<T, MaybeTupleToUnion<K>>;

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}`
    ? never
    : T;

  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>;

  type FieldRefInputType<Model, FieldType> = Model extends never
    ? never
    : FieldRef<Model, FieldType>;

  export const ModelName: {
    EstoqueLocalizacao: 'EstoqueLocalizacao';
    EstoqueItem: 'EstoqueItem';
    EstoqueMovimentacao: 'EstoqueMovimentacao';
    EstoqueLote: 'EstoqueLote';
    EstoqueSobra: 'EstoqueSobra';
    EstoqueAproveitamento: 'EstoqueAproveitamento';
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName];

  export type Datasources = {
    estoqueDb?: Datasource;
  };

  interface TypeMapCb<ClientOptions = {}>
    extends $Utils.Fn<
      { extArgs: $Extensions.InternalArgs },
      $Utils.Record<string, any>
    > {
    returns: Prisma.TypeMap<
      this['params']['extArgs'],
      ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}
    >;
  }

  export type TypeMap<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > = {
    globalOmitOptions: {
      omit: GlobalOmitOptions;
    };
    meta: {
      modelProps:
        | 'estoqueLocalizacao'
        | 'estoqueItem'
        | 'estoqueMovimentacao'
        | 'estoqueLote'
        | 'estoqueSobra'
        | 'estoqueAproveitamento';
      txIsolationLevel: Prisma.TransactionIsolationLevel;
    };
    model: {
      EstoqueLocalizacao: {
        payload: Prisma.$EstoqueLocalizacaoPayload<ExtArgs>;
        fields: Prisma.EstoqueLocalizacaoFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.EstoqueLocalizacaoFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.EstoqueLocalizacaoFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>;
          };
          findFirst: {
            args: Prisma.EstoqueLocalizacaoFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.EstoqueLocalizacaoFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>;
          };
          findMany: {
            args: Prisma.EstoqueLocalizacaoFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>[];
          };
          create: {
            args: Prisma.EstoqueLocalizacaoCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>;
          };
          createMany: {
            args: Prisma.EstoqueLocalizacaoCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.EstoqueLocalizacaoDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>;
          };
          update: {
            args: Prisma.EstoqueLocalizacaoUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>;
          };
          deleteMany: {
            args: Prisma.EstoqueLocalizacaoDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.EstoqueLocalizacaoUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.EstoqueLocalizacaoUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>;
          };
          aggregate: {
            args: Prisma.EstoqueLocalizacaoAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateEstoqueLocalizacao>;
          };
          groupBy: {
            args: Prisma.EstoqueLocalizacaoGroupByArgs<ExtArgs>;
            result: $Utils.Optional<EstoqueLocalizacaoGroupByOutputType>[];
          };
          count: {
            args: Prisma.EstoqueLocalizacaoCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<EstoqueLocalizacaoCountAggregateOutputType>
              | number;
          };
        };
      };
      EstoqueItem: {
        payload: Prisma.$EstoqueItemPayload<ExtArgs>;
        fields: Prisma.EstoqueItemFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.EstoqueItemFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.EstoqueItemFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>;
          };
          findFirst: {
            args: Prisma.EstoqueItemFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.EstoqueItemFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>;
          };
          findMany: {
            args: Prisma.EstoqueItemFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>[];
          };
          create: {
            args: Prisma.EstoqueItemCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>;
          };
          createMany: {
            args: Prisma.EstoqueItemCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.EstoqueItemDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>;
          };
          update: {
            args: Prisma.EstoqueItemUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>;
          };
          deleteMany: {
            args: Prisma.EstoqueItemDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.EstoqueItemUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.EstoqueItemUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>;
          };
          aggregate: {
            args: Prisma.EstoqueItemAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateEstoqueItem>;
          };
          groupBy: {
            args: Prisma.EstoqueItemGroupByArgs<ExtArgs>;
            result: $Utils.Optional<EstoqueItemGroupByOutputType>[];
          };
          count: {
            args: Prisma.EstoqueItemCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<EstoqueItemCountAggregateOutputType>
              | number;
          };
        };
      };
      EstoqueMovimentacao: {
        payload: Prisma.$EstoqueMovimentacaoPayload<ExtArgs>;
        fields: Prisma.EstoqueMovimentacaoFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.EstoqueMovimentacaoFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.EstoqueMovimentacaoFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>;
          };
          findFirst: {
            args: Prisma.EstoqueMovimentacaoFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.EstoqueMovimentacaoFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>;
          };
          findMany: {
            args: Prisma.EstoqueMovimentacaoFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>[];
          };
          create: {
            args: Prisma.EstoqueMovimentacaoCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>;
          };
          createMany: {
            args: Prisma.EstoqueMovimentacaoCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.EstoqueMovimentacaoDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>;
          };
          update: {
            args: Prisma.EstoqueMovimentacaoUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>;
          };
          deleteMany: {
            args: Prisma.EstoqueMovimentacaoDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.EstoqueMovimentacaoUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.EstoqueMovimentacaoUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>;
          };
          aggregate: {
            args: Prisma.EstoqueMovimentacaoAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateEstoqueMovimentacao>;
          };
          groupBy: {
            args: Prisma.EstoqueMovimentacaoGroupByArgs<ExtArgs>;
            result: $Utils.Optional<EstoqueMovimentacaoGroupByOutputType>[];
          };
          count: {
            args: Prisma.EstoqueMovimentacaoCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<EstoqueMovimentacaoCountAggregateOutputType>
              | number;
          };
        };
      };
      EstoqueLote: {
        payload: Prisma.$EstoqueLotePayload<ExtArgs>;
        fields: Prisma.EstoqueLoteFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.EstoqueLoteFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.EstoqueLoteFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>;
          };
          findFirst: {
            args: Prisma.EstoqueLoteFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.EstoqueLoteFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>;
          };
          findMany: {
            args: Prisma.EstoqueLoteFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>[];
          };
          create: {
            args: Prisma.EstoqueLoteCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>;
          };
          createMany: {
            args: Prisma.EstoqueLoteCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.EstoqueLoteDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>;
          };
          update: {
            args: Prisma.EstoqueLoteUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>;
          };
          deleteMany: {
            args: Prisma.EstoqueLoteDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.EstoqueLoteUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.EstoqueLoteUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>;
          };
          aggregate: {
            args: Prisma.EstoqueLoteAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateEstoqueLote>;
          };
          groupBy: {
            args: Prisma.EstoqueLoteGroupByArgs<ExtArgs>;
            result: $Utils.Optional<EstoqueLoteGroupByOutputType>[];
          };
          count: {
            args: Prisma.EstoqueLoteCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<EstoqueLoteCountAggregateOutputType>
              | number;
          };
        };
      };
      EstoqueSobra: {
        payload: Prisma.$EstoqueSobraPayload<ExtArgs>;
        fields: Prisma.EstoqueSobraFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.EstoqueSobraFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.EstoqueSobraFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload>;
          };
          findFirst: {
            args: Prisma.EstoqueSobraFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.EstoqueSobraFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload>;
          };
          findMany: {
            args: Prisma.EstoqueSobraFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload>[];
          };
          create: {
            args: Prisma.EstoqueSobraCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload>;
          };
          createMany: {
            args: Prisma.EstoqueSobraCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.EstoqueSobraDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload>;
          };
          update: {
            args: Prisma.EstoqueSobraUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload>;
          };
          deleteMany: {
            args: Prisma.EstoqueSobraDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.EstoqueSobraUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.EstoqueSobraUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueSobraPayload>;
          };
          aggregate: {
            args: Prisma.EstoqueSobraAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateEstoqueSobra>;
          };
          groupBy: {
            args: Prisma.EstoqueSobraGroupByArgs<ExtArgs>;
            result: $Utils.Optional<EstoqueSobraGroupByOutputType>[];
          };
          count: {
            args: Prisma.EstoqueSobraCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<EstoqueSobraCountAggregateOutputType>
              | number;
          };
        };
      };
      EstoqueAproveitamento: {
        payload: Prisma.$EstoqueAproveitamentoPayload<ExtArgs>;
        fields: Prisma.EstoqueAproveitamentoFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.EstoqueAproveitamentoFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.EstoqueAproveitamentoFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload>;
          };
          findFirst: {
            args: Prisma.EstoqueAproveitamentoFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.EstoqueAproveitamentoFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload>;
          };
          findMany: {
            args: Prisma.EstoqueAproveitamentoFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload>[];
          };
          create: {
            args: Prisma.EstoqueAproveitamentoCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload>;
          };
          createMany: {
            args: Prisma.EstoqueAproveitamentoCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.EstoqueAproveitamentoDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload>;
          };
          update: {
            args: Prisma.EstoqueAproveitamentoUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload>;
          };
          deleteMany: {
            args: Prisma.EstoqueAproveitamentoDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.EstoqueAproveitamentoUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.EstoqueAproveitamentoUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$EstoqueAproveitamentoPayload>;
          };
          aggregate: {
            args: Prisma.EstoqueAproveitamentoAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateEstoqueAproveitamento>;
          };
          groupBy: {
            args: Prisma.EstoqueAproveitamentoGroupByArgs<ExtArgs>;
            result: $Utils.Optional<EstoqueAproveitamentoGroupByOutputType>[];
          };
          count: {
            args: Prisma.EstoqueAproveitamentoCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<EstoqueAproveitamentoCountAggregateOutputType>
              | number;
          };
        };
      };
    };
  } & {
    other: {
      payload: any;
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]];
          result: any;
        };
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]];
          result: any;
        };
      };
    };
  };
  export const defineExtension: $Extensions.ExtendsHook<
    'define',
    Prisma.TypeMapCb,
    $Extensions.DefaultArgs
  >;
  export type DefaultPrismaClient = PrismaClient;
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal';
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources;
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string;
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat;
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     *
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[];
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number;
      timeout?: number;
      isolationLevel?: Prisma.TransactionIsolationLevel;
    };
    /**
     * Global configuration for omitting model fields by default.
     *
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig;
  }
  export type GlobalOmitConfig = {
    estoqueLocalizacao?: EstoqueLocalizacaoOmit;
    estoqueItem?: EstoqueItemOmit;
    estoqueMovimentacao?: EstoqueMovimentacaoOmit;
    estoqueLote?: EstoqueLoteOmit;
    estoqueSobra?: EstoqueSobraOmit;
    estoqueAproveitamento?: EstoqueAproveitamentoOmit;
  };

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error';
  export type LogDefinition = {
    level: LogLevel;
    emit: 'stdout' | 'event';
  };

  export type GetLogType<T extends LogLevel | LogDefinition> =
    T extends LogDefinition
      ? T['emit'] extends 'event'
        ? T['level']
        : never
      : never;
  export type GetEvents<T extends any> =
    T extends Array<LogLevel | LogDefinition>
      ?
          | GetLogType<T[0]>
          | GetLogType<T[1]>
          | GetLogType<T[2]>
          | GetLogType<T[3]>
      : never;

  export type QueryEvent = {
    timestamp: Date;
    query: string;
    params: string;
    duration: number;
    target: string;
  };

  export type LogEvent = {
    timestamp: Date;
    message: string;
    target: string;
  };
  /* End Types for Logging */

  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy';

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName;
    action: PrismaAction;
    args: any;
    dataPath: string[];
    runInTransaction: boolean;
  };

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>;

  // tested in getLogLevel.test.ts
  export function getLogLevel(
    log: Array<LogLevel | LogDefinition>,
  ): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<
    Prisma.DefaultPrismaClient,
    runtime.ITXClientDenyList
  >;

  export type Datasource = {
    url?: string;
  };

  /**
   * Count Types
   */

  /**
   * Count Type EstoqueLocalizacaoCountOutputType
   */

  export type EstoqueLocalizacaoCountOutputType = {
    estoques: number;
  };

  export type EstoqueLocalizacaoCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoques?: boolean | EstoqueLocalizacaoCountOutputTypeCountEstoquesArgs;
  };

  // Custom InputTypes
  /**
   * EstoqueLocalizacaoCountOutputType without action
   */
  export type EstoqueLocalizacaoCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacaoCountOutputType
     */
    select?: EstoqueLocalizacaoCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * EstoqueLocalizacaoCountOutputType without action
   */
  export type EstoqueLocalizacaoCountOutputTypeCountEstoquesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueItemWhereInput;
  };

  /**
   * Count Type EstoqueItemCountOutputType
   */

  export type EstoqueItemCountOutputType = {
    movimentacoes: number;
    lotes: number;
    sobras: number;
  };

  export type EstoqueItemCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    movimentacoes?: boolean | EstoqueItemCountOutputTypeCountMovimentacoesArgs;
    lotes?: boolean | EstoqueItemCountOutputTypeCountLotesArgs;
    sobras?: boolean | EstoqueItemCountOutputTypeCountSobrasArgs;
  };

  // Custom InputTypes
  /**
   * EstoqueItemCountOutputType without action
   */
  export type EstoqueItemCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItemCountOutputType
     */
    select?: EstoqueItemCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * EstoqueItemCountOutputType without action
   */
  export type EstoqueItemCountOutputTypeCountMovimentacoesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueMovimentacaoWhereInput;
  };

  /**
   * EstoqueItemCountOutputType without action
   */
  export type EstoqueItemCountOutputTypeCountLotesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueLoteWhereInput;
  };

  /**
   * EstoqueItemCountOutputType without action
   */
  export type EstoqueItemCountOutputTypeCountSobrasArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueSobraWhereInput;
  };

  /**
   * Count Type EstoqueSobraCountOutputType
   */

  export type EstoqueSobraCountOutputType = {
    aproveitamentos: number;
  };

  export type EstoqueSobraCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    aproveitamentos?:
      | boolean
      | EstoqueSobraCountOutputTypeCountAproveitamentosArgs;
  };

  // Custom InputTypes
  /**
   * EstoqueSobraCountOutputType without action
   */
  export type EstoqueSobraCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobraCountOutputType
     */
    select?: EstoqueSobraCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * EstoqueSobraCountOutputType without action
   */
  export type EstoqueSobraCountOutputTypeCountAproveitamentosArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueAproveitamentoWhereInput;
  };

  /**
   * Models
   */

  /**
   * Model EstoqueLocalizacao
   */

  export type AggregateEstoqueLocalizacao = {
    _count: EstoqueLocalizacaoCountAggregateOutputType | null;
    _avg: EstoqueLocalizacaoAvgAggregateOutputType | null;
    _sum: EstoqueLocalizacaoSumAggregateOutputType | null;
    _min: EstoqueLocalizacaoMinAggregateOutputType | null;
    _max: EstoqueLocalizacaoMaxAggregateOutputType | null;
  };

  export type EstoqueLocalizacaoAvgAggregateOutputType = {
    capacidade: Decimal | null;
  };

  export type EstoqueLocalizacaoSumAggregateOutputType = {
    capacidade: Decimal | null;
  };

  export type EstoqueLocalizacaoMinAggregateOutputType = {
    id: string | null;
    codigo: string | null;
    deposito: string | null;
    corredor: string | null;
    prateleira: string | null;
    nivel: string | null;
    posicao: string | null;
    descricao: string | null;
    capacidade: Decimal | null;
    ativo: boolean | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type EstoqueLocalizacaoMaxAggregateOutputType = {
    id: string | null;
    codigo: string | null;
    deposito: string | null;
    corredor: string | null;
    prateleira: string | null;
    nivel: string | null;
    posicao: string | null;
    descricao: string | null;
    capacidade: Decimal | null;
    ativo: boolean | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type EstoqueLocalizacaoCountAggregateOutputType = {
    id: number;
    codigo: number;
    deposito: number;
    corredor: number;
    prateleira: number;
    nivel: number;
    posicao: number;
    descricao: number;
    capacidade: number;
    ativo: number;
    lojaId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type EstoqueLocalizacaoAvgAggregateInputType = {
    capacidade?: true;
  };

  export type EstoqueLocalizacaoSumAggregateInputType = {
    capacidade?: true;
  };

  export type EstoqueLocalizacaoMinAggregateInputType = {
    id?: true;
    codigo?: true;
    deposito?: true;
    corredor?: true;
    prateleira?: true;
    nivel?: true;
    posicao?: true;
    descricao?: true;
    capacidade?: true;
    ativo?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type EstoqueLocalizacaoMaxAggregateInputType = {
    id?: true;
    codigo?: true;
    deposito?: true;
    corredor?: true;
    prateleira?: true;
    nivel?: true;
    posicao?: true;
    descricao?: true;
    capacidade?: true;
    ativo?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type EstoqueLocalizacaoCountAggregateInputType = {
    id?: true;
    codigo?: true;
    deposito?: true;
    corredor?: true;
    prateleira?: true;
    nivel?: true;
    posicao?: true;
    descricao?: true;
    capacidade?: true;
    ativo?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type EstoqueLocalizacaoAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueLocalizacao to aggregate.
     */
    where?: EstoqueLocalizacaoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueLocalizacaos to fetch.
     */
    orderBy?:
      | EstoqueLocalizacaoOrderByWithRelationInput
      | EstoqueLocalizacaoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: EstoqueLocalizacaoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueLocalizacaos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueLocalizacaos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned EstoqueLocalizacaos
     **/
    _count?: true | EstoqueLocalizacaoCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: EstoqueLocalizacaoAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: EstoqueLocalizacaoSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: EstoqueLocalizacaoMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: EstoqueLocalizacaoMaxAggregateInputType;
  };

  export type GetEstoqueLocalizacaoAggregateType<
    T extends EstoqueLocalizacaoAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateEstoqueLocalizacao]: P extends
      | '_count'
      | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstoqueLocalizacao[P]>
      : GetScalarType<T[P], AggregateEstoqueLocalizacao[P]>;
  };

  export type EstoqueLocalizacaoGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueLocalizacaoWhereInput;
    orderBy?:
      | EstoqueLocalizacaoOrderByWithAggregationInput
      | EstoqueLocalizacaoOrderByWithAggregationInput[];
    by: EstoqueLocalizacaoScalarFieldEnum[] | EstoqueLocalizacaoScalarFieldEnum;
    having?: EstoqueLocalizacaoScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EstoqueLocalizacaoCountAggregateInputType | true;
    _avg?: EstoqueLocalizacaoAvgAggregateInputType;
    _sum?: EstoqueLocalizacaoSumAggregateInputType;
    _min?: EstoqueLocalizacaoMinAggregateInputType;
    _max?: EstoqueLocalizacaoMaxAggregateInputType;
  };

  export type EstoqueLocalizacaoGroupByOutputType = {
    id: string;
    codigo: string;
    deposito: string;
    corredor: string | null;
    prateleira: string | null;
    nivel: string | null;
    posicao: string | null;
    descricao: string | null;
    capacidade: Decimal | null;
    ativo: boolean;
    lojaId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: EstoqueLocalizacaoCountAggregateOutputType | null;
    _avg: EstoqueLocalizacaoAvgAggregateOutputType | null;
    _sum: EstoqueLocalizacaoSumAggregateOutputType | null;
    _min: EstoqueLocalizacaoMinAggregateOutputType | null;
    _max: EstoqueLocalizacaoMaxAggregateOutputType | null;
  };

  type GetEstoqueLocalizacaoGroupByPayload<
    T extends EstoqueLocalizacaoGroupByArgs,
  > = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EstoqueLocalizacaoGroupByOutputType, T['by']> & {
        [P in keyof T &
          keyof EstoqueLocalizacaoGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], EstoqueLocalizacaoGroupByOutputType[P]>
          : GetScalarType<T[P], EstoqueLocalizacaoGroupByOutputType[P]>;
      }
    >
  >;

  export type EstoqueLocalizacaoSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      codigo?: boolean;
      deposito?: boolean;
      corredor?: boolean;
      prateleira?: boolean;
      nivel?: boolean;
      posicao?: boolean;
      descricao?: boolean;
      capacidade?: boolean;
      ativo?: boolean;
      lojaId?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      estoques?: boolean | EstoqueLocalizacao$estoquesArgs<ExtArgs>;
      _count?: boolean | EstoqueLocalizacaoCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['estoqueLocalizacao']
  >;

  export type EstoqueLocalizacaoSelectScalar = {
    id?: boolean;
    codigo?: boolean;
    deposito?: boolean;
    corredor?: boolean;
    prateleira?: boolean;
    nivel?: boolean;
    posicao?: boolean;
    descricao?: boolean;
    capacidade?: boolean;
    ativo?: boolean;
    lojaId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type EstoqueLocalizacaoOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'codigo'
    | 'deposito'
    | 'corredor'
    | 'prateleira'
    | 'nivel'
    | 'posicao'
    | 'descricao'
    | 'capacidade'
    | 'ativo'
    | 'lojaId'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['estoqueLocalizacao']
  >;
  export type EstoqueLocalizacaoInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoques?: boolean | EstoqueLocalizacao$estoquesArgs<ExtArgs>;
    _count?: boolean | EstoqueLocalizacaoCountOutputTypeDefaultArgs<ExtArgs>;
  };

  export type $EstoqueLocalizacaoPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'EstoqueLocalizacao';
    objects: {
      estoques: Prisma.$EstoqueItemPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        codigo: string;
        deposito: string;
        corredor: string | null;
        prateleira: string | null;
        nivel: string | null;
        posicao: string | null;
        descricao: string | null;
        capacidade: Prisma.Decimal | null;
        ativo: boolean;
        lojaId: string;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['estoqueLocalizacao']
    >;
    composites: {};
  };

  type EstoqueLocalizacaoGetPayload<
    S extends boolean | null | undefined | EstoqueLocalizacaoDefaultArgs,
  > = $Result.GetResult<Prisma.$EstoqueLocalizacaoPayload, S>;

  type EstoqueLocalizacaoCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    EstoqueLocalizacaoFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: EstoqueLocalizacaoCountAggregateInputType | true;
  };

  export interface EstoqueLocalizacaoDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['EstoqueLocalizacao'];
      meta: { name: 'EstoqueLocalizacao' };
    };
    /**
     * Find zero or one EstoqueLocalizacao that matches the filter.
     * @param {EstoqueLocalizacaoFindUniqueArgs} args - Arguments to find a EstoqueLocalizacao
     * @example
     * // Get one EstoqueLocalizacao
     * const estoqueLocalizacao = await prisma.estoqueLocalizacao.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EstoqueLocalizacaoFindUniqueArgs>(
      args: SelectSubset<T, EstoqueLocalizacaoFindUniqueArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one EstoqueLocalizacao that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EstoqueLocalizacaoFindUniqueOrThrowArgs} args - Arguments to find a EstoqueLocalizacao
     * @example
     * // Get one EstoqueLocalizacao
     * const estoqueLocalizacao = await prisma.estoqueLocalizacao.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EstoqueLocalizacaoFindUniqueOrThrowArgs>(
      args: SelectSubset<T, EstoqueLocalizacaoFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueLocalizacao that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLocalizacaoFindFirstArgs} args - Arguments to find a EstoqueLocalizacao
     * @example
     * // Get one EstoqueLocalizacao
     * const estoqueLocalizacao = await prisma.estoqueLocalizacao.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EstoqueLocalizacaoFindFirstArgs>(
      args?: SelectSubset<T, EstoqueLocalizacaoFindFirstArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueLocalizacao that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLocalizacaoFindFirstOrThrowArgs} args - Arguments to find a EstoqueLocalizacao
     * @example
     * // Get one EstoqueLocalizacao
     * const estoqueLocalizacao = await prisma.estoqueLocalizacao.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EstoqueLocalizacaoFindFirstOrThrowArgs>(
      args?: SelectSubset<T, EstoqueLocalizacaoFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more EstoqueLocalizacaos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLocalizacaoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EstoqueLocalizacaos
     * const estoqueLocalizacaos = await prisma.estoqueLocalizacao.findMany()
     *
     * // Get first 10 EstoqueLocalizacaos
     * const estoqueLocalizacaos = await prisma.estoqueLocalizacao.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const estoqueLocalizacaoWithIdOnly = await prisma.estoqueLocalizacao.findMany({ select: { id: true } })
     *
     */
    findMany<T extends EstoqueLocalizacaoFindManyArgs>(
      args?: SelectSubset<T, EstoqueLocalizacaoFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a EstoqueLocalizacao.
     * @param {EstoqueLocalizacaoCreateArgs} args - Arguments to create a EstoqueLocalizacao.
     * @example
     * // Create one EstoqueLocalizacao
     * const EstoqueLocalizacao = await prisma.estoqueLocalizacao.create({
     *   data: {
     *     // ... data to create a EstoqueLocalizacao
     *   }
     * })
     *
     */
    create<T extends EstoqueLocalizacaoCreateArgs>(
      args: SelectSubset<T, EstoqueLocalizacaoCreateArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many EstoqueLocalizacaos.
     * @param {EstoqueLocalizacaoCreateManyArgs} args - Arguments to create many EstoqueLocalizacaos.
     * @example
     * // Create many EstoqueLocalizacaos
     * const estoqueLocalizacao = await prisma.estoqueLocalizacao.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends EstoqueLocalizacaoCreateManyArgs>(
      args?: SelectSubset<T, EstoqueLocalizacaoCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a EstoqueLocalizacao.
     * @param {EstoqueLocalizacaoDeleteArgs} args - Arguments to delete one EstoqueLocalizacao.
     * @example
     * // Delete one EstoqueLocalizacao
     * const EstoqueLocalizacao = await prisma.estoqueLocalizacao.delete({
     *   where: {
     *     // ... filter to delete one EstoqueLocalizacao
     *   }
     * })
     *
     */
    delete<T extends EstoqueLocalizacaoDeleteArgs>(
      args: SelectSubset<T, EstoqueLocalizacaoDeleteArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one EstoqueLocalizacao.
     * @param {EstoqueLocalizacaoUpdateArgs} args - Arguments to update one EstoqueLocalizacao.
     * @example
     * // Update one EstoqueLocalizacao
     * const estoqueLocalizacao = await prisma.estoqueLocalizacao.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends EstoqueLocalizacaoUpdateArgs>(
      args: SelectSubset<T, EstoqueLocalizacaoUpdateArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more EstoqueLocalizacaos.
     * @param {EstoqueLocalizacaoDeleteManyArgs} args - Arguments to filter EstoqueLocalizacaos to delete.
     * @example
     * // Delete a few EstoqueLocalizacaos
     * const { count } = await prisma.estoqueLocalizacao.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends EstoqueLocalizacaoDeleteManyArgs>(
      args?: SelectSubset<T, EstoqueLocalizacaoDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more EstoqueLocalizacaos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLocalizacaoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EstoqueLocalizacaos
     * const estoqueLocalizacao = await prisma.estoqueLocalizacao.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends EstoqueLocalizacaoUpdateManyArgs>(
      args: SelectSubset<T, EstoqueLocalizacaoUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one EstoqueLocalizacao.
     * @param {EstoqueLocalizacaoUpsertArgs} args - Arguments to update or create a EstoqueLocalizacao.
     * @example
     * // Update or create a EstoqueLocalizacao
     * const estoqueLocalizacao = await prisma.estoqueLocalizacao.upsert({
     *   create: {
     *     // ... data to create a EstoqueLocalizacao
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EstoqueLocalizacao we want to update
     *   }
     * })
     */
    upsert<T extends EstoqueLocalizacaoUpsertArgs>(
      args: SelectSubset<T, EstoqueLocalizacaoUpsertArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of EstoqueLocalizacaos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLocalizacaoCountArgs} args - Arguments to filter EstoqueLocalizacaos to count.
     * @example
     * // Count the number of EstoqueLocalizacaos
     * const count = await prisma.estoqueLocalizacao.count({
     *   where: {
     *     // ... the filter for the EstoqueLocalizacaos we want to count
     *   }
     * })
     **/
    count<T extends EstoqueLocalizacaoCountArgs>(
      args?: Subset<T, EstoqueLocalizacaoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<
              T['select'],
              EstoqueLocalizacaoCountAggregateOutputType
            >
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a EstoqueLocalizacao.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLocalizacaoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends EstoqueLocalizacaoAggregateArgs>(
      args: Subset<T, EstoqueLocalizacaoAggregateArgs>,
    ): Prisma.PrismaPromise<GetEstoqueLocalizacaoAggregateType<T>>;

    /**
     * Group by EstoqueLocalizacao.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLocalizacaoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends EstoqueLocalizacaoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EstoqueLocalizacaoGroupByArgs['orderBy'] }
        : { orderBy?: EstoqueLocalizacaoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, EstoqueLocalizacaoGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetEstoqueLocalizacaoGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the EstoqueLocalizacao model
     */
    readonly fields: EstoqueLocalizacaoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EstoqueLocalizacao.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EstoqueLocalizacaoClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    estoques<T extends EstoqueLocalizacao$estoquesArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueLocalizacao$estoquesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$EstoqueItemPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the EstoqueLocalizacao model
   */
  interface EstoqueLocalizacaoFieldRefs {
    readonly id: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly codigo: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly deposito: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly corredor: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly prateleira: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly nivel: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly posicao: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly descricao: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly capacidade: FieldRef<'EstoqueLocalizacao', 'Decimal'>;
    readonly ativo: FieldRef<'EstoqueLocalizacao', 'Boolean'>;
    readonly lojaId: FieldRef<'EstoqueLocalizacao', 'String'>;
    readonly createdAt: FieldRef<'EstoqueLocalizacao', 'DateTime'>;
    readonly updatedAt: FieldRef<'EstoqueLocalizacao', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * EstoqueLocalizacao findUnique
   */
  export type EstoqueLocalizacaoFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLocalizacao to fetch.
     */
    where: EstoqueLocalizacaoWhereUniqueInput;
  };

  /**
   * EstoqueLocalizacao findUniqueOrThrow
   */
  export type EstoqueLocalizacaoFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLocalizacao to fetch.
     */
    where: EstoqueLocalizacaoWhereUniqueInput;
  };

  /**
   * EstoqueLocalizacao findFirst
   */
  export type EstoqueLocalizacaoFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLocalizacao to fetch.
     */
    where?: EstoqueLocalizacaoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueLocalizacaos to fetch.
     */
    orderBy?:
      | EstoqueLocalizacaoOrderByWithRelationInput
      | EstoqueLocalizacaoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueLocalizacaos.
     */
    cursor?: EstoqueLocalizacaoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueLocalizacaos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueLocalizacaos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueLocalizacaos.
     */
    distinct?:
      | EstoqueLocalizacaoScalarFieldEnum
      | EstoqueLocalizacaoScalarFieldEnum[];
  };

  /**
   * EstoqueLocalizacao findFirstOrThrow
   */
  export type EstoqueLocalizacaoFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLocalizacao to fetch.
     */
    where?: EstoqueLocalizacaoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueLocalizacaos to fetch.
     */
    orderBy?:
      | EstoqueLocalizacaoOrderByWithRelationInput
      | EstoqueLocalizacaoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueLocalizacaos.
     */
    cursor?: EstoqueLocalizacaoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueLocalizacaos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueLocalizacaos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueLocalizacaos.
     */
    distinct?:
      | EstoqueLocalizacaoScalarFieldEnum
      | EstoqueLocalizacaoScalarFieldEnum[];
  };

  /**
   * EstoqueLocalizacao findMany
   */
  export type EstoqueLocalizacaoFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLocalizacaos to fetch.
     */
    where?: EstoqueLocalizacaoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueLocalizacaos to fetch.
     */
    orderBy?:
      | EstoqueLocalizacaoOrderByWithRelationInput
      | EstoqueLocalizacaoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing EstoqueLocalizacaos.
     */
    cursor?: EstoqueLocalizacaoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueLocalizacaos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueLocalizacaos.
     */
    skip?: number;
    distinct?:
      | EstoqueLocalizacaoScalarFieldEnum
      | EstoqueLocalizacaoScalarFieldEnum[];
  };

  /**
   * EstoqueLocalizacao create
   */
  export type EstoqueLocalizacaoCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * The data needed to create a EstoqueLocalizacao.
     */
    data: XOR<
      EstoqueLocalizacaoCreateInput,
      EstoqueLocalizacaoUncheckedCreateInput
    >;
  };

  /**
   * EstoqueLocalizacao createMany
   */
  export type EstoqueLocalizacaoCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many EstoqueLocalizacaos.
     */
    data:
      | EstoqueLocalizacaoCreateManyInput
      | EstoqueLocalizacaoCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * EstoqueLocalizacao update
   */
  export type EstoqueLocalizacaoUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * The data needed to update a EstoqueLocalizacao.
     */
    data: XOR<
      EstoqueLocalizacaoUpdateInput,
      EstoqueLocalizacaoUncheckedUpdateInput
    >;
    /**
     * Choose, which EstoqueLocalizacao to update.
     */
    where: EstoqueLocalizacaoWhereUniqueInput;
  };

  /**
   * EstoqueLocalizacao updateMany
   */
  export type EstoqueLocalizacaoUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update EstoqueLocalizacaos.
     */
    data: XOR<
      EstoqueLocalizacaoUpdateManyMutationInput,
      EstoqueLocalizacaoUncheckedUpdateManyInput
    >;
    /**
     * Filter which EstoqueLocalizacaos to update
     */
    where?: EstoqueLocalizacaoWhereInput;
    /**
     * Limit how many EstoqueLocalizacaos to update.
     */
    limit?: number;
  };

  /**
   * EstoqueLocalizacao upsert
   */
  export type EstoqueLocalizacaoUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * The filter to search for the EstoqueLocalizacao to update in case it exists.
     */
    where: EstoqueLocalizacaoWhereUniqueInput;
    /**
     * In case the EstoqueLocalizacao found by the `where` argument doesn't exist, create a new EstoqueLocalizacao with this data.
     */
    create: XOR<
      EstoqueLocalizacaoCreateInput,
      EstoqueLocalizacaoUncheckedCreateInput
    >;
    /**
     * In case the EstoqueLocalizacao was found with the provided `where` argument, update it with this data.
     */
    update: XOR<
      EstoqueLocalizacaoUpdateInput,
      EstoqueLocalizacaoUncheckedUpdateInput
    >;
  };

  /**
   * EstoqueLocalizacao delete
   */
  export type EstoqueLocalizacaoDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
    /**
     * Filter which EstoqueLocalizacao to delete.
     */
    where: EstoqueLocalizacaoWhereUniqueInput;
  };

  /**
   * EstoqueLocalizacao deleteMany
   */
  export type EstoqueLocalizacaoDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueLocalizacaos to delete
     */
    where?: EstoqueLocalizacaoWhereInput;
    /**
     * Limit how many EstoqueLocalizacaos to delete.
     */
    limit?: number;
  };

  /**
   * EstoqueLocalizacao.estoques
   */
  export type EstoqueLocalizacao$estoquesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    where?: EstoqueItemWhereInput;
    orderBy?:
      | EstoqueItemOrderByWithRelationInput
      | EstoqueItemOrderByWithRelationInput[];
    cursor?: EstoqueItemWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: EstoqueItemScalarFieldEnum | EstoqueItemScalarFieldEnum[];
  };

  /**
   * EstoqueLocalizacao without action
   */
  export type EstoqueLocalizacaoDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null;
  };

  /**
   * Model EstoqueItem
   */

  export type AggregateEstoqueItem = {
    _count: EstoqueItemCountAggregateOutputType | null;
    _avg: EstoqueItemAvgAggregateOutputType | null;
    _sum: EstoqueItemSumAggregateOutputType | null;
    _min: EstoqueItemMinAggregateOutputType | null;
    _max: EstoqueItemMaxAggregateOutputType | null;
  };

  export type EstoqueItemAvgAggregateOutputType = {
    quantidadeAtual: Decimal | null;
    quantidadeReservada: Decimal | null;
    estoqueMinimo: Decimal | null;
    estoqueMaximo: Decimal | null;
  };

  export type EstoqueItemSumAggregateOutputType = {
    quantidadeAtual: Decimal | null;
    quantidadeReservada: Decimal | null;
    estoqueMinimo: Decimal | null;
    estoqueMaximo: Decimal | null;
  };

  export type EstoqueItemMinAggregateOutputType = {
    id: string | null;
    insumoId: string | null;
    localizacaoId: string | null;
    quantidadeAtual: Decimal | null;
    quantidadeReservada: Decimal | null;
    estoqueMinimo: Decimal | null;
    estoqueMaximo: Decimal | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    dataUltimaMov: Date | null;
  };

  export type EstoqueItemMaxAggregateOutputType = {
    id: string | null;
    insumoId: string | null;
    localizacaoId: string | null;
    quantidadeAtual: Decimal | null;
    quantidadeReservada: Decimal | null;
    estoqueMinimo: Decimal | null;
    estoqueMaximo: Decimal | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
    dataUltimaMov: Date | null;
  };

  export type EstoqueItemCountAggregateOutputType = {
    id: number;
    insumoId: number;
    localizacaoId: number;
    quantidadeAtual: number;
    quantidadeReservada: number;
    estoqueMinimo: number;
    estoqueMaximo: number;
    lojaId: number;
    createdAt: number;
    updatedAt: number;
    dataUltimaMov: number;
    _all: number;
  };

  export type EstoqueItemAvgAggregateInputType = {
    quantidadeAtual?: true;
    quantidadeReservada?: true;
    estoqueMinimo?: true;
    estoqueMaximo?: true;
  };

  export type EstoqueItemSumAggregateInputType = {
    quantidadeAtual?: true;
    quantidadeReservada?: true;
    estoqueMinimo?: true;
    estoqueMaximo?: true;
  };

  export type EstoqueItemMinAggregateInputType = {
    id?: true;
    insumoId?: true;
    localizacaoId?: true;
    quantidadeAtual?: true;
    quantidadeReservada?: true;
    estoqueMinimo?: true;
    estoqueMaximo?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
    dataUltimaMov?: true;
  };

  export type EstoqueItemMaxAggregateInputType = {
    id?: true;
    insumoId?: true;
    localizacaoId?: true;
    quantidadeAtual?: true;
    quantidadeReservada?: true;
    estoqueMinimo?: true;
    estoqueMaximo?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
    dataUltimaMov?: true;
  };

  export type EstoqueItemCountAggregateInputType = {
    id?: true;
    insumoId?: true;
    localizacaoId?: true;
    quantidadeAtual?: true;
    quantidadeReservada?: true;
    estoqueMinimo?: true;
    estoqueMaximo?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
    dataUltimaMov?: true;
    _all?: true;
  };

  export type EstoqueItemAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueItem to aggregate.
     */
    where?: EstoqueItemWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueItems to fetch.
     */
    orderBy?:
      | EstoqueItemOrderByWithRelationInput
      | EstoqueItemOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: EstoqueItemWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueItems from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueItems.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned EstoqueItems
     **/
    _count?: true | EstoqueItemCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: EstoqueItemAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: EstoqueItemSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: EstoqueItemMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: EstoqueItemMaxAggregateInputType;
  };

  export type GetEstoqueItemAggregateType<T extends EstoqueItemAggregateArgs> =
    {
      [P in keyof T & keyof AggregateEstoqueItem]: P extends '_count' | 'count'
        ? T[P] extends true
          ? number
          : GetScalarType<T[P], AggregateEstoqueItem[P]>
        : GetScalarType<T[P], AggregateEstoqueItem[P]>;
    };

  export type EstoqueItemGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueItemWhereInput;
    orderBy?:
      | EstoqueItemOrderByWithAggregationInput
      | EstoqueItemOrderByWithAggregationInput[];
    by: EstoqueItemScalarFieldEnum[] | EstoqueItemScalarFieldEnum;
    having?: EstoqueItemScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EstoqueItemCountAggregateInputType | true;
    _avg?: EstoqueItemAvgAggregateInputType;
    _sum?: EstoqueItemSumAggregateInputType;
    _min?: EstoqueItemMinAggregateInputType;
    _max?: EstoqueItemMaxAggregateInputType;
  };

  export type EstoqueItemGroupByOutputType = {
    id: string;
    insumoId: string;
    localizacaoId: string;
    quantidadeAtual: Decimal;
    quantidadeReservada: Decimal;
    estoqueMinimo: Decimal;
    estoqueMaximo: Decimal | null;
    lojaId: string;
    createdAt: Date;
    updatedAt: Date;
    dataUltimaMov: Date | null;
    _count: EstoqueItemCountAggregateOutputType | null;
    _avg: EstoqueItemAvgAggregateOutputType | null;
    _sum: EstoqueItemSumAggregateOutputType | null;
    _min: EstoqueItemMinAggregateOutputType | null;
    _max: EstoqueItemMaxAggregateOutputType | null;
  };

  type GetEstoqueItemGroupByPayload<T extends EstoqueItemGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<EstoqueItemGroupByOutputType, T['by']> & {
          [P in keyof T &
            keyof EstoqueItemGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EstoqueItemGroupByOutputType[P]>
            : GetScalarType<T[P], EstoqueItemGroupByOutputType[P]>;
        }
      >
    >;

  export type EstoqueItemSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      insumoId?: boolean;
      localizacaoId?: boolean;
      quantidadeAtual?: boolean;
      quantidadeReservada?: boolean;
      estoqueMinimo?: boolean;
      estoqueMaximo?: boolean;
      lojaId?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      dataUltimaMov?: boolean;
      localizacao?: boolean | EstoqueLocalizacaoDefaultArgs<ExtArgs>;
      movimentacoes?: boolean | EstoqueItem$movimentacoesArgs<ExtArgs>;
      lotes?: boolean | EstoqueItem$lotesArgs<ExtArgs>;
      sobras?: boolean | EstoqueItem$sobrasArgs<ExtArgs>;
      _count?: boolean | EstoqueItemCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['estoqueItem']
  >;

  export type EstoqueItemSelectScalar = {
    id?: boolean;
    insumoId?: boolean;
    localizacaoId?: boolean;
    quantidadeAtual?: boolean;
    quantidadeReservada?: boolean;
    estoqueMinimo?: boolean;
    estoqueMaximo?: boolean;
    lojaId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
    dataUltimaMov?: boolean;
  };

  export type EstoqueItemOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'insumoId'
    | 'localizacaoId'
    | 'quantidadeAtual'
    | 'quantidadeReservada'
    | 'estoqueMinimo'
    | 'estoqueMaximo'
    | 'lojaId'
    | 'createdAt'
    | 'updatedAt'
    | 'dataUltimaMov',
    ExtArgs['result']['estoqueItem']
  >;
  export type EstoqueItemInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    localizacao?: boolean | EstoqueLocalizacaoDefaultArgs<ExtArgs>;
    movimentacoes?: boolean | EstoqueItem$movimentacoesArgs<ExtArgs>;
    lotes?: boolean | EstoqueItem$lotesArgs<ExtArgs>;
    sobras?: boolean | EstoqueItem$sobrasArgs<ExtArgs>;
    _count?: boolean | EstoqueItemCountOutputTypeDefaultArgs<ExtArgs>;
  };

  export type $EstoqueItemPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'EstoqueItem';
    objects: {
      localizacao: Prisma.$EstoqueLocalizacaoPayload<ExtArgs>;
      movimentacoes: Prisma.$EstoqueMovimentacaoPayload<ExtArgs>[];
      lotes: Prisma.$EstoqueLotePayload<ExtArgs>[];
      sobras: Prisma.$EstoqueSobraPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        insumoId: string;
        localizacaoId: string;
        quantidadeAtual: Prisma.Decimal;
        quantidadeReservada: Prisma.Decimal;
        estoqueMinimo: Prisma.Decimal;
        estoqueMaximo: Prisma.Decimal | null;
        lojaId: string;
        createdAt: Date;
        updatedAt: Date;
        dataUltimaMov: Date | null;
      },
      ExtArgs['result']['estoqueItem']
    >;
    composites: {};
  };

  type EstoqueItemGetPayload<
    S extends boolean | null | undefined | EstoqueItemDefaultArgs,
  > = $Result.GetResult<Prisma.$EstoqueItemPayload, S>;

  type EstoqueItemCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    EstoqueItemFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: EstoqueItemCountAggregateInputType | true;
  };

  export interface EstoqueItemDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['EstoqueItem'];
      meta: { name: 'EstoqueItem' };
    };
    /**
     * Find zero or one EstoqueItem that matches the filter.
     * @param {EstoqueItemFindUniqueArgs} args - Arguments to find a EstoqueItem
     * @example
     * // Get one EstoqueItem
     * const estoqueItem = await prisma.estoqueItem.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EstoqueItemFindUniqueArgs>(
      args: SelectSubset<T, EstoqueItemFindUniqueArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one EstoqueItem that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EstoqueItemFindUniqueOrThrowArgs} args - Arguments to find a EstoqueItem
     * @example
     * // Get one EstoqueItem
     * const estoqueItem = await prisma.estoqueItem.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EstoqueItemFindUniqueOrThrowArgs>(
      args: SelectSubset<T, EstoqueItemFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueItem that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueItemFindFirstArgs} args - Arguments to find a EstoqueItem
     * @example
     * // Get one EstoqueItem
     * const estoqueItem = await prisma.estoqueItem.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EstoqueItemFindFirstArgs>(
      args?: SelectSubset<T, EstoqueItemFindFirstArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueItem that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueItemFindFirstOrThrowArgs} args - Arguments to find a EstoqueItem
     * @example
     * // Get one EstoqueItem
     * const estoqueItem = await prisma.estoqueItem.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EstoqueItemFindFirstOrThrowArgs>(
      args?: SelectSubset<T, EstoqueItemFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more EstoqueItems that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueItemFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EstoqueItems
     * const estoqueItems = await prisma.estoqueItem.findMany()
     *
     * // Get first 10 EstoqueItems
     * const estoqueItems = await prisma.estoqueItem.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const estoqueItemWithIdOnly = await prisma.estoqueItem.findMany({ select: { id: true } })
     *
     */
    findMany<T extends EstoqueItemFindManyArgs>(
      args?: SelectSubset<T, EstoqueItemFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a EstoqueItem.
     * @param {EstoqueItemCreateArgs} args - Arguments to create a EstoqueItem.
     * @example
     * // Create one EstoqueItem
     * const EstoqueItem = await prisma.estoqueItem.create({
     *   data: {
     *     // ... data to create a EstoqueItem
     *   }
     * })
     *
     */
    create<T extends EstoqueItemCreateArgs>(
      args: SelectSubset<T, EstoqueItemCreateArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many EstoqueItems.
     * @param {EstoqueItemCreateManyArgs} args - Arguments to create many EstoqueItems.
     * @example
     * // Create many EstoqueItems
     * const estoqueItem = await prisma.estoqueItem.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends EstoqueItemCreateManyArgs>(
      args?: SelectSubset<T, EstoqueItemCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a EstoqueItem.
     * @param {EstoqueItemDeleteArgs} args - Arguments to delete one EstoqueItem.
     * @example
     * // Delete one EstoqueItem
     * const EstoqueItem = await prisma.estoqueItem.delete({
     *   where: {
     *     // ... filter to delete one EstoqueItem
     *   }
     * })
     *
     */
    delete<T extends EstoqueItemDeleteArgs>(
      args: SelectSubset<T, EstoqueItemDeleteArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one EstoqueItem.
     * @param {EstoqueItemUpdateArgs} args - Arguments to update one EstoqueItem.
     * @example
     * // Update one EstoqueItem
     * const estoqueItem = await prisma.estoqueItem.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends EstoqueItemUpdateArgs>(
      args: SelectSubset<T, EstoqueItemUpdateArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more EstoqueItems.
     * @param {EstoqueItemDeleteManyArgs} args - Arguments to filter EstoqueItems to delete.
     * @example
     * // Delete a few EstoqueItems
     * const { count } = await prisma.estoqueItem.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends EstoqueItemDeleteManyArgs>(
      args?: SelectSubset<T, EstoqueItemDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more EstoqueItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueItemUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EstoqueItems
     * const estoqueItem = await prisma.estoqueItem.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends EstoqueItemUpdateManyArgs>(
      args: SelectSubset<T, EstoqueItemUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one EstoqueItem.
     * @param {EstoqueItemUpsertArgs} args - Arguments to update or create a EstoqueItem.
     * @example
     * // Update or create a EstoqueItem
     * const estoqueItem = await prisma.estoqueItem.upsert({
     *   create: {
     *     // ... data to create a EstoqueItem
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EstoqueItem we want to update
     *   }
     * })
     */
    upsert<T extends EstoqueItemUpsertArgs>(
      args: SelectSubset<T, EstoqueItemUpsertArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      $Result.GetResult<
        Prisma.$EstoqueItemPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of EstoqueItems.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueItemCountArgs} args - Arguments to filter EstoqueItems to count.
     * @example
     * // Count the number of EstoqueItems
     * const count = await prisma.estoqueItem.count({
     *   where: {
     *     // ... the filter for the EstoqueItems we want to count
     *   }
     * })
     **/
    count<T extends EstoqueItemCountArgs>(
      args?: Subset<T, EstoqueItemCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EstoqueItemCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a EstoqueItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueItemAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends EstoqueItemAggregateArgs>(
      args: Subset<T, EstoqueItemAggregateArgs>,
    ): Prisma.PrismaPromise<GetEstoqueItemAggregateType<T>>;

    /**
     * Group by EstoqueItem.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueItemGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends EstoqueItemGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EstoqueItemGroupByArgs['orderBy'] }
        : { orderBy?: EstoqueItemGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, EstoqueItemGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetEstoqueItemGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the EstoqueItem model
     */
    readonly fields: EstoqueItemFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EstoqueItem.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EstoqueItemClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    localizacao<T extends EstoqueLocalizacaoDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueLocalizacaoDefaultArgs<ExtArgs>>,
    ): Prisma__EstoqueLocalizacaoClient<
      | $Result.GetResult<
          Prisma.$EstoqueLocalizacaoPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    movimentacoes<T extends EstoqueItem$movimentacoesArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueItem$movimentacoesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    lotes<T extends EstoqueItem$lotesArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueItem$lotesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$EstoqueLotePayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    sobras<T extends EstoqueItem$sobrasArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueItem$sobrasArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$EstoqueSobraPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the EstoqueItem model
   */
  interface EstoqueItemFieldRefs {
    readonly id: FieldRef<'EstoqueItem', 'String'>;
    readonly insumoId: FieldRef<'EstoqueItem', 'String'>;
    readonly localizacaoId: FieldRef<'EstoqueItem', 'String'>;
    readonly quantidadeAtual: FieldRef<'EstoqueItem', 'Decimal'>;
    readonly quantidadeReservada: FieldRef<'EstoqueItem', 'Decimal'>;
    readonly estoqueMinimo: FieldRef<'EstoqueItem', 'Decimal'>;
    readonly estoqueMaximo: FieldRef<'EstoqueItem', 'Decimal'>;
    readonly lojaId: FieldRef<'EstoqueItem', 'String'>;
    readonly createdAt: FieldRef<'EstoqueItem', 'DateTime'>;
    readonly updatedAt: FieldRef<'EstoqueItem', 'DateTime'>;
    readonly dataUltimaMov: FieldRef<'EstoqueItem', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * EstoqueItem findUnique
   */
  export type EstoqueItemFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueItem to fetch.
     */
    where: EstoqueItemWhereUniqueInput;
  };

  /**
   * EstoqueItem findUniqueOrThrow
   */
  export type EstoqueItemFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueItem to fetch.
     */
    where: EstoqueItemWhereUniqueInput;
  };

  /**
   * EstoqueItem findFirst
   */
  export type EstoqueItemFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueItem to fetch.
     */
    where?: EstoqueItemWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueItems to fetch.
     */
    orderBy?:
      | EstoqueItemOrderByWithRelationInput
      | EstoqueItemOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueItems.
     */
    cursor?: EstoqueItemWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueItems from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueItems.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueItems.
     */
    distinct?: EstoqueItemScalarFieldEnum | EstoqueItemScalarFieldEnum[];
  };

  /**
   * EstoqueItem findFirstOrThrow
   */
  export type EstoqueItemFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueItem to fetch.
     */
    where?: EstoqueItemWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueItems to fetch.
     */
    orderBy?:
      | EstoqueItemOrderByWithRelationInput
      | EstoqueItemOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueItems.
     */
    cursor?: EstoqueItemWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueItems from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueItems.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueItems.
     */
    distinct?: EstoqueItemScalarFieldEnum | EstoqueItemScalarFieldEnum[];
  };

  /**
   * EstoqueItem findMany
   */
  export type EstoqueItemFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueItems to fetch.
     */
    where?: EstoqueItemWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueItems to fetch.
     */
    orderBy?:
      | EstoqueItemOrderByWithRelationInput
      | EstoqueItemOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing EstoqueItems.
     */
    cursor?: EstoqueItemWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueItems from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueItems.
     */
    skip?: number;
    distinct?: EstoqueItemScalarFieldEnum | EstoqueItemScalarFieldEnum[];
  };

  /**
   * EstoqueItem create
   */
  export type EstoqueItemCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * The data needed to create a EstoqueItem.
     */
    data: XOR<EstoqueItemCreateInput, EstoqueItemUncheckedCreateInput>;
  };

  /**
   * EstoqueItem createMany
   */
  export type EstoqueItemCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many EstoqueItems.
     */
    data: EstoqueItemCreateManyInput | EstoqueItemCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * EstoqueItem update
   */
  export type EstoqueItemUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * The data needed to update a EstoqueItem.
     */
    data: XOR<EstoqueItemUpdateInput, EstoqueItemUncheckedUpdateInput>;
    /**
     * Choose, which EstoqueItem to update.
     */
    where: EstoqueItemWhereUniqueInput;
  };

  /**
   * EstoqueItem updateMany
   */
  export type EstoqueItemUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update EstoqueItems.
     */
    data: XOR<
      EstoqueItemUpdateManyMutationInput,
      EstoqueItemUncheckedUpdateManyInput
    >;
    /**
     * Filter which EstoqueItems to update
     */
    where?: EstoqueItemWhereInput;
    /**
     * Limit how many EstoqueItems to update.
     */
    limit?: number;
  };

  /**
   * EstoqueItem upsert
   */
  export type EstoqueItemUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * The filter to search for the EstoqueItem to update in case it exists.
     */
    where: EstoqueItemWhereUniqueInput;
    /**
     * In case the EstoqueItem found by the `where` argument doesn't exist, create a new EstoqueItem with this data.
     */
    create: XOR<EstoqueItemCreateInput, EstoqueItemUncheckedCreateInput>;
    /**
     * In case the EstoqueItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EstoqueItemUpdateInput, EstoqueItemUncheckedUpdateInput>;
  };

  /**
   * EstoqueItem delete
   */
  export type EstoqueItemDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
    /**
     * Filter which EstoqueItem to delete.
     */
    where: EstoqueItemWhereUniqueInput;
  };

  /**
   * EstoqueItem deleteMany
   */
  export type EstoqueItemDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueItems to delete
     */
    where?: EstoqueItemWhereInput;
    /**
     * Limit how many EstoqueItems to delete.
     */
    limit?: number;
  };

  /**
   * EstoqueItem.movimentacoes
   */
  export type EstoqueItem$movimentacoesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    where?: EstoqueMovimentacaoWhereInput;
    orderBy?:
      | EstoqueMovimentacaoOrderByWithRelationInput
      | EstoqueMovimentacaoOrderByWithRelationInput[];
    cursor?: EstoqueMovimentacaoWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?:
      | EstoqueMovimentacaoScalarFieldEnum
      | EstoqueMovimentacaoScalarFieldEnum[];
  };

  /**
   * EstoqueItem.lotes
   */
  export type EstoqueItem$lotesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    where?: EstoqueLoteWhereInput;
    orderBy?:
      | EstoqueLoteOrderByWithRelationInput
      | EstoqueLoteOrderByWithRelationInput[];
    cursor?: EstoqueLoteWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: EstoqueLoteScalarFieldEnum | EstoqueLoteScalarFieldEnum[];
  };

  /**
   * EstoqueItem.sobras
   */
  export type EstoqueItem$sobrasArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    where?: EstoqueSobraWhereInput;
    orderBy?:
      | EstoqueSobraOrderByWithRelationInput
      | EstoqueSobraOrderByWithRelationInput[];
    cursor?: EstoqueSobraWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: EstoqueSobraScalarFieldEnum | EstoqueSobraScalarFieldEnum[];
  };

  /**
   * EstoqueItem without action
   */
  export type EstoqueItemDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null;
  };

  /**
   * Model EstoqueMovimentacao
   */

  export type AggregateEstoqueMovimentacao = {
    _count: EstoqueMovimentacaoCountAggregateOutputType | null;
    _avg: EstoqueMovimentacaoAvgAggregateOutputType | null;
    _sum: EstoqueMovimentacaoSumAggregateOutputType | null;
    _min: EstoqueMovimentacaoMinAggregateOutputType | null;
    _max: EstoqueMovimentacaoMaxAggregateOutputType | null;
  };

  export type EstoqueMovimentacaoAvgAggregateOutputType = {
    quantidade: Decimal | null;
    quantidadeAnterior: Decimal | null;
    quantidadePosterior: Decimal | null;
  };

  export type EstoqueMovimentacaoSumAggregateOutputType = {
    quantidade: Decimal | null;
    quantidadeAnterior: Decimal | null;
    quantidadePosterior: Decimal | null;
  };

  export type EstoqueMovimentacaoMinAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    tipo: $Enums.TipoMovimentacao | null;
    quantidade: Decimal | null;
    quantidadeAnterior: Decimal | null;
    quantidadePosterior: Decimal | null;
    documentoRef: string | null;
    orcamentoId: string | null;
    usuarioId: string | null;
    lojaId: string | null;
    dataMovimentacao: Date | null;
    observacoes: string | null;
  };

  export type EstoqueMovimentacaoMaxAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    tipo: $Enums.TipoMovimentacao | null;
    quantidade: Decimal | null;
    quantidadeAnterior: Decimal | null;
    quantidadePosterior: Decimal | null;
    documentoRef: string | null;
    orcamentoId: string | null;
    usuarioId: string | null;
    lojaId: string | null;
    dataMovimentacao: Date | null;
    observacoes: string | null;
  };

  export type EstoqueMovimentacaoCountAggregateOutputType = {
    id: number;
    estoqueId: number;
    tipo: number;
    quantidade: number;
    quantidadeAnterior: number;
    quantidadePosterior: number;
    documentoRef: number;
    orcamentoId: number;
    usuarioId: number;
    lojaId: number;
    dataMovimentacao: number;
    observacoes: number;
    _all: number;
  };

  export type EstoqueMovimentacaoAvgAggregateInputType = {
    quantidade?: true;
    quantidadeAnterior?: true;
    quantidadePosterior?: true;
  };

  export type EstoqueMovimentacaoSumAggregateInputType = {
    quantidade?: true;
    quantidadeAnterior?: true;
    quantidadePosterior?: true;
  };

  export type EstoqueMovimentacaoMinAggregateInputType = {
    id?: true;
    estoqueId?: true;
    tipo?: true;
    quantidade?: true;
    quantidadeAnterior?: true;
    quantidadePosterior?: true;
    documentoRef?: true;
    orcamentoId?: true;
    usuarioId?: true;
    lojaId?: true;
    dataMovimentacao?: true;
    observacoes?: true;
  };

  export type EstoqueMovimentacaoMaxAggregateInputType = {
    id?: true;
    estoqueId?: true;
    tipo?: true;
    quantidade?: true;
    quantidadeAnterior?: true;
    quantidadePosterior?: true;
    documentoRef?: true;
    orcamentoId?: true;
    usuarioId?: true;
    lojaId?: true;
    dataMovimentacao?: true;
    observacoes?: true;
  };

  export type EstoqueMovimentacaoCountAggregateInputType = {
    id?: true;
    estoqueId?: true;
    tipo?: true;
    quantidade?: true;
    quantidadeAnterior?: true;
    quantidadePosterior?: true;
    documentoRef?: true;
    orcamentoId?: true;
    usuarioId?: true;
    lojaId?: true;
    dataMovimentacao?: true;
    observacoes?: true;
    _all?: true;
  };

  export type EstoqueMovimentacaoAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueMovimentacao to aggregate.
     */
    where?: EstoqueMovimentacaoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueMovimentacaos to fetch.
     */
    orderBy?:
      | EstoqueMovimentacaoOrderByWithRelationInput
      | EstoqueMovimentacaoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: EstoqueMovimentacaoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueMovimentacaos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueMovimentacaos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned EstoqueMovimentacaos
     **/
    _count?: true | EstoqueMovimentacaoCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: EstoqueMovimentacaoAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: EstoqueMovimentacaoSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: EstoqueMovimentacaoMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: EstoqueMovimentacaoMaxAggregateInputType;
  };

  export type GetEstoqueMovimentacaoAggregateType<
    T extends EstoqueMovimentacaoAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateEstoqueMovimentacao]: P extends
      | '_count'
      | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstoqueMovimentacao[P]>
      : GetScalarType<T[P], AggregateEstoqueMovimentacao[P]>;
  };

  export type EstoqueMovimentacaoGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueMovimentacaoWhereInput;
    orderBy?:
      | EstoqueMovimentacaoOrderByWithAggregationInput
      | EstoqueMovimentacaoOrderByWithAggregationInput[];
    by:
      | EstoqueMovimentacaoScalarFieldEnum[]
      | EstoqueMovimentacaoScalarFieldEnum;
    having?: EstoqueMovimentacaoScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EstoqueMovimentacaoCountAggregateInputType | true;
    _avg?: EstoqueMovimentacaoAvgAggregateInputType;
    _sum?: EstoqueMovimentacaoSumAggregateInputType;
    _min?: EstoqueMovimentacaoMinAggregateInputType;
    _max?: EstoqueMovimentacaoMaxAggregateInputType;
  };

  export type EstoqueMovimentacaoGroupByOutputType = {
    id: string;
    estoqueId: string;
    tipo: $Enums.TipoMovimentacao;
    quantidade: Decimal;
    quantidadeAnterior: Decimal;
    quantidadePosterior: Decimal;
    documentoRef: string | null;
    orcamentoId: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao: Date;
    observacoes: string | null;
    _count: EstoqueMovimentacaoCountAggregateOutputType | null;
    _avg: EstoqueMovimentacaoAvgAggregateOutputType | null;
    _sum: EstoqueMovimentacaoSumAggregateOutputType | null;
    _min: EstoqueMovimentacaoMinAggregateOutputType | null;
    _max: EstoqueMovimentacaoMaxAggregateOutputType | null;
  };

  type GetEstoqueMovimentacaoGroupByPayload<
    T extends EstoqueMovimentacaoGroupByArgs,
  > = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EstoqueMovimentacaoGroupByOutputType, T['by']> & {
        [P in keyof T &
          keyof EstoqueMovimentacaoGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], EstoqueMovimentacaoGroupByOutputType[P]>
          : GetScalarType<T[P], EstoqueMovimentacaoGroupByOutputType[P]>;
      }
    >
  >;

  export type EstoqueMovimentacaoSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      estoqueId?: boolean;
      tipo?: boolean;
      quantidade?: boolean;
      quantidadeAnterior?: boolean;
      quantidadePosterior?: boolean;
      documentoRef?: boolean;
      orcamentoId?: boolean;
      usuarioId?: boolean;
      lojaId?: boolean;
      dataMovimentacao?: boolean;
      observacoes?: boolean;
      estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['estoqueMovimentacao']
  >;

  export type EstoqueMovimentacaoSelectScalar = {
    id?: boolean;
    estoqueId?: boolean;
    tipo?: boolean;
    quantidade?: boolean;
    quantidadeAnterior?: boolean;
    quantidadePosterior?: boolean;
    documentoRef?: boolean;
    orcamentoId?: boolean;
    usuarioId?: boolean;
    lojaId?: boolean;
    dataMovimentacao?: boolean;
    observacoes?: boolean;
  };

  export type EstoqueMovimentacaoOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'estoqueId'
    | 'tipo'
    | 'quantidade'
    | 'quantidadeAnterior'
    | 'quantidadePosterior'
    | 'documentoRef'
    | 'orcamentoId'
    | 'usuarioId'
    | 'lojaId'
    | 'dataMovimentacao'
    | 'observacoes',
    ExtArgs['result']['estoqueMovimentacao']
  >;
  export type EstoqueMovimentacaoInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>;
  };

  export type $EstoqueMovimentacaoPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'EstoqueMovimentacao';
    objects: {
      estoque: Prisma.$EstoqueItemPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        estoqueId: string;
        tipo: $Enums.TipoMovimentacao;
        quantidade: Prisma.Decimal;
        quantidadeAnterior: Prisma.Decimal;
        quantidadePosterior: Prisma.Decimal;
        documentoRef: string | null;
        orcamentoId: string | null;
        usuarioId: string;
        lojaId: string;
        dataMovimentacao: Date;
        observacoes: string | null;
      },
      ExtArgs['result']['estoqueMovimentacao']
    >;
    composites: {};
  };

  type EstoqueMovimentacaoGetPayload<
    S extends boolean | null | undefined | EstoqueMovimentacaoDefaultArgs,
  > = $Result.GetResult<Prisma.$EstoqueMovimentacaoPayload, S>;

  type EstoqueMovimentacaoCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    EstoqueMovimentacaoFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: EstoqueMovimentacaoCountAggregateInputType | true;
  };

  export interface EstoqueMovimentacaoDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['EstoqueMovimentacao'];
      meta: { name: 'EstoqueMovimentacao' };
    };
    /**
     * Find zero or one EstoqueMovimentacao that matches the filter.
     * @param {EstoqueMovimentacaoFindUniqueArgs} args - Arguments to find a EstoqueMovimentacao
     * @example
     * // Get one EstoqueMovimentacao
     * const estoqueMovimentacao = await prisma.estoqueMovimentacao.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EstoqueMovimentacaoFindUniqueArgs>(
      args: SelectSubset<T, EstoqueMovimentacaoFindUniqueArgs<ExtArgs>>,
    ): Prisma__EstoqueMovimentacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one EstoqueMovimentacao that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EstoqueMovimentacaoFindUniqueOrThrowArgs} args - Arguments to find a EstoqueMovimentacao
     * @example
     * // Get one EstoqueMovimentacao
     * const estoqueMovimentacao = await prisma.estoqueMovimentacao.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EstoqueMovimentacaoFindUniqueOrThrowArgs>(
      args: SelectSubset<T, EstoqueMovimentacaoFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueMovimentacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueMovimentacao that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueMovimentacaoFindFirstArgs} args - Arguments to find a EstoqueMovimentacao
     * @example
     * // Get one EstoqueMovimentacao
     * const estoqueMovimentacao = await prisma.estoqueMovimentacao.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EstoqueMovimentacaoFindFirstArgs>(
      args?: SelectSubset<T, EstoqueMovimentacaoFindFirstArgs<ExtArgs>>,
    ): Prisma__EstoqueMovimentacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueMovimentacao that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueMovimentacaoFindFirstOrThrowArgs} args - Arguments to find a EstoqueMovimentacao
     * @example
     * // Get one EstoqueMovimentacao
     * const estoqueMovimentacao = await prisma.estoqueMovimentacao.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EstoqueMovimentacaoFindFirstOrThrowArgs>(
      args?: SelectSubset<T, EstoqueMovimentacaoFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueMovimentacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more EstoqueMovimentacaos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueMovimentacaoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EstoqueMovimentacaos
     * const estoqueMovimentacaos = await prisma.estoqueMovimentacao.findMany()
     *
     * // Get first 10 EstoqueMovimentacaos
     * const estoqueMovimentacaos = await prisma.estoqueMovimentacao.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const estoqueMovimentacaoWithIdOnly = await prisma.estoqueMovimentacao.findMany({ select: { id: true } })
     *
     */
    findMany<T extends EstoqueMovimentacaoFindManyArgs>(
      args?: SelectSubset<T, EstoqueMovimentacaoFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a EstoqueMovimentacao.
     * @param {EstoqueMovimentacaoCreateArgs} args - Arguments to create a EstoqueMovimentacao.
     * @example
     * // Create one EstoqueMovimentacao
     * const EstoqueMovimentacao = await prisma.estoqueMovimentacao.create({
     *   data: {
     *     // ... data to create a EstoqueMovimentacao
     *   }
     * })
     *
     */
    create<T extends EstoqueMovimentacaoCreateArgs>(
      args: SelectSubset<T, EstoqueMovimentacaoCreateArgs<ExtArgs>>,
    ): Prisma__EstoqueMovimentacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many EstoqueMovimentacaos.
     * @param {EstoqueMovimentacaoCreateManyArgs} args - Arguments to create many EstoqueMovimentacaos.
     * @example
     * // Create many EstoqueMovimentacaos
     * const estoqueMovimentacao = await prisma.estoqueMovimentacao.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends EstoqueMovimentacaoCreateManyArgs>(
      args?: SelectSubset<T, EstoqueMovimentacaoCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a EstoqueMovimentacao.
     * @param {EstoqueMovimentacaoDeleteArgs} args - Arguments to delete one EstoqueMovimentacao.
     * @example
     * // Delete one EstoqueMovimentacao
     * const EstoqueMovimentacao = await prisma.estoqueMovimentacao.delete({
     *   where: {
     *     // ... filter to delete one EstoqueMovimentacao
     *   }
     * })
     *
     */
    delete<T extends EstoqueMovimentacaoDeleteArgs>(
      args: SelectSubset<T, EstoqueMovimentacaoDeleteArgs<ExtArgs>>,
    ): Prisma__EstoqueMovimentacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one EstoqueMovimentacao.
     * @param {EstoqueMovimentacaoUpdateArgs} args - Arguments to update one EstoqueMovimentacao.
     * @example
     * // Update one EstoqueMovimentacao
     * const estoqueMovimentacao = await prisma.estoqueMovimentacao.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends EstoqueMovimentacaoUpdateArgs>(
      args: SelectSubset<T, EstoqueMovimentacaoUpdateArgs<ExtArgs>>,
    ): Prisma__EstoqueMovimentacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more EstoqueMovimentacaos.
     * @param {EstoqueMovimentacaoDeleteManyArgs} args - Arguments to filter EstoqueMovimentacaos to delete.
     * @example
     * // Delete a few EstoqueMovimentacaos
     * const { count } = await prisma.estoqueMovimentacao.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends EstoqueMovimentacaoDeleteManyArgs>(
      args?: SelectSubset<T, EstoqueMovimentacaoDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more EstoqueMovimentacaos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueMovimentacaoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EstoqueMovimentacaos
     * const estoqueMovimentacao = await prisma.estoqueMovimentacao.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends EstoqueMovimentacaoUpdateManyArgs>(
      args: SelectSubset<T, EstoqueMovimentacaoUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one EstoqueMovimentacao.
     * @param {EstoqueMovimentacaoUpsertArgs} args - Arguments to update or create a EstoqueMovimentacao.
     * @example
     * // Update or create a EstoqueMovimentacao
     * const estoqueMovimentacao = await prisma.estoqueMovimentacao.upsert({
     *   create: {
     *     // ... data to create a EstoqueMovimentacao
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EstoqueMovimentacao we want to update
     *   }
     * })
     */
    upsert<T extends EstoqueMovimentacaoUpsertArgs>(
      args: SelectSubset<T, EstoqueMovimentacaoUpsertArgs<ExtArgs>>,
    ): Prisma__EstoqueMovimentacaoClient<
      $Result.GetResult<
        Prisma.$EstoqueMovimentacaoPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of EstoqueMovimentacaos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueMovimentacaoCountArgs} args - Arguments to filter EstoqueMovimentacaos to count.
     * @example
     * // Count the number of EstoqueMovimentacaos
     * const count = await prisma.estoqueMovimentacao.count({
     *   where: {
     *     // ... the filter for the EstoqueMovimentacaos we want to count
     *   }
     * })
     **/
    count<T extends EstoqueMovimentacaoCountArgs>(
      args?: Subset<T, EstoqueMovimentacaoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<
              T['select'],
              EstoqueMovimentacaoCountAggregateOutputType
            >
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a EstoqueMovimentacao.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueMovimentacaoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends EstoqueMovimentacaoAggregateArgs>(
      args: Subset<T, EstoqueMovimentacaoAggregateArgs>,
    ): Prisma.PrismaPromise<GetEstoqueMovimentacaoAggregateType<T>>;

    /**
     * Group by EstoqueMovimentacao.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueMovimentacaoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends EstoqueMovimentacaoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EstoqueMovimentacaoGroupByArgs['orderBy'] }
        : { orderBy?: EstoqueMovimentacaoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, EstoqueMovimentacaoGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetEstoqueMovimentacaoGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the EstoqueMovimentacao model
     */
    readonly fields: EstoqueMovimentacaoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EstoqueMovimentacao.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EstoqueMovimentacaoClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    estoque<T extends EstoqueItemDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueItemDefaultArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      | $Result.GetResult<
          Prisma.$EstoqueItemPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the EstoqueMovimentacao model
   */
  interface EstoqueMovimentacaoFieldRefs {
    readonly id: FieldRef<'EstoqueMovimentacao', 'String'>;
    readonly estoqueId: FieldRef<'EstoqueMovimentacao', 'String'>;
    readonly tipo: FieldRef<'EstoqueMovimentacao', 'TipoMovimentacao'>;
    readonly quantidade: FieldRef<'EstoqueMovimentacao', 'Decimal'>;
    readonly quantidadeAnterior: FieldRef<'EstoqueMovimentacao', 'Decimal'>;
    readonly quantidadePosterior: FieldRef<'EstoqueMovimentacao', 'Decimal'>;
    readonly documentoRef: FieldRef<'EstoqueMovimentacao', 'String'>;
    readonly orcamentoId: FieldRef<'EstoqueMovimentacao', 'String'>;
    readonly usuarioId: FieldRef<'EstoqueMovimentacao', 'String'>;
    readonly lojaId: FieldRef<'EstoqueMovimentacao', 'String'>;
    readonly dataMovimentacao: FieldRef<'EstoqueMovimentacao', 'DateTime'>;
    readonly observacoes: FieldRef<'EstoqueMovimentacao', 'String'>;
  }

  // Custom InputTypes
  /**
   * EstoqueMovimentacao findUnique
   */
  export type EstoqueMovimentacaoFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueMovimentacao to fetch.
     */
    where: EstoqueMovimentacaoWhereUniqueInput;
  };

  /**
   * EstoqueMovimentacao findUniqueOrThrow
   */
  export type EstoqueMovimentacaoFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueMovimentacao to fetch.
     */
    where: EstoqueMovimentacaoWhereUniqueInput;
  };

  /**
   * EstoqueMovimentacao findFirst
   */
  export type EstoqueMovimentacaoFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueMovimentacao to fetch.
     */
    where?: EstoqueMovimentacaoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueMovimentacaos to fetch.
     */
    orderBy?:
      | EstoqueMovimentacaoOrderByWithRelationInput
      | EstoqueMovimentacaoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueMovimentacaos.
     */
    cursor?: EstoqueMovimentacaoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueMovimentacaos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueMovimentacaos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueMovimentacaos.
     */
    distinct?:
      | EstoqueMovimentacaoScalarFieldEnum
      | EstoqueMovimentacaoScalarFieldEnum[];
  };

  /**
   * EstoqueMovimentacao findFirstOrThrow
   */
  export type EstoqueMovimentacaoFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueMovimentacao to fetch.
     */
    where?: EstoqueMovimentacaoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueMovimentacaos to fetch.
     */
    orderBy?:
      | EstoqueMovimentacaoOrderByWithRelationInput
      | EstoqueMovimentacaoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueMovimentacaos.
     */
    cursor?: EstoqueMovimentacaoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueMovimentacaos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueMovimentacaos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueMovimentacaos.
     */
    distinct?:
      | EstoqueMovimentacaoScalarFieldEnum
      | EstoqueMovimentacaoScalarFieldEnum[];
  };

  /**
   * EstoqueMovimentacao findMany
   */
  export type EstoqueMovimentacaoFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueMovimentacaos to fetch.
     */
    where?: EstoqueMovimentacaoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueMovimentacaos to fetch.
     */
    orderBy?:
      | EstoqueMovimentacaoOrderByWithRelationInput
      | EstoqueMovimentacaoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing EstoqueMovimentacaos.
     */
    cursor?: EstoqueMovimentacaoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueMovimentacaos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueMovimentacaos.
     */
    skip?: number;
    distinct?:
      | EstoqueMovimentacaoScalarFieldEnum
      | EstoqueMovimentacaoScalarFieldEnum[];
  };

  /**
   * EstoqueMovimentacao create
   */
  export type EstoqueMovimentacaoCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * The data needed to create a EstoqueMovimentacao.
     */
    data: XOR<
      EstoqueMovimentacaoCreateInput,
      EstoqueMovimentacaoUncheckedCreateInput
    >;
  };

  /**
   * EstoqueMovimentacao createMany
   */
  export type EstoqueMovimentacaoCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many EstoqueMovimentacaos.
     */
    data:
      | EstoqueMovimentacaoCreateManyInput
      | EstoqueMovimentacaoCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * EstoqueMovimentacao update
   */
  export type EstoqueMovimentacaoUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * The data needed to update a EstoqueMovimentacao.
     */
    data: XOR<
      EstoqueMovimentacaoUpdateInput,
      EstoqueMovimentacaoUncheckedUpdateInput
    >;
    /**
     * Choose, which EstoqueMovimentacao to update.
     */
    where: EstoqueMovimentacaoWhereUniqueInput;
  };

  /**
   * EstoqueMovimentacao updateMany
   */
  export type EstoqueMovimentacaoUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update EstoqueMovimentacaos.
     */
    data: XOR<
      EstoqueMovimentacaoUpdateManyMutationInput,
      EstoqueMovimentacaoUncheckedUpdateManyInput
    >;
    /**
     * Filter which EstoqueMovimentacaos to update
     */
    where?: EstoqueMovimentacaoWhereInput;
    /**
     * Limit how many EstoqueMovimentacaos to update.
     */
    limit?: number;
  };

  /**
   * EstoqueMovimentacao upsert
   */
  export type EstoqueMovimentacaoUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * The filter to search for the EstoqueMovimentacao to update in case it exists.
     */
    where: EstoqueMovimentacaoWhereUniqueInput;
    /**
     * In case the EstoqueMovimentacao found by the `where` argument doesn't exist, create a new EstoqueMovimentacao with this data.
     */
    create: XOR<
      EstoqueMovimentacaoCreateInput,
      EstoqueMovimentacaoUncheckedCreateInput
    >;
    /**
     * In case the EstoqueMovimentacao was found with the provided `where` argument, update it with this data.
     */
    update: XOR<
      EstoqueMovimentacaoUpdateInput,
      EstoqueMovimentacaoUncheckedUpdateInput
    >;
  };

  /**
   * EstoqueMovimentacao delete
   */
  export type EstoqueMovimentacaoDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
    /**
     * Filter which EstoqueMovimentacao to delete.
     */
    where: EstoqueMovimentacaoWhereUniqueInput;
  };

  /**
   * EstoqueMovimentacao deleteMany
   */
  export type EstoqueMovimentacaoDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueMovimentacaos to delete
     */
    where?: EstoqueMovimentacaoWhereInput;
    /**
     * Limit how many EstoqueMovimentacaos to delete.
     */
    limit?: number;
  };

  /**
   * EstoqueMovimentacao without action
   */
  export type EstoqueMovimentacaoDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null;
  };

  /**
   * Model EstoqueLote
   */

  export type AggregateEstoqueLote = {
    _count: EstoqueLoteCountAggregateOutputType | null;
    _avg: EstoqueLoteAvgAggregateOutputType | null;
    _sum: EstoqueLoteSumAggregateOutputType | null;
    _min: EstoqueLoteMinAggregateOutputType | null;
    _max: EstoqueLoteMaxAggregateOutputType | null;
  };

  export type EstoqueLoteAvgAggregateOutputType = {
    quantidadeLote: Decimal | null;
  };

  export type EstoqueLoteSumAggregateOutputType = {
    quantidadeLote: Decimal | null;
  };

  export type EstoqueLoteMinAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    numeroLote: string | null;
    dataFabricacao: Date | null;
    dataValidade: Date | null;
    quantidadeLote: Decimal | null;
    status: $Enums.StatusLote | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type EstoqueLoteMaxAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    numeroLote: string | null;
    dataFabricacao: Date | null;
    dataValidade: Date | null;
    quantidadeLote: Decimal | null;
    status: $Enums.StatusLote | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type EstoqueLoteCountAggregateOutputType = {
    id: number;
    estoqueId: number;
    numeroLote: number;
    dataFabricacao: number;
    dataValidade: number;
    quantidadeLote: number;
    status: number;
    lojaId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type EstoqueLoteAvgAggregateInputType = {
    quantidadeLote?: true;
  };

  export type EstoqueLoteSumAggregateInputType = {
    quantidadeLote?: true;
  };

  export type EstoqueLoteMinAggregateInputType = {
    id?: true;
    estoqueId?: true;
    numeroLote?: true;
    dataFabricacao?: true;
    dataValidade?: true;
    quantidadeLote?: true;
    status?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type EstoqueLoteMaxAggregateInputType = {
    id?: true;
    estoqueId?: true;
    numeroLote?: true;
    dataFabricacao?: true;
    dataValidade?: true;
    quantidadeLote?: true;
    status?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type EstoqueLoteCountAggregateInputType = {
    id?: true;
    estoqueId?: true;
    numeroLote?: true;
    dataFabricacao?: true;
    dataValidade?: true;
    quantidadeLote?: true;
    status?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type EstoqueLoteAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueLote to aggregate.
     */
    where?: EstoqueLoteWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueLotes to fetch.
     */
    orderBy?:
      | EstoqueLoteOrderByWithRelationInput
      | EstoqueLoteOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: EstoqueLoteWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueLotes from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueLotes.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned EstoqueLotes
     **/
    _count?: true | EstoqueLoteCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: EstoqueLoteAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: EstoqueLoteSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: EstoqueLoteMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: EstoqueLoteMaxAggregateInputType;
  };

  export type GetEstoqueLoteAggregateType<T extends EstoqueLoteAggregateArgs> =
    {
      [P in keyof T & keyof AggregateEstoqueLote]: P extends '_count' | 'count'
        ? T[P] extends true
          ? number
          : GetScalarType<T[P], AggregateEstoqueLote[P]>
        : GetScalarType<T[P], AggregateEstoqueLote[P]>;
    };

  export type EstoqueLoteGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueLoteWhereInput;
    orderBy?:
      | EstoqueLoteOrderByWithAggregationInput
      | EstoqueLoteOrderByWithAggregationInput[];
    by: EstoqueLoteScalarFieldEnum[] | EstoqueLoteScalarFieldEnum;
    having?: EstoqueLoteScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EstoqueLoteCountAggregateInputType | true;
    _avg?: EstoqueLoteAvgAggregateInputType;
    _sum?: EstoqueLoteSumAggregateInputType;
    _min?: EstoqueLoteMinAggregateInputType;
    _max?: EstoqueLoteMaxAggregateInputType;
  };

  export type EstoqueLoteGroupByOutputType = {
    id: string;
    estoqueId: string;
    numeroLote: string;
    dataFabricacao: Date | null;
    dataValidade: Date | null;
    quantidadeLote: Decimal;
    status: $Enums.StatusLote;
    lojaId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: EstoqueLoteCountAggregateOutputType | null;
    _avg: EstoqueLoteAvgAggregateOutputType | null;
    _sum: EstoqueLoteSumAggregateOutputType | null;
    _min: EstoqueLoteMinAggregateOutputType | null;
    _max: EstoqueLoteMaxAggregateOutputType | null;
  };

  type GetEstoqueLoteGroupByPayload<T extends EstoqueLoteGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<EstoqueLoteGroupByOutputType, T['by']> & {
          [P in keyof T &
            keyof EstoqueLoteGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EstoqueLoteGroupByOutputType[P]>
            : GetScalarType<T[P], EstoqueLoteGroupByOutputType[P]>;
        }
      >
    >;

  export type EstoqueLoteSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      estoqueId?: boolean;
      numeroLote?: boolean;
      dataFabricacao?: boolean;
      dataValidade?: boolean;
      quantidadeLote?: boolean;
      status?: boolean;
      lojaId?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['estoqueLote']
  >;

  export type EstoqueLoteSelectScalar = {
    id?: boolean;
    estoqueId?: boolean;
    numeroLote?: boolean;
    dataFabricacao?: boolean;
    dataValidade?: boolean;
    quantidadeLote?: boolean;
    status?: boolean;
    lojaId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type EstoqueLoteOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'estoqueId'
    | 'numeroLote'
    | 'dataFabricacao'
    | 'dataValidade'
    | 'quantidadeLote'
    | 'status'
    | 'lojaId'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['estoqueLote']
  >;
  export type EstoqueLoteInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>;
  };

  export type $EstoqueLotePayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'EstoqueLote';
    objects: {
      estoque: Prisma.$EstoqueItemPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        estoqueId: string;
        numeroLote: string;
        dataFabricacao: Date | null;
        dataValidade: Date | null;
        quantidadeLote: Prisma.Decimal;
        status: $Enums.StatusLote;
        lojaId: string;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['estoqueLote']
    >;
    composites: {};
  };

  type EstoqueLoteGetPayload<
    S extends boolean | null | undefined | EstoqueLoteDefaultArgs,
  > = $Result.GetResult<Prisma.$EstoqueLotePayload, S>;

  type EstoqueLoteCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    EstoqueLoteFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: EstoqueLoteCountAggregateInputType | true;
  };

  export interface EstoqueLoteDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['EstoqueLote'];
      meta: { name: 'EstoqueLote' };
    };
    /**
     * Find zero or one EstoqueLote that matches the filter.
     * @param {EstoqueLoteFindUniqueArgs} args - Arguments to find a EstoqueLote
     * @example
     * // Get one EstoqueLote
     * const estoqueLote = await prisma.estoqueLote.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EstoqueLoteFindUniqueArgs>(
      args: SelectSubset<T, EstoqueLoteFindUniqueArgs<ExtArgs>>,
    ): Prisma__EstoqueLoteClient<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one EstoqueLote that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EstoqueLoteFindUniqueOrThrowArgs} args - Arguments to find a EstoqueLote
     * @example
     * // Get one EstoqueLote
     * const estoqueLote = await prisma.estoqueLote.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EstoqueLoteFindUniqueOrThrowArgs>(
      args: SelectSubset<T, EstoqueLoteFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueLoteClient<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueLote that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLoteFindFirstArgs} args - Arguments to find a EstoqueLote
     * @example
     * // Get one EstoqueLote
     * const estoqueLote = await prisma.estoqueLote.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EstoqueLoteFindFirstArgs>(
      args?: SelectSubset<T, EstoqueLoteFindFirstArgs<ExtArgs>>,
    ): Prisma__EstoqueLoteClient<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueLote that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLoteFindFirstOrThrowArgs} args - Arguments to find a EstoqueLote
     * @example
     * // Get one EstoqueLote
     * const estoqueLote = await prisma.estoqueLote.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EstoqueLoteFindFirstOrThrowArgs>(
      args?: SelectSubset<T, EstoqueLoteFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueLoteClient<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more EstoqueLotes that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLoteFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EstoqueLotes
     * const estoqueLotes = await prisma.estoqueLote.findMany()
     *
     * // Get first 10 EstoqueLotes
     * const estoqueLotes = await prisma.estoqueLote.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const estoqueLoteWithIdOnly = await prisma.estoqueLote.findMany({ select: { id: true } })
     *
     */
    findMany<T extends EstoqueLoteFindManyArgs>(
      args?: SelectSubset<T, EstoqueLoteFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a EstoqueLote.
     * @param {EstoqueLoteCreateArgs} args - Arguments to create a EstoqueLote.
     * @example
     * // Create one EstoqueLote
     * const EstoqueLote = await prisma.estoqueLote.create({
     *   data: {
     *     // ... data to create a EstoqueLote
     *   }
     * })
     *
     */
    create<T extends EstoqueLoteCreateArgs>(
      args: SelectSubset<T, EstoqueLoteCreateArgs<ExtArgs>>,
    ): Prisma__EstoqueLoteClient<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many EstoqueLotes.
     * @param {EstoqueLoteCreateManyArgs} args - Arguments to create many EstoqueLotes.
     * @example
     * // Create many EstoqueLotes
     * const estoqueLote = await prisma.estoqueLote.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends EstoqueLoteCreateManyArgs>(
      args?: SelectSubset<T, EstoqueLoteCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a EstoqueLote.
     * @param {EstoqueLoteDeleteArgs} args - Arguments to delete one EstoqueLote.
     * @example
     * // Delete one EstoqueLote
     * const EstoqueLote = await prisma.estoqueLote.delete({
     *   where: {
     *     // ... filter to delete one EstoqueLote
     *   }
     * })
     *
     */
    delete<T extends EstoqueLoteDeleteArgs>(
      args: SelectSubset<T, EstoqueLoteDeleteArgs<ExtArgs>>,
    ): Prisma__EstoqueLoteClient<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one EstoqueLote.
     * @param {EstoqueLoteUpdateArgs} args - Arguments to update one EstoqueLote.
     * @example
     * // Update one EstoqueLote
     * const estoqueLote = await prisma.estoqueLote.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends EstoqueLoteUpdateArgs>(
      args: SelectSubset<T, EstoqueLoteUpdateArgs<ExtArgs>>,
    ): Prisma__EstoqueLoteClient<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more EstoqueLotes.
     * @param {EstoqueLoteDeleteManyArgs} args - Arguments to filter EstoqueLotes to delete.
     * @example
     * // Delete a few EstoqueLotes
     * const { count } = await prisma.estoqueLote.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends EstoqueLoteDeleteManyArgs>(
      args?: SelectSubset<T, EstoqueLoteDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more EstoqueLotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLoteUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EstoqueLotes
     * const estoqueLote = await prisma.estoqueLote.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends EstoqueLoteUpdateManyArgs>(
      args: SelectSubset<T, EstoqueLoteUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one EstoqueLote.
     * @param {EstoqueLoteUpsertArgs} args - Arguments to update or create a EstoqueLote.
     * @example
     * // Update or create a EstoqueLote
     * const estoqueLote = await prisma.estoqueLote.upsert({
     *   create: {
     *     // ... data to create a EstoqueLote
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EstoqueLote we want to update
     *   }
     * })
     */
    upsert<T extends EstoqueLoteUpsertArgs>(
      args: SelectSubset<T, EstoqueLoteUpsertArgs<ExtArgs>>,
    ): Prisma__EstoqueLoteClient<
      $Result.GetResult<
        Prisma.$EstoqueLotePayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of EstoqueLotes.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLoteCountArgs} args - Arguments to filter EstoqueLotes to count.
     * @example
     * // Count the number of EstoqueLotes
     * const count = await prisma.estoqueLote.count({
     *   where: {
     *     // ... the filter for the EstoqueLotes we want to count
     *   }
     * })
     **/
    count<T extends EstoqueLoteCountArgs>(
      args?: Subset<T, EstoqueLoteCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EstoqueLoteCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a EstoqueLote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLoteAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends EstoqueLoteAggregateArgs>(
      args: Subset<T, EstoqueLoteAggregateArgs>,
    ): Prisma.PrismaPromise<GetEstoqueLoteAggregateType<T>>;

    /**
     * Group by EstoqueLote.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueLoteGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends EstoqueLoteGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EstoqueLoteGroupByArgs['orderBy'] }
        : { orderBy?: EstoqueLoteGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, EstoqueLoteGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetEstoqueLoteGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the EstoqueLote model
     */
    readonly fields: EstoqueLoteFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EstoqueLote.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EstoqueLoteClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    estoque<T extends EstoqueItemDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueItemDefaultArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      | $Result.GetResult<
          Prisma.$EstoqueItemPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the EstoqueLote model
   */
  interface EstoqueLoteFieldRefs {
    readonly id: FieldRef<'EstoqueLote', 'String'>;
    readonly estoqueId: FieldRef<'EstoqueLote', 'String'>;
    readonly numeroLote: FieldRef<'EstoqueLote', 'String'>;
    readonly dataFabricacao: FieldRef<'EstoqueLote', 'DateTime'>;
    readonly dataValidade: FieldRef<'EstoqueLote', 'DateTime'>;
    readonly quantidadeLote: FieldRef<'EstoqueLote', 'Decimal'>;
    readonly status: FieldRef<'EstoqueLote', 'StatusLote'>;
    readonly lojaId: FieldRef<'EstoqueLote', 'String'>;
    readonly createdAt: FieldRef<'EstoqueLote', 'DateTime'>;
    readonly updatedAt: FieldRef<'EstoqueLote', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * EstoqueLote findUnique
   */
  export type EstoqueLoteFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLote to fetch.
     */
    where: EstoqueLoteWhereUniqueInput;
  };

  /**
   * EstoqueLote findUniqueOrThrow
   */
  export type EstoqueLoteFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLote to fetch.
     */
    where: EstoqueLoteWhereUniqueInput;
  };

  /**
   * EstoqueLote findFirst
   */
  export type EstoqueLoteFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLote to fetch.
     */
    where?: EstoqueLoteWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueLotes to fetch.
     */
    orderBy?:
      | EstoqueLoteOrderByWithRelationInput
      | EstoqueLoteOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueLotes.
     */
    cursor?: EstoqueLoteWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueLotes from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueLotes.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueLotes.
     */
    distinct?: EstoqueLoteScalarFieldEnum | EstoqueLoteScalarFieldEnum[];
  };

  /**
   * EstoqueLote findFirstOrThrow
   */
  export type EstoqueLoteFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLote to fetch.
     */
    where?: EstoqueLoteWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueLotes to fetch.
     */
    orderBy?:
      | EstoqueLoteOrderByWithRelationInput
      | EstoqueLoteOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueLotes.
     */
    cursor?: EstoqueLoteWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueLotes from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueLotes.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueLotes.
     */
    distinct?: EstoqueLoteScalarFieldEnum | EstoqueLoteScalarFieldEnum[];
  };

  /**
   * EstoqueLote findMany
   */
  export type EstoqueLoteFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueLotes to fetch.
     */
    where?: EstoqueLoteWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueLotes to fetch.
     */
    orderBy?:
      | EstoqueLoteOrderByWithRelationInput
      | EstoqueLoteOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing EstoqueLotes.
     */
    cursor?: EstoqueLoteWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueLotes from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueLotes.
     */
    skip?: number;
    distinct?: EstoqueLoteScalarFieldEnum | EstoqueLoteScalarFieldEnum[];
  };

  /**
   * EstoqueLote create
   */
  export type EstoqueLoteCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * The data needed to create a EstoqueLote.
     */
    data: XOR<EstoqueLoteCreateInput, EstoqueLoteUncheckedCreateInput>;
  };

  /**
   * EstoqueLote createMany
   */
  export type EstoqueLoteCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many EstoqueLotes.
     */
    data: EstoqueLoteCreateManyInput | EstoqueLoteCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * EstoqueLote update
   */
  export type EstoqueLoteUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * The data needed to update a EstoqueLote.
     */
    data: XOR<EstoqueLoteUpdateInput, EstoqueLoteUncheckedUpdateInput>;
    /**
     * Choose, which EstoqueLote to update.
     */
    where: EstoqueLoteWhereUniqueInput;
  };

  /**
   * EstoqueLote updateMany
   */
  export type EstoqueLoteUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update EstoqueLotes.
     */
    data: XOR<
      EstoqueLoteUpdateManyMutationInput,
      EstoqueLoteUncheckedUpdateManyInput
    >;
    /**
     * Filter which EstoqueLotes to update
     */
    where?: EstoqueLoteWhereInput;
    /**
     * Limit how many EstoqueLotes to update.
     */
    limit?: number;
  };

  /**
   * EstoqueLote upsert
   */
  export type EstoqueLoteUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * The filter to search for the EstoqueLote to update in case it exists.
     */
    where: EstoqueLoteWhereUniqueInput;
    /**
     * In case the EstoqueLote found by the `where` argument doesn't exist, create a new EstoqueLote with this data.
     */
    create: XOR<EstoqueLoteCreateInput, EstoqueLoteUncheckedCreateInput>;
    /**
     * In case the EstoqueLote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EstoqueLoteUpdateInput, EstoqueLoteUncheckedUpdateInput>;
  };

  /**
   * EstoqueLote delete
   */
  export type EstoqueLoteDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
    /**
     * Filter which EstoqueLote to delete.
     */
    where: EstoqueLoteWhereUniqueInput;
  };

  /**
   * EstoqueLote deleteMany
   */
  export type EstoqueLoteDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueLotes to delete
     */
    where?: EstoqueLoteWhereInput;
    /**
     * Limit how many EstoqueLotes to delete.
     */
    limit?: number;
  };

  /**
   * EstoqueLote without action
   */
  export type EstoqueLoteDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null;
  };

  /**
   * Model EstoqueSobra
   */

  export type AggregateEstoqueSobra = {
    _count: EstoqueSobraCountAggregateOutputType | null;
    _avg: EstoqueSobraAvgAggregateOutputType | null;
    _sum: EstoqueSobraSumAggregateOutputType | null;
    _min: EstoqueSobraMinAggregateOutputType | null;
    _max: EstoqueSobraMaxAggregateOutputType | null;
  };

  export type EstoqueSobraAvgAggregateOutputType = {
    area: Decimal | null;
    quantidade: Decimal | null;
    quantidadeAproveitada: Decimal | null;
    economiaGerada: Decimal | null;
  };

  export type EstoqueSobraSumAggregateOutputType = {
    area: Decimal | null;
    quantidade: Decimal | null;
    quantidadeAproveitada: Decimal | null;
    economiaGerada: Decimal | null;
  };

  export type EstoqueSobraMinAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    codigoSobra: string | null;
    descricao: string | null;
    dimensoes: string | null;
    area: Decimal | null;
    quantidade: Decimal | null;
    unidadeMedida: string | null;
    material: string | null;
    cor: string | null;
    acabamento: string | null;
    status: $Enums.StatusSobra | null;
    origem: string | null;
    dataGeracao: Date | null;
    orcamentoOrigem: string | null;
    dataAproveitamento: Date | null;
    quantidadeAproveitada: Decimal | null;
    economiaGerada: Decimal | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type EstoqueSobraMaxAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    codigoSobra: string | null;
    descricao: string | null;
    dimensoes: string | null;
    area: Decimal | null;
    quantidade: Decimal | null;
    unidadeMedida: string | null;
    material: string | null;
    cor: string | null;
    acabamento: string | null;
    status: $Enums.StatusSobra | null;
    origem: string | null;
    dataGeracao: Date | null;
    orcamentoOrigem: string | null;
    dataAproveitamento: Date | null;
    quantidadeAproveitada: Decimal | null;
    economiaGerada: Decimal | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type EstoqueSobraCountAggregateOutputType = {
    id: number;
    estoqueId: number;
    codigoSobra: number;
    descricao: number;
    dimensoes: number;
    area: number;
    quantidade: number;
    unidadeMedida: number;
    material: number;
    cor: number;
    acabamento: number;
    status: number;
    origem: number;
    dataGeracao: number;
    orcamentoOrigem: number;
    dataAproveitamento: number;
    quantidadeAproveitada: number;
    economiaGerada: number;
    lojaId: number;
    createdAt: number;
    updatedAt: number;
    _all: number;
  };

  export type EstoqueSobraAvgAggregateInputType = {
    area?: true;
    quantidade?: true;
    quantidadeAproveitada?: true;
    economiaGerada?: true;
  };

  export type EstoqueSobraSumAggregateInputType = {
    area?: true;
    quantidade?: true;
    quantidadeAproveitada?: true;
    economiaGerada?: true;
  };

  export type EstoqueSobraMinAggregateInputType = {
    id?: true;
    estoqueId?: true;
    codigoSobra?: true;
    descricao?: true;
    dimensoes?: true;
    area?: true;
    quantidade?: true;
    unidadeMedida?: true;
    material?: true;
    cor?: true;
    acabamento?: true;
    status?: true;
    origem?: true;
    dataGeracao?: true;
    orcamentoOrigem?: true;
    dataAproveitamento?: true;
    quantidadeAproveitada?: true;
    economiaGerada?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type EstoqueSobraMaxAggregateInputType = {
    id?: true;
    estoqueId?: true;
    codigoSobra?: true;
    descricao?: true;
    dimensoes?: true;
    area?: true;
    quantidade?: true;
    unidadeMedida?: true;
    material?: true;
    cor?: true;
    acabamento?: true;
    status?: true;
    origem?: true;
    dataGeracao?: true;
    orcamentoOrigem?: true;
    dataAproveitamento?: true;
    quantidadeAproveitada?: true;
    economiaGerada?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
  };

  export type EstoqueSobraCountAggregateInputType = {
    id?: true;
    estoqueId?: true;
    codigoSobra?: true;
    descricao?: true;
    dimensoes?: true;
    area?: true;
    quantidade?: true;
    unidadeMedida?: true;
    material?: true;
    cor?: true;
    acabamento?: true;
    status?: true;
    origem?: true;
    dataGeracao?: true;
    orcamentoOrigem?: true;
    dataAproveitamento?: true;
    quantidadeAproveitada?: true;
    economiaGerada?: true;
    lojaId?: true;
    createdAt?: true;
    updatedAt?: true;
    _all?: true;
  };

  export type EstoqueSobraAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueSobra to aggregate.
     */
    where?: EstoqueSobraWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueSobras to fetch.
     */
    orderBy?:
      | EstoqueSobraOrderByWithRelationInput
      | EstoqueSobraOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: EstoqueSobraWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueSobras from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueSobras.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned EstoqueSobras
     **/
    _count?: true | EstoqueSobraCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: EstoqueSobraAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: EstoqueSobraSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: EstoqueSobraMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: EstoqueSobraMaxAggregateInputType;
  };

  export type GetEstoqueSobraAggregateType<
    T extends EstoqueSobraAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateEstoqueSobra]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstoqueSobra[P]>
      : GetScalarType<T[P], AggregateEstoqueSobra[P]>;
  };

  export type EstoqueSobraGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueSobraWhereInput;
    orderBy?:
      | EstoqueSobraOrderByWithAggregationInput
      | EstoqueSobraOrderByWithAggregationInput[];
    by: EstoqueSobraScalarFieldEnum[] | EstoqueSobraScalarFieldEnum;
    having?: EstoqueSobraScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EstoqueSobraCountAggregateInputType | true;
    _avg?: EstoqueSobraAvgAggregateInputType;
    _sum?: EstoqueSobraSumAggregateInputType;
    _min?: EstoqueSobraMinAggregateInputType;
    _max?: EstoqueSobraMaxAggregateInputType;
  };

  export type EstoqueSobraGroupByOutputType = {
    id: string;
    estoqueId: string;
    codigoSobra: string;
    descricao: string;
    dimensoes: string | null;
    area: Decimal | null;
    quantidade: Decimal;
    unidadeMedida: string;
    material: string;
    cor: string | null;
    acabamento: string | null;
    status: $Enums.StatusSobra;
    origem: string | null;
    dataGeracao: Date;
    orcamentoOrigem: string | null;
    dataAproveitamento: Date | null;
    quantidadeAproveitada: Decimal;
    economiaGerada: Decimal;
    lojaId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: EstoqueSobraCountAggregateOutputType | null;
    _avg: EstoqueSobraAvgAggregateOutputType | null;
    _sum: EstoqueSobraSumAggregateOutputType | null;
    _min: EstoqueSobraMinAggregateOutputType | null;
    _max: EstoqueSobraMaxAggregateOutputType | null;
  };

  type GetEstoqueSobraGroupByPayload<T extends EstoqueSobraGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<EstoqueSobraGroupByOutputType, T['by']> & {
          [P in keyof T &
            keyof EstoqueSobraGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EstoqueSobraGroupByOutputType[P]>
            : GetScalarType<T[P], EstoqueSobraGroupByOutputType[P]>;
        }
      >
    >;

  export type EstoqueSobraSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      estoqueId?: boolean;
      codigoSobra?: boolean;
      descricao?: boolean;
      dimensoes?: boolean;
      area?: boolean;
      quantidade?: boolean;
      unidadeMedida?: boolean;
      material?: boolean;
      cor?: boolean;
      acabamento?: boolean;
      status?: boolean;
      origem?: boolean;
      dataGeracao?: boolean;
      orcamentoOrigem?: boolean;
      dataAproveitamento?: boolean;
      quantidadeAproveitada?: boolean;
      economiaGerada?: boolean;
      lojaId?: boolean;
      createdAt?: boolean;
      updatedAt?: boolean;
      estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>;
      aproveitamentos?: boolean | EstoqueSobra$aproveitamentosArgs<ExtArgs>;
      _count?: boolean | EstoqueSobraCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['estoqueSobra']
  >;

  export type EstoqueSobraSelectScalar = {
    id?: boolean;
    estoqueId?: boolean;
    codigoSobra?: boolean;
    descricao?: boolean;
    dimensoes?: boolean;
    area?: boolean;
    quantidade?: boolean;
    unidadeMedida?: boolean;
    material?: boolean;
    cor?: boolean;
    acabamento?: boolean;
    status?: boolean;
    origem?: boolean;
    dataGeracao?: boolean;
    orcamentoOrigem?: boolean;
    dataAproveitamento?: boolean;
    quantidadeAproveitada?: boolean;
    economiaGerada?: boolean;
    lojaId?: boolean;
    createdAt?: boolean;
    updatedAt?: boolean;
  };

  export type EstoqueSobraOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'estoqueId'
    | 'codigoSobra'
    | 'descricao'
    | 'dimensoes'
    | 'area'
    | 'quantidade'
    | 'unidadeMedida'
    | 'material'
    | 'cor'
    | 'acabamento'
    | 'status'
    | 'origem'
    | 'dataGeracao'
    | 'orcamentoOrigem'
    | 'dataAproveitamento'
    | 'quantidadeAproveitada'
    | 'economiaGerada'
    | 'lojaId'
    | 'createdAt'
    | 'updatedAt',
    ExtArgs['result']['estoqueSobra']
  >;
  export type EstoqueSobraInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>;
    aproveitamentos?: boolean | EstoqueSobra$aproveitamentosArgs<ExtArgs>;
    _count?: boolean | EstoqueSobraCountOutputTypeDefaultArgs<ExtArgs>;
  };

  export type $EstoqueSobraPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'EstoqueSobra';
    objects: {
      estoque: Prisma.$EstoqueItemPayload<ExtArgs>;
      aproveitamentos: Prisma.$EstoqueAproveitamentoPayload<ExtArgs>[];
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        estoqueId: string;
        codigoSobra: string;
        descricao: string;
        dimensoes: string | null;
        area: Prisma.Decimal | null;
        quantidade: Prisma.Decimal;
        unidadeMedida: string;
        material: string;
        cor: string | null;
        acabamento: string | null;
        status: $Enums.StatusSobra;
        origem: string | null;
        dataGeracao: Date;
        orcamentoOrigem: string | null;
        dataAproveitamento: Date | null;
        quantidadeAproveitada: Prisma.Decimal;
        economiaGerada: Prisma.Decimal;
        lojaId: string;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['estoqueSobra']
    >;
    composites: {};
  };

  type EstoqueSobraGetPayload<
    S extends boolean | null | undefined | EstoqueSobraDefaultArgs,
  > = $Result.GetResult<Prisma.$EstoqueSobraPayload, S>;

  type EstoqueSobraCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    EstoqueSobraFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: EstoqueSobraCountAggregateInputType | true;
  };

  export interface EstoqueSobraDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['EstoqueSobra'];
      meta: { name: 'EstoqueSobra' };
    };
    /**
     * Find zero or one EstoqueSobra that matches the filter.
     * @param {EstoqueSobraFindUniqueArgs} args - Arguments to find a EstoqueSobra
     * @example
     * // Get one EstoqueSobra
     * const estoqueSobra = await prisma.estoqueSobra.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EstoqueSobraFindUniqueArgs>(
      args: SelectSubset<T, EstoqueSobraFindUniqueArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one EstoqueSobra that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EstoqueSobraFindUniqueOrThrowArgs} args - Arguments to find a EstoqueSobra
     * @example
     * // Get one EstoqueSobra
     * const estoqueSobra = await prisma.estoqueSobra.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EstoqueSobraFindUniqueOrThrowArgs>(
      args: SelectSubset<T, EstoqueSobraFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueSobra that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueSobraFindFirstArgs} args - Arguments to find a EstoqueSobra
     * @example
     * // Get one EstoqueSobra
     * const estoqueSobra = await prisma.estoqueSobra.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EstoqueSobraFindFirstArgs>(
      args?: SelectSubset<T, EstoqueSobraFindFirstArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueSobra that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueSobraFindFirstOrThrowArgs} args - Arguments to find a EstoqueSobra
     * @example
     * // Get one EstoqueSobra
     * const estoqueSobra = await prisma.estoqueSobra.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EstoqueSobraFindFirstOrThrowArgs>(
      args?: SelectSubset<T, EstoqueSobraFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more EstoqueSobras that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueSobraFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EstoqueSobras
     * const estoqueSobras = await prisma.estoqueSobra.findMany()
     *
     * // Get first 10 EstoqueSobras
     * const estoqueSobras = await prisma.estoqueSobra.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const estoqueSobraWithIdOnly = await prisma.estoqueSobra.findMany({ select: { id: true } })
     *
     */
    findMany<T extends EstoqueSobraFindManyArgs>(
      args?: SelectSubset<T, EstoqueSobraFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a EstoqueSobra.
     * @param {EstoqueSobraCreateArgs} args - Arguments to create a EstoqueSobra.
     * @example
     * // Create one EstoqueSobra
     * const EstoqueSobra = await prisma.estoqueSobra.create({
     *   data: {
     *     // ... data to create a EstoqueSobra
     *   }
     * })
     *
     */
    create<T extends EstoqueSobraCreateArgs>(
      args: SelectSubset<T, EstoqueSobraCreateArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many EstoqueSobras.
     * @param {EstoqueSobraCreateManyArgs} args - Arguments to create many EstoqueSobras.
     * @example
     * // Create many EstoqueSobras
     * const estoqueSobra = await prisma.estoqueSobra.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends EstoqueSobraCreateManyArgs>(
      args?: SelectSubset<T, EstoqueSobraCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a EstoqueSobra.
     * @param {EstoqueSobraDeleteArgs} args - Arguments to delete one EstoqueSobra.
     * @example
     * // Delete one EstoqueSobra
     * const EstoqueSobra = await prisma.estoqueSobra.delete({
     *   where: {
     *     // ... filter to delete one EstoqueSobra
     *   }
     * })
     *
     */
    delete<T extends EstoqueSobraDeleteArgs>(
      args: SelectSubset<T, EstoqueSobraDeleteArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one EstoqueSobra.
     * @param {EstoqueSobraUpdateArgs} args - Arguments to update one EstoqueSobra.
     * @example
     * // Update one EstoqueSobra
     * const estoqueSobra = await prisma.estoqueSobra.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends EstoqueSobraUpdateArgs>(
      args: SelectSubset<T, EstoqueSobraUpdateArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more EstoqueSobras.
     * @param {EstoqueSobraDeleteManyArgs} args - Arguments to filter EstoqueSobras to delete.
     * @example
     * // Delete a few EstoqueSobras
     * const { count } = await prisma.estoqueSobra.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends EstoqueSobraDeleteManyArgs>(
      args?: SelectSubset<T, EstoqueSobraDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more EstoqueSobras.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueSobraUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EstoqueSobras
     * const estoqueSobra = await prisma.estoqueSobra.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends EstoqueSobraUpdateManyArgs>(
      args: SelectSubset<T, EstoqueSobraUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one EstoqueSobra.
     * @param {EstoqueSobraUpsertArgs} args - Arguments to update or create a EstoqueSobra.
     * @example
     * // Update or create a EstoqueSobra
     * const estoqueSobra = await prisma.estoqueSobra.upsert({
     *   create: {
     *     // ... data to create a EstoqueSobra
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EstoqueSobra we want to update
     *   }
     * })
     */
    upsert<T extends EstoqueSobraUpsertArgs>(
      args: SelectSubset<T, EstoqueSobraUpsertArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      $Result.GetResult<
        Prisma.$EstoqueSobraPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of EstoqueSobras.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueSobraCountArgs} args - Arguments to filter EstoqueSobras to count.
     * @example
     * // Count the number of EstoqueSobras
     * const count = await prisma.estoqueSobra.count({
     *   where: {
     *     // ... the filter for the EstoqueSobras we want to count
     *   }
     * })
     **/
    count<T extends EstoqueSobraCountArgs>(
      args?: Subset<T, EstoqueSobraCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], EstoqueSobraCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a EstoqueSobra.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueSobraAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends EstoqueSobraAggregateArgs>(
      args: Subset<T, EstoqueSobraAggregateArgs>,
    ): Prisma.PrismaPromise<GetEstoqueSobraAggregateType<T>>;

    /**
     * Group by EstoqueSobra.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueSobraGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends EstoqueSobraGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EstoqueSobraGroupByArgs['orderBy'] }
        : { orderBy?: EstoqueSobraGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<T, EstoqueSobraGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetEstoqueSobraGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the EstoqueSobra model
     */
    readonly fields: EstoqueSobraFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EstoqueSobra.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EstoqueSobraClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    estoque<T extends EstoqueItemDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueItemDefaultArgs<ExtArgs>>,
    ): Prisma__EstoqueItemClient<
      | $Result.GetResult<
          Prisma.$EstoqueItemPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    aproveitamentos<T extends EstoqueSobra$aproveitamentosArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueSobra$aproveitamentosArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the EstoqueSobra model
   */
  interface EstoqueSobraFieldRefs {
    readonly id: FieldRef<'EstoqueSobra', 'String'>;
    readonly estoqueId: FieldRef<'EstoqueSobra', 'String'>;
    readonly codigoSobra: FieldRef<'EstoqueSobra', 'String'>;
    readonly descricao: FieldRef<'EstoqueSobra', 'String'>;
    readonly dimensoes: FieldRef<'EstoqueSobra', 'String'>;
    readonly area: FieldRef<'EstoqueSobra', 'Decimal'>;
    readonly quantidade: FieldRef<'EstoqueSobra', 'Decimal'>;
    readonly unidadeMedida: FieldRef<'EstoqueSobra', 'String'>;
    readonly material: FieldRef<'EstoqueSobra', 'String'>;
    readonly cor: FieldRef<'EstoqueSobra', 'String'>;
    readonly acabamento: FieldRef<'EstoqueSobra', 'String'>;
    readonly status: FieldRef<'EstoqueSobra', 'StatusSobra'>;
    readonly origem: FieldRef<'EstoqueSobra', 'String'>;
    readonly dataGeracao: FieldRef<'EstoqueSobra', 'DateTime'>;
    readonly orcamentoOrigem: FieldRef<'EstoqueSobra', 'String'>;
    readonly dataAproveitamento: FieldRef<'EstoqueSobra', 'DateTime'>;
    readonly quantidadeAproveitada: FieldRef<'EstoqueSobra', 'Decimal'>;
    readonly economiaGerada: FieldRef<'EstoqueSobra', 'Decimal'>;
    readonly lojaId: FieldRef<'EstoqueSobra', 'String'>;
    readonly createdAt: FieldRef<'EstoqueSobra', 'DateTime'>;
    readonly updatedAt: FieldRef<'EstoqueSobra', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * EstoqueSobra findUnique
   */
  export type EstoqueSobraFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueSobra to fetch.
     */
    where: EstoqueSobraWhereUniqueInput;
  };

  /**
   * EstoqueSobra findUniqueOrThrow
   */
  export type EstoqueSobraFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueSobra to fetch.
     */
    where: EstoqueSobraWhereUniqueInput;
  };

  /**
   * EstoqueSobra findFirst
   */
  export type EstoqueSobraFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueSobra to fetch.
     */
    where?: EstoqueSobraWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueSobras to fetch.
     */
    orderBy?:
      | EstoqueSobraOrderByWithRelationInput
      | EstoqueSobraOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueSobras.
     */
    cursor?: EstoqueSobraWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueSobras from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueSobras.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueSobras.
     */
    distinct?: EstoqueSobraScalarFieldEnum | EstoqueSobraScalarFieldEnum[];
  };

  /**
   * EstoqueSobra findFirstOrThrow
   */
  export type EstoqueSobraFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueSobra to fetch.
     */
    where?: EstoqueSobraWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueSobras to fetch.
     */
    orderBy?:
      | EstoqueSobraOrderByWithRelationInput
      | EstoqueSobraOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueSobras.
     */
    cursor?: EstoqueSobraWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueSobras from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueSobras.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueSobras.
     */
    distinct?: EstoqueSobraScalarFieldEnum | EstoqueSobraScalarFieldEnum[];
  };

  /**
   * EstoqueSobra findMany
   */
  export type EstoqueSobraFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueSobras to fetch.
     */
    where?: EstoqueSobraWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueSobras to fetch.
     */
    orderBy?:
      | EstoqueSobraOrderByWithRelationInput
      | EstoqueSobraOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing EstoqueSobras.
     */
    cursor?: EstoqueSobraWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueSobras from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueSobras.
     */
    skip?: number;
    distinct?: EstoqueSobraScalarFieldEnum | EstoqueSobraScalarFieldEnum[];
  };

  /**
   * EstoqueSobra create
   */
  export type EstoqueSobraCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * The data needed to create a EstoqueSobra.
     */
    data: XOR<EstoqueSobraCreateInput, EstoqueSobraUncheckedCreateInput>;
  };

  /**
   * EstoqueSobra createMany
   */
  export type EstoqueSobraCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many EstoqueSobras.
     */
    data: EstoqueSobraCreateManyInput | EstoqueSobraCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * EstoqueSobra update
   */
  export type EstoqueSobraUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * The data needed to update a EstoqueSobra.
     */
    data: XOR<EstoqueSobraUpdateInput, EstoqueSobraUncheckedUpdateInput>;
    /**
     * Choose, which EstoqueSobra to update.
     */
    where: EstoqueSobraWhereUniqueInput;
  };

  /**
   * EstoqueSobra updateMany
   */
  export type EstoqueSobraUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update EstoqueSobras.
     */
    data: XOR<
      EstoqueSobraUpdateManyMutationInput,
      EstoqueSobraUncheckedUpdateManyInput
    >;
    /**
     * Filter which EstoqueSobras to update
     */
    where?: EstoqueSobraWhereInput;
    /**
     * Limit how many EstoqueSobras to update.
     */
    limit?: number;
  };

  /**
   * EstoqueSobra upsert
   */
  export type EstoqueSobraUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * The filter to search for the EstoqueSobra to update in case it exists.
     */
    where: EstoqueSobraWhereUniqueInput;
    /**
     * In case the EstoqueSobra found by the `where` argument doesn't exist, create a new EstoqueSobra with this data.
     */
    create: XOR<EstoqueSobraCreateInput, EstoqueSobraUncheckedCreateInput>;
    /**
     * In case the EstoqueSobra was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EstoqueSobraUpdateInput, EstoqueSobraUncheckedUpdateInput>;
  };

  /**
   * EstoqueSobra delete
   */
  export type EstoqueSobraDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
    /**
     * Filter which EstoqueSobra to delete.
     */
    where: EstoqueSobraWhereUniqueInput;
  };

  /**
   * EstoqueSobra deleteMany
   */
  export type EstoqueSobraDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueSobras to delete
     */
    where?: EstoqueSobraWhereInput;
    /**
     * Limit how many EstoqueSobras to delete.
     */
    limit?: number;
  };

  /**
   * EstoqueSobra.aproveitamentos
   */
  export type EstoqueSobra$aproveitamentosArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    where?: EstoqueAproveitamentoWhereInput;
    orderBy?:
      | EstoqueAproveitamentoOrderByWithRelationInput
      | EstoqueAproveitamentoOrderByWithRelationInput[];
    cursor?: EstoqueAproveitamentoWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?:
      | EstoqueAproveitamentoScalarFieldEnum
      | EstoqueAproveitamentoScalarFieldEnum[];
  };

  /**
   * EstoqueSobra without action
   */
  export type EstoqueSobraDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueSobra
     */
    select?: EstoqueSobraSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueSobra
     */
    omit?: EstoqueSobraOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueSobraInclude<ExtArgs> | null;
  };

  /**
   * Model EstoqueAproveitamento
   */

  export type AggregateEstoqueAproveitamento = {
    _count: EstoqueAproveitamentoCountAggregateOutputType | null;
    _avg: EstoqueAproveitamentoAvgAggregateOutputType | null;
    _sum: EstoqueAproveitamentoSumAggregateOutputType | null;
    _min: EstoqueAproveitamentoMinAggregateOutputType | null;
    _max: EstoqueAproveitamentoMaxAggregateOutputType | null;
  };

  export type EstoqueAproveitamentoAvgAggregateOutputType = {
    quantidadeAproveitada: Decimal | null;
  };

  export type EstoqueAproveitamentoSumAggregateOutputType = {
    quantidadeAproveitada: Decimal | null;
  };

  export type EstoqueAproveitamentoMinAggregateOutputType = {
    id: string | null;
    sobraId: string | null;
    quantidadeAproveitada: Decimal | null;
    projetoDestino: string | null;
    orcamentoDestino: string | null;
    observacoes: string | null;
    lojaId: string | null;
    createdAt: Date | null;
  };

  export type EstoqueAproveitamentoMaxAggregateOutputType = {
    id: string | null;
    sobraId: string | null;
    quantidadeAproveitada: Decimal | null;
    projetoDestino: string | null;
    orcamentoDestino: string | null;
    observacoes: string | null;
    lojaId: string | null;
    createdAt: Date | null;
  };

  export type EstoqueAproveitamentoCountAggregateOutputType = {
    id: number;
    sobraId: number;
    quantidadeAproveitada: number;
    projetoDestino: number;
    orcamentoDestino: number;
    observacoes: number;
    lojaId: number;
    createdAt: number;
    _all: number;
  };

  export type EstoqueAproveitamentoAvgAggregateInputType = {
    quantidadeAproveitada?: true;
  };

  export type EstoqueAproveitamentoSumAggregateInputType = {
    quantidadeAproveitada?: true;
  };

  export type EstoqueAproveitamentoMinAggregateInputType = {
    id?: true;
    sobraId?: true;
    quantidadeAproveitada?: true;
    projetoDestino?: true;
    orcamentoDestino?: true;
    observacoes?: true;
    lojaId?: true;
    createdAt?: true;
  };

  export type EstoqueAproveitamentoMaxAggregateInputType = {
    id?: true;
    sobraId?: true;
    quantidadeAproveitada?: true;
    projetoDestino?: true;
    orcamentoDestino?: true;
    observacoes?: true;
    lojaId?: true;
    createdAt?: true;
  };

  export type EstoqueAproveitamentoCountAggregateInputType = {
    id?: true;
    sobraId?: true;
    quantidadeAproveitada?: true;
    projetoDestino?: true;
    orcamentoDestino?: true;
    observacoes?: true;
    lojaId?: true;
    createdAt?: true;
    _all?: true;
  };

  export type EstoqueAproveitamentoAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueAproveitamento to aggregate.
     */
    where?: EstoqueAproveitamentoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueAproveitamentos to fetch.
     */
    orderBy?:
      | EstoqueAproveitamentoOrderByWithRelationInput
      | EstoqueAproveitamentoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: EstoqueAproveitamentoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueAproveitamentos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueAproveitamentos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned EstoqueAproveitamentos
     **/
    _count?: true | EstoqueAproveitamentoCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: EstoqueAproveitamentoAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: EstoqueAproveitamentoSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: EstoqueAproveitamentoMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: EstoqueAproveitamentoMaxAggregateInputType;
  };

  export type GetEstoqueAproveitamentoAggregateType<
    T extends EstoqueAproveitamentoAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateEstoqueAproveitamento]: P extends
      | '_count'
      | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstoqueAproveitamento[P]>
      : GetScalarType<T[P], AggregateEstoqueAproveitamento[P]>;
  };

  export type EstoqueAproveitamentoGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: EstoqueAproveitamentoWhereInput;
    orderBy?:
      | EstoqueAproveitamentoOrderByWithAggregationInput
      | EstoqueAproveitamentoOrderByWithAggregationInput[];
    by:
      | EstoqueAproveitamentoScalarFieldEnum[]
      | EstoqueAproveitamentoScalarFieldEnum;
    having?: EstoqueAproveitamentoScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: EstoqueAproveitamentoCountAggregateInputType | true;
    _avg?: EstoqueAproveitamentoAvgAggregateInputType;
    _sum?: EstoqueAproveitamentoSumAggregateInputType;
    _min?: EstoqueAproveitamentoMinAggregateInputType;
    _max?: EstoqueAproveitamentoMaxAggregateInputType;
  };

  export type EstoqueAproveitamentoGroupByOutputType = {
    id: string;
    sobraId: string;
    quantidadeAproveitada: Decimal;
    projetoDestino: string | null;
    orcamentoDestino: string | null;
    observacoes: string | null;
    lojaId: string;
    createdAt: Date;
    _count: EstoqueAproveitamentoCountAggregateOutputType | null;
    _avg: EstoqueAproveitamentoAvgAggregateOutputType | null;
    _sum: EstoqueAproveitamentoSumAggregateOutputType | null;
    _min: EstoqueAproveitamentoMinAggregateOutputType | null;
    _max: EstoqueAproveitamentoMaxAggregateOutputType | null;
  };

  type GetEstoqueAproveitamentoGroupByPayload<
    T extends EstoqueAproveitamentoGroupByArgs,
  > = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EstoqueAproveitamentoGroupByOutputType, T['by']> & {
        [P in keyof T &
          keyof EstoqueAproveitamentoGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], EstoqueAproveitamentoGroupByOutputType[P]>
          : GetScalarType<T[P], EstoqueAproveitamentoGroupByOutputType[P]>;
      }
    >
  >;

  export type EstoqueAproveitamentoSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetSelect<
    {
      id?: boolean;
      sobraId?: boolean;
      quantidadeAproveitada?: boolean;
      projetoDestino?: boolean;
      orcamentoDestino?: boolean;
      observacoes?: boolean;
      lojaId?: boolean;
      createdAt?: boolean;
      sobra?: boolean | EstoqueSobraDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['estoqueAproveitamento']
  >;

  export type EstoqueAproveitamentoSelectScalar = {
    id?: boolean;
    sobraId?: boolean;
    quantidadeAproveitada?: boolean;
    projetoDestino?: boolean;
    orcamentoDestino?: boolean;
    observacoes?: boolean;
    lojaId?: boolean;
    createdAt?: boolean;
  };

  export type EstoqueAproveitamentoOmit<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = $Extensions.GetOmit<
    | 'id'
    | 'sobraId'
    | 'quantidadeAproveitada'
    | 'projetoDestino'
    | 'orcamentoDestino'
    | 'observacoes'
    | 'lojaId'
    | 'createdAt',
    ExtArgs['result']['estoqueAproveitamento']
  >;
  export type EstoqueAproveitamentoInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    sobra?: boolean | EstoqueSobraDefaultArgs<ExtArgs>;
  };

  export type $EstoqueAproveitamentoPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'EstoqueAproveitamento';
    objects: {
      sobra: Prisma.$EstoqueSobraPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        sobraId: string;
        quantidadeAproveitada: Prisma.Decimal;
        projetoDestino: string | null;
        orcamentoDestino: string | null;
        observacoes: string | null;
        lojaId: string;
        createdAt: Date;
      },
      ExtArgs['result']['estoqueAproveitamento']
    >;
    composites: {};
  };

  type EstoqueAproveitamentoGetPayload<
    S extends boolean | null | undefined | EstoqueAproveitamentoDefaultArgs,
  > = $Result.GetResult<Prisma.$EstoqueAproveitamentoPayload, S>;

  type EstoqueAproveitamentoCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    EstoqueAproveitamentoFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: EstoqueAproveitamentoCountAggregateInputType | true;
  };

  export interface EstoqueAproveitamentoDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['EstoqueAproveitamento'];
      meta: { name: 'EstoqueAproveitamento' };
    };
    /**
     * Find zero or one EstoqueAproveitamento that matches the filter.
     * @param {EstoqueAproveitamentoFindUniqueArgs} args - Arguments to find a EstoqueAproveitamento
     * @example
     * // Get one EstoqueAproveitamento
     * const estoqueAproveitamento = await prisma.estoqueAproveitamento.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends EstoqueAproveitamentoFindUniqueArgs>(
      args: SelectSubset<T, EstoqueAproveitamentoFindUniqueArgs<ExtArgs>>,
    ): Prisma__EstoqueAproveitamentoClient<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one EstoqueAproveitamento that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {EstoqueAproveitamentoFindUniqueOrThrowArgs} args - Arguments to find a EstoqueAproveitamento
     * @example
     * // Get one EstoqueAproveitamento
     * const estoqueAproveitamento = await prisma.estoqueAproveitamento.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends EstoqueAproveitamentoFindUniqueOrThrowArgs>(
      args: SelectSubset<
        T,
        EstoqueAproveitamentoFindUniqueOrThrowArgs<ExtArgs>
      >,
    ): Prisma__EstoqueAproveitamentoClient<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueAproveitamento that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueAproveitamentoFindFirstArgs} args - Arguments to find a EstoqueAproveitamento
     * @example
     * // Get one EstoqueAproveitamento
     * const estoqueAproveitamento = await prisma.estoqueAproveitamento.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends EstoqueAproveitamentoFindFirstArgs>(
      args?: SelectSubset<T, EstoqueAproveitamentoFindFirstArgs<ExtArgs>>,
    ): Prisma__EstoqueAproveitamentoClient<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first EstoqueAproveitamento that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueAproveitamentoFindFirstOrThrowArgs} args - Arguments to find a EstoqueAproveitamento
     * @example
     * // Get one EstoqueAproveitamento
     * const estoqueAproveitamento = await prisma.estoqueAproveitamento.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends EstoqueAproveitamentoFindFirstOrThrowArgs>(
      args?: SelectSubset<
        T,
        EstoqueAproveitamentoFindFirstOrThrowArgs<ExtArgs>
      >,
    ): Prisma__EstoqueAproveitamentoClient<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more EstoqueAproveitamentos that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueAproveitamentoFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all EstoqueAproveitamentos
     * const estoqueAproveitamentos = await prisma.estoqueAproveitamento.findMany()
     *
     * // Get first 10 EstoqueAproveitamentos
     * const estoqueAproveitamentos = await prisma.estoqueAproveitamento.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const estoqueAproveitamentoWithIdOnly = await prisma.estoqueAproveitamento.findMany({ select: { id: true } })
     *
     */
    findMany<T extends EstoqueAproveitamentoFindManyArgs>(
      args?: SelectSubset<T, EstoqueAproveitamentoFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a EstoqueAproveitamento.
     * @param {EstoqueAproveitamentoCreateArgs} args - Arguments to create a EstoqueAproveitamento.
     * @example
     * // Create one EstoqueAproveitamento
     * const EstoqueAproveitamento = await prisma.estoqueAproveitamento.create({
     *   data: {
     *     // ... data to create a EstoqueAproveitamento
     *   }
     * })
     *
     */
    create<T extends EstoqueAproveitamentoCreateArgs>(
      args: SelectSubset<T, EstoqueAproveitamentoCreateArgs<ExtArgs>>,
    ): Prisma__EstoqueAproveitamentoClient<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many EstoqueAproveitamentos.
     * @param {EstoqueAproveitamentoCreateManyArgs} args - Arguments to create many EstoqueAproveitamentos.
     * @example
     * // Create many EstoqueAproveitamentos
     * const estoqueAproveitamento = await prisma.estoqueAproveitamento.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends EstoqueAproveitamentoCreateManyArgs>(
      args?: SelectSubset<T, EstoqueAproveitamentoCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a EstoqueAproveitamento.
     * @param {EstoqueAproveitamentoDeleteArgs} args - Arguments to delete one EstoqueAproveitamento.
     * @example
     * // Delete one EstoqueAproveitamento
     * const EstoqueAproveitamento = await prisma.estoqueAproveitamento.delete({
     *   where: {
     *     // ... filter to delete one EstoqueAproveitamento
     *   }
     * })
     *
     */
    delete<T extends EstoqueAproveitamentoDeleteArgs>(
      args: SelectSubset<T, EstoqueAproveitamentoDeleteArgs<ExtArgs>>,
    ): Prisma__EstoqueAproveitamentoClient<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one EstoqueAproveitamento.
     * @param {EstoqueAproveitamentoUpdateArgs} args - Arguments to update one EstoqueAproveitamento.
     * @example
     * // Update one EstoqueAproveitamento
     * const estoqueAproveitamento = await prisma.estoqueAproveitamento.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends EstoqueAproveitamentoUpdateArgs>(
      args: SelectSubset<T, EstoqueAproveitamentoUpdateArgs<ExtArgs>>,
    ): Prisma__EstoqueAproveitamentoClient<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more EstoqueAproveitamentos.
     * @param {EstoqueAproveitamentoDeleteManyArgs} args - Arguments to filter EstoqueAproveitamentos to delete.
     * @example
     * // Delete a few EstoqueAproveitamentos
     * const { count } = await prisma.estoqueAproveitamento.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends EstoqueAproveitamentoDeleteManyArgs>(
      args?: SelectSubset<T, EstoqueAproveitamentoDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more EstoqueAproveitamentos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueAproveitamentoUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many EstoqueAproveitamentos
     * const estoqueAproveitamento = await prisma.estoqueAproveitamento.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends EstoqueAproveitamentoUpdateManyArgs>(
      args: SelectSubset<T, EstoqueAproveitamentoUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one EstoqueAproveitamento.
     * @param {EstoqueAproveitamentoUpsertArgs} args - Arguments to update or create a EstoqueAproveitamento.
     * @example
     * // Update or create a EstoqueAproveitamento
     * const estoqueAproveitamento = await prisma.estoqueAproveitamento.upsert({
     *   create: {
     *     // ... data to create a EstoqueAproveitamento
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the EstoqueAproveitamento we want to update
     *   }
     * })
     */
    upsert<T extends EstoqueAproveitamentoUpsertArgs>(
      args: SelectSubset<T, EstoqueAproveitamentoUpsertArgs<ExtArgs>>,
    ): Prisma__EstoqueAproveitamentoClient<
      $Result.GetResult<
        Prisma.$EstoqueAproveitamentoPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of EstoqueAproveitamentos.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueAproveitamentoCountArgs} args - Arguments to filter EstoqueAproveitamentos to count.
     * @example
     * // Count the number of EstoqueAproveitamentos
     * const count = await prisma.estoqueAproveitamento.count({
     *   where: {
     *     // ... the filter for the EstoqueAproveitamentos we want to count
     *   }
     * })
     **/
    count<T extends EstoqueAproveitamentoCountArgs>(
      args?: Subset<T, EstoqueAproveitamentoCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<
              T['select'],
              EstoqueAproveitamentoCountAggregateOutputType
            >
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a EstoqueAproveitamento.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueAproveitamentoAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
     **/
    aggregate<T extends EstoqueAproveitamentoAggregateArgs>(
      args: Subset<T, EstoqueAproveitamentoAggregateArgs>,
    ): Prisma.PrismaPromise<GetEstoqueAproveitamentoAggregateType<T>>;

    /**
     * Group by EstoqueAproveitamento.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {EstoqueAproveitamentoGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     *
     **/
    groupBy<
      T extends EstoqueAproveitamentoGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: EstoqueAproveitamentoGroupByArgs['orderBy'] }
        : { orderBy?: EstoqueAproveitamentoGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<
        Keys<MaybeTupleToUnion<T['orderBy']>>
      >,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
        ? `Error: "by" must not be empty.`
        : HavingValid extends False
          ? {
              [P in HavingFields]: P extends ByFields
                ? never
                : P extends string
                  ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
                  : [
                      Error,
                      'Field ',
                      P,
                      ` in "having" needs to be provided in "by"`,
                    ];
            }[HavingFields]
          : 'take' extends Keys<T>
            ? 'orderBy' extends Keys<T>
              ? ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields]
              : 'Error: If you provide "take", you also need to provide "orderBy"'
            : 'skip' extends Keys<T>
              ? 'orderBy' extends Keys<T>
                ? ByValid extends True
                  ? {}
                  : {
                      [P in OrderFields]: P extends ByFields
                        ? never
                        : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                    }[OrderFields]
                : 'Error: If you provide "skip", you also need to provide "orderBy"'
              : ByValid extends True
                ? {}
                : {
                    [P in OrderFields]: P extends ByFields
                      ? never
                      : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`;
                  }[OrderFields],
    >(
      args: SubsetIntersection<
        T,
        EstoqueAproveitamentoGroupByArgs,
        OrderByArg
      > &
        InputErrors,
    ): {} extends InputErrors
      ? GetEstoqueAproveitamentoGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the EstoqueAproveitamento model
     */
    readonly fields: EstoqueAproveitamentoFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for EstoqueAproveitamento.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__EstoqueAproveitamentoClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    sobra<T extends EstoqueSobraDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, EstoqueSobraDefaultArgs<ExtArgs>>,
    ): Prisma__EstoqueSobraClient<
      | $Result.GetResult<
          Prisma.$EstoqueSobraPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(
      onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
    ): $Utils.JsPromise<TResult1 | TResult2>;
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(
      onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null,
    ): $Utils.JsPromise<T | TResult>;
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | null): $Utils.JsPromise<T>;
  }

  /**
   * Fields of the EstoqueAproveitamento model
   */
  interface EstoqueAproveitamentoFieldRefs {
    readonly id: FieldRef<'EstoqueAproveitamento', 'String'>;
    readonly sobraId: FieldRef<'EstoqueAproveitamento', 'String'>;
    readonly quantidadeAproveitada: FieldRef<
      'EstoqueAproveitamento',
      'Decimal'
    >;
    readonly projetoDestino: FieldRef<'EstoqueAproveitamento', 'String'>;
    readonly orcamentoDestino: FieldRef<'EstoqueAproveitamento', 'String'>;
    readonly observacoes: FieldRef<'EstoqueAproveitamento', 'String'>;
    readonly lojaId: FieldRef<'EstoqueAproveitamento', 'String'>;
    readonly createdAt: FieldRef<'EstoqueAproveitamento', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * EstoqueAproveitamento findUnique
   */
  export type EstoqueAproveitamentoFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueAproveitamento to fetch.
     */
    where: EstoqueAproveitamentoWhereUniqueInput;
  };

  /**
   * EstoqueAproveitamento findUniqueOrThrow
   */
  export type EstoqueAproveitamentoFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueAproveitamento to fetch.
     */
    where: EstoqueAproveitamentoWhereUniqueInput;
  };

  /**
   * EstoqueAproveitamento findFirst
   */
  export type EstoqueAproveitamentoFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueAproveitamento to fetch.
     */
    where?: EstoqueAproveitamentoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueAproveitamentos to fetch.
     */
    orderBy?:
      | EstoqueAproveitamentoOrderByWithRelationInput
      | EstoqueAproveitamentoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueAproveitamentos.
     */
    cursor?: EstoqueAproveitamentoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueAproveitamentos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueAproveitamentos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueAproveitamentos.
     */
    distinct?:
      | EstoqueAproveitamentoScalarFieldEnum
      | EstoqueAproveitamentoScalarFieldEnum[];
  };

  /**
   * EstoqueAproveitamento findFirstOrThrow
   */
  export type EstoqueAproveitamentoFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueAproveitamento to fetch.
     */
    where?: EstoqueAproveitamentoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueAproveitamentos to fetch.
     */
    orderBy?:
      | EstoqueAproveitamentoOrderByWithRelationInput
      | EstoqueAproveitamentoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for EstoqueAproveitamentos.
     */
    cursor?: EstoqueAproveitamentoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueAproveitamentos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueAproveitamentos.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of EstoqueAproveitamentos.
     */
    distinct?:
      | EstoqueAproveitamentoScalarFieldEnum
      | EstoqueAproveitamentoScalarFieldEnum[];
  };

  /**
   * EstoqueAproveitamento findMany
   */
  export type EstoqueAproveitamentoFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * Filter, which EstoqueAproveitamentos to fetch.
     */
    where?: EstoqueAproveitamentoWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of EstoqueAproveitamentos to fetch.
     */
    orderBy?:
      | EstoqueAproveitamentoOrderByWithRelationInput
      | EstoqueAproveitamentoOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing EstoqueAproveitamentos.
     */
    cursor?: EstoqueAproveitamentoWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` EstoqueAproveitamentos from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` EstoqueAproveitamentos.
     */
    skip?: number;
    distinct?:
      | EstoqueAproveitamentoScalarFieldEnum
      | EstoqueAproveitamentoScalarFieldEnum[];
  };

  /**
   * EstoqueAproveitamento create
   */
  export type EstoqueAproveitamentoCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * The data needed to create a EstoqueAproveitamento.
     */
    data: XOR<
      EstoqueAproveitamentoCreateInput,
      EstoqueAproveitamentoUncheckedCreateInput
    >;
  };

  /**
   * EstoqueAproveitamento createMany
   */
  export type EstoqueAproveitamentoCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many EstoqueAproveitamentos.
     */
    data:
      | EstoqueAproveitamentoCreateManyInput
      | EstoqueAproveitamentoCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * EstoqueAproveitamento update
   */
  export type EstoqueAproveitamentoUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * The data needed to update a EstoqueAproveitamento.
     */
    data: XOR<
      EstoqueAproveitamentoUpdateInput,
      EstoqueAproveitamentoUncheckedUpdateInput
    >;
    /**
     * Choose, which EstoqueAproveitamento to update.
     */
    where: EstoqueAproveitamentoWhereUniqueInput;
  };

  /**
   * EstoqueAproveitamento updateMany
   */
  export type EstoqueAproveitamentoUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update EstoqueAproveitamentos.
     */
    data: XOR<
      EstoqueAproveitamentoUpdateManyMutationInput,
      EstoqueAproveitamentoUncheckedUpdateManyInput
    >;
    /**
     * Filter which EstoqueAproveitamentos to update
     */
    where?: EstoqueAproveitamentoWhereInput;
    /**
     * Limit how many EstoqueAproveitamentos to update.
     */
    limit?: number;
  };

  /**
   * EstoqueAproveitamento upsert
   */
  export type EstoqueAproveitamentoUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * The filter to search for the EstoqueAproveitamento to update in case it exists.
     */
    where: EstoqueAproveitamentoWhereUniqueInput;
    /**
     * In case the EstoqueAproveitamento found by the `where` argument doesn't exist, create a new EstoqueAproveitamento with this data.
     */
    create: XOR<
      EstoqueAproveitamentoCreateInput,
      EstoqueAproveitamentoUncheckedCreateInput
    >;
    /**
     * In case the EstoqueAproveitamento was found with the provided `where` argument, update it with this data.
     */
    update: XOR<
      EstoqueAproveitamentoUpdateInput,
      EstoqueAproveitamentoUncheckedUpdateInput
    >;
  };

  /**
   * EstoqueAproveitamento delete
   */
  export type EstoqueAproveitamentoDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
    /**
     * Filter which EstoqueAproveitamento to delete.
     */
    where: EstoqueAproveitamentoWhereUniqueInput;
  };

  /**
   * EstoqueAproveitamento deleteMany
   */
  export type EstoqueAproveitamentoDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which EstoqueAproveitamentos to delete
     */
    where?: EstoqueAproveitamentoWhereInput;
    /**
     * Limit how many EstoqueAproveitamentos to delete.
     */
    limit?: number;
  };

  /**
   * EstoqueAproveitamento without action
   */
  export type EstoqueAproveitamentoDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the EstoqueAproveitamento
     */
    select?: EstoqueAproveitamentoSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the EstoqueAproveitamento
     */
    omit?: EstoqueAproveitamentoOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueAproveitamentoInclude<ExtArgs> | null;
  };

  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted';
    ReadCommitted: 'ReadCommitted';
    RepeatableRead: 'RepeatableRead';
    Serializable: 'Serializable';
  };

  export type TransactionIsolationLevel =
    (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel];

  export const EstoqueLocalizacaoScalarFieldEnum: {
    id: 'id';
    codigo: 'codigo';
    deposito: 'deposito';
    corredor: 'corredor';
    prateleira: 'prateleira';
    nivel: 'nivel';
    posicao: 'posicao';
    descricao: 'descricao';
    capacidade: 'capacidade';
    ativo: 'ativo';
    lojaId: 'lojaId';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type EstoqueLocalizacaoScalarFieldEnum =
    (typeof EstoqueLocalizacaoScalarFieldEnum)[keyof typeof EstoqueLocalizacaoScalarFieldEnum];

  export const EstoqueItemScalarFieldEnum: {
    id: 'id';
    insumoId: 'insumoId';
    localizacaoId: 'localizacaoId';
    quantidadeAtual: 'quantidadeAtual';
    quantidadeReservada: 'quantidadeReservada';
    estoqueMinimo: 'estoqueMinimo';
    estoqueMaximo: 'estoqueMaximo';
    lojaId: 'lojaId';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
    dataUltimaMov: 'dataUltimaMov';
  };

  export type EstoqueItemScalarFieldEnum =
    (typeof EstoqueItemScalarFieldEnum)[keyof typeof EstoqueItemScalarFieldEnum];

  export const EstoqueMovimentacaoScalarFieldEnum: {
    id: 'id';
    estoqueId: 'estoqueId';
    tipo: 'tipo';
    quantidade: 'quantidade';
    quantidadeAnterior: 'quantidadeAnterior';
    quantidadePosterior: 'quantidadePosterior';
    documentoRef: 'documentoRef';
    orcamentoId: 'orcamentoId';
    usuarioId: 'usuarioId';
    lojaId: 'lojaId';
    dataMovimentacao: 'dataMovimentacao';
    observacoes: 'observacoes';
  };

  export type EstoqueMovimentacaoScalarFieldEnum =
    (typeof EstoqueMovimentacaoScalarFieldEnum)[keyof typeof EstoqueMovimentacaoScalarFieldEnum];

  export const EstoqueLoteScalarFieldEnum: {
    id: 'id';
    estoqueId: 'estoqueId';
    numeroLote: 'numeroLote';
    dataFabricacao: 'dataFabricacao';
    dataValidade: 'dataValidade';
    quantidadeLote: 'quantidadeLote';
    status: 'status';
    lojaId: 'lojaId';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type EstoqueLoteScalarFieldEnum =
    (typeof EstoqueLoteScalarFieldEnum)[keyof typeof EstoqueLoteScalarFieldEnum];

  export const EstoqueSobraScalarFieldEnum: {
    id: 'id';
    estoqueId: 'estoqueId';
    codigoSobra: 'codigoSobra';
    descricao: 'descricao';
    dimensoes: 'dimensoes';
    area: 'area';
    quantidade: 'quantidade';
    unidadeMedida: 'unidadeMedida';
    material: 'material';
    cor: 'cor';
    acabamento: 'acabamento';
    status: 'status';
    origem: 'origem';
    dataGeracao: 'dataGeracao';
    orcamentoOrigem: 'orcamentoOrigem';
    dataAproveitamento: 'dataAproveitamento';
    quantidadeAproveitada: 'quantidadeAproveitada';
    economiaGerada: 'economiaGerada';
    lojaId: 'lojaId';
    createdAt: 'createdAt';
    updatedAt: 'updatedAt';
  };

  export type EstoqueSobraScalarFieldEnum =
    (typeof EstoqueSobraScalarFieldEnum)[keyof typeof EstoqueSobraScalarFieldEnum];

  export const EstoqueAproveitamentoScalarFieldEnum: {
    id: 'id';
    sobraId: 'sobraId';
    quantidadeAproveitada: 'quantidadeAproveitada';
    projetoDestino: 'projetoDestino';
    orcamentoDestino: 'orcamentoDestino';
    observacoes: 'observacoes';
    lojaId: 'lojaId';
    createdAt: 'createdAt';
  };

  export type EstoqueAproveitamentoScalarFieldEnum =
    (typeof EstoqueAproveitamentoScalarFieldEnum)[keyof typeof EstoqueAproveitamentoScalarFieldEnum];

  export const SortOrder: {
    asc: 'asc';
    desc: 'desc';
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder];

  export const NullsOrder: {
    first: 'first';
    last: 'last';
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder];

  export const EstoqueLocalizacaoOrderByRelevanceFieldEnum: {
    id: 'id';
    codigo: 'codigo';
    deposito: 'deposito';
    corredor: 'corredor';
    prateleira: 'prateleira';
    nivel: 'nivel';
    posicao: 'posicao';
    descricao: 'descricao';
    lojaId: 'lojaId';
  };

  export type EstoqueLocalizacaoOrderByRelevanceFieldEnum =
    (typeof EstoqueLocalizacaoOrderByRelevanceFieldEnum)[keyof typeof EstoqueLocalizacaoOrderByRelevanceFieldEnum];

  export const EstoqueItemOrderByRelevanceFieldEnum: {
    id: 'id';
    insumoId: 'insumoId';
    localizacaoId: 'localizacaoId';
    lojaId: 'lojaId';
  };

  export type EstoqueItemOrderByRelevanceFieldEnum =
    (typeof EstoqueItemOrderByRelevanceFieldEnum)[keyof typeof EstoqueItemOrderByRelevanceFieldEnum];

  export const EstoqueMovimentacaoOrderByRelevanceFieldEnum: {
    id: 'id';
    estoqueId: 'estoqueId';
    documentoRef: 'documentoRef';
    orcamentoId: 'orcamentoId';
    usuarioId: 'usuarioId';
    lojaId: 'lojaId';
    observacoes: 'observacoes';
  };

  export type EstoqueMovimentacaoOrderByRelevanceFieldEnum =
    (typeof EstoqueMovimentacaoOrderByRelevanceFieldEnum)[keyof typeof EstoqueMovimentacaoOrderByRelevanceFieldEnum];

  export const EstoqueLoteOrderByRelevanceFieldEnum: {
    id: 'id';
    estoqueId: 'estoqueId';
    numeroLote: 'numeroLote';
    lojaId: 'lojaId';
  };

  export type EstoqueLoteOrderByRelevanceFieldEnum =
    (typeof EstoqueLoteOrderByRelevanceFieldEnum)[keyof typeof EstoqueLoteOrderByRelevanceFieldEnum];

  export const EstoqueSobraOrderByRelevanceFieldEnum: {
    id: 'id';
    estoqueId: 'estoqueId';
    codigoSobra: 'codigoSobra';
    descricao: 'descricao';
    dimensoes: 'dimensoes';
    unidadeMedida: 'unidadeMedida';
    material: 'material';
    cor: 'cor';
    acabamento: 'acabamento';
    origem: 'origem';
    orcamentoOrigem: 'orcamentoOrigem';
    lojaId: 'lojaId';
  };

  export type EstoqueSobraOrderByRelevanceFieldEnum =
    (typeof EstoqueSobraOrderByRelevanceFieldEnum)[keyof typeof EstoqueSobraOrderByRelevanceFieldEnum];

  export const EstoqueAproveitamentoOrderByRelevanceFieldEnum: {
    id: 'id';
    sobraId: 'sobraId';
    projetoDestino: 'projetoDestino';
    orcamentoDestino: 'orcamentoDestino';
    observacoes: 'observacoes';
    lojaId: 'lojaId';
  };

  export type EstoqueAproveitamentoOrderByRelevanceFieldEnum =
    (typeof EstoqueAproveitamentoOrderByRelevanceFieldEnum)[keyof typeof EstoqueAproveitamentoOrderByRelevanceFieldEnum];

  /**
   * Field references
   */

  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'String'
  >;

  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Decimal'
  >;

  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Boolean'
  >;

  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'DateTime'
  >;

  /**
   * Reference to a field of type 'TipoMovimentacao'
   */
  export type EnumTipoMovimentacaoFieldRefInput<$PrismaModel> =
    FieldRefInputType<$PrismaModel, 'TipoMovimentacao'>;

  /**
   * Reference to a field of type 'StatusLote'
   */
  export type EnumStatusLoteFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'StatusLote'
  >;

  /**
   * Reference to a field of type 'StatusSobra'
   */
  export type EnumStatusSobraFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'StatusSobra'
  >;

  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<
    $PrismaModel,
    'Int'
  >;

  /**
   * Deep Input Types
   */

  export type EstoqueLocalizacaoWhereInput = {
    AND?: EstoqueLocalizacaoWhereInput | EstoqueLocalizacaoWhereInput[];
    OR?: EstoqueLocalizacaoWhereInput[];
    NOT?: EstoqueLocalizacaoWhereInput | EstoqueLocalizacaoWhereInput[];
    id?: StringFilter<'EstoqueLocalizacao'> | string;
    codigo?: StringFilter<'EstoqueLocalizacao'> | string;
    deposito?: StringFilter<'EstoqueLocalizacao'> | string;
    corredor?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
    prateleira?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
    nivel?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
    posicao?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
    descricao?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
    capacidade?:
      | DecimalNullableFilter<'EstoqueLocalizacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolFilter<'EstoqueLocalizacao'> | boolean;
    lojaId?: StringFilter<'EstoqueLocalizacao'> | string;
    createdAt?: DateTimeFilter<'EstoqueLocalizacao'> | Date | string;
    updatedAt?: DateTimeFilter<'EstoqueLocalizacao'> | Date | string;
    estoques?: EstoqueItemListRelationFilter;
  };

  export type EstoqueLocalizacaoOrderByWithRelationInput = {
    id?: SortOrder;
    codigo?: SortOrder;
    deposito?: SortOrder;
    corredor?: SortOrderInput | SortOrder;
    prateleira?: SortOrderInput | SortOrder;
    nivel?: SortOrderInput | SortOrder;
    posicao?: SortOrderInput | SortOrder;
    descricao?: SortOrderInput | SortOrder;
    capacidade?: SortOrderInput | SortOrder;
    ativo?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    estoques?: EstoqueItemOrderByRelationAggregateInput;
    _relevance?: EstoqueLocalizacaoOrderByRelevanceInput;
  };

  export type EstoqueLocalizacaoWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      codigo?: string;
      AND?: EstoqueLocalizacaoWhereInput | EstoqueLocalizacaoWhereInput[];
      OR?: EstoqueLocalizacaoWhereInput[];
      NOT?: EstoqueLocalizacaoWhereInput | EstoqueLocalizacaoWhereInput[];
      deposito?: StringFilter<'EstoqueLocalizacao'> | string;
      corredor?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
      prateleira?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
      nivel?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
      posicao?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
      descricao?: StringNullableFilter<'EstoqueLocalizacao'> | string | null;
      capacidade?:
        | DecimalNullableFilter<'EstoqueLocalizacao'>
        | Decimal
        | DecimalJsLike
        | number
        | string
        | null;
      ativo?: BoolFilter<'EstoqueLocalizacao'> | boolean;
      lojaId?: StringFilter<'EstoqueLocalizacao'> | string;
      createdAt?: DateTimeFilter<'EstoqueLocalizacao'> | Date | string;
      updatedAt?: DateTimeFilter<'EstoqueLocalizacao'> | Date | string;
      estoques?: EstoqueItemListRelationFilter;
    },
    'id' | 'codigo'
  >;

  export type EstoqueLocalizacaoOrderByWithAggregationInput = {
    id?: SortOrder;
    codigo?: SortOrder;
    deposito?: SortOrder;
    corredor?: SortOrderInput | SortOrder;
    prateleira?: SortOrderInput | SortOrder;
    nivel?: SortOrderInput | SortOrder;
    posicao?: SortOrderInput | SortOrder;
    descricao?: SortOrderInput | SortOrder;
    capacidade?: SortOrderInput | SortOrder;
    ativo?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: EstoqueLocalizacaoCountOrderByAggregateInput;
    _avg?: EstoqueLocalizacaoAvgOrderByAggregateInput;
    _max?: EstoqueLocalizacaoMaxOrderByAggregateInput;
    _min?: EstoqueLocalizacaoMinOrderByAggregateInput;
    _sum?: EstoqueLocalizacaoSumOrderByAggregateInput;
  };

  export type EstoqueLocalizacaoScalarWhereWithAggregatesInput = {
    AND?:
      | EstoqueLocalizacaoScalarWhereWithAggregatesInput
      | EstoqueLocalizacaoScalarWhereWithAggregatesInput[];
    OR?: EstoqueLocalizacaoScalarWhereWithAggregatesInput[];
    NOT?:
      | EstoqueLocalizacaoScalarWhereWithAggregatesInput
      | EstoqueLocalizacaoScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'EstoqueLocalizacao'> | string;
    codigo?: StringWithAggregatesFilter<'EstoqueLocalizacao'> | string;
    deposito?: StringWithAggregatesFilter<'EstoqueLocalizacao'> | string;
    corredor?:
      | StringNullableWithAggregatesFilter<'EstoqueLocalizacao'>
      | string
      | null;
    prateleira?:
      | StringNullableWithAggregatesFilter<'EstoqueLocalizacao'>
      | string
      | null;
    nivel?:
      | StringNullableWithAggregatesFilter<'EstoqueLocalizacao'>
      | string
      | null;
    posicao?:
      | StringNullableWithAggregatesFilter<'EstoqueLocalizacao'>
      | string
      | null;
    descricao?:
      | StringNullableWithAggregatesFilter<'EstoqueLocalizacao'>
      | string
      | null;
    capacidade?:
      | DecimalNullableWithAggregatesFilter<'EstoqueLocalizacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolWithAggregatesFilter<'EstoqueLocalizacao'> | boolean;
    lojaId?: StringWithAggregatesFilter<'EstoqueLocalizacao'> | string;
    createdAt?:
      | DateTimeWithAggregatesFilter<'EstoqueLocalizacao'>
      | Date
      | string;
    updatedAt?:
      | DateTimeWithAggregatesFilter<'EstoqueLocalizacao'>
      | Date
      | string;
  };

  export type EstoqueItemWhereInput = {
    AND?: EstoqueItemWhereInput | EstoqueItemWhereInput[];
    OR?: EstoqueItemWhereInput[];
    NOT?: EstoqueItemWhereInput | EstoqueItemWhereInput[];
    id?: StringFilter<'EstoqueItem'> | string;
    insumoId?: StringFilter<'EstoqueItem'> | string;
    localizacaoId?: StringFilter<'EstoqueItem'> | string;
    quantidadeAtual?:
      | DecimalFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | DecimalNullableFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFilter<'EstoqueItem'> | string;
    createdAt?: DateTimeFilter<'EstoqueItem'> | Date | string;
    updatedAt?: DateTimeFilter<'EstoqueItem'> | Date | string;
    dataUltimaMov?:
      | DateTimeNullableFilter<'EstoqueItem'>
      | Date
      | string
      | null;
    localizacao?: XOR<
      EstoqueLocalizacaoScalarRelationFilter,
      EstoqueLocalizacaoWhereInput
    >;
    movimentacoes?: EstoqueMovimentacaoListRelationFilter;
    lotes?: EstoqueLoteListRelationFilter;
    sobras?: EstoqueSobraListRelationFilter;
  };

  export type EstoqueItemOrderByWithRelationInput = {
    id?: SortOrder;
    insumoId?: SortOrder;
    localizacaoId?: SortOrder;
    quantidadeAtual?: SortOrder;
    quantidadeReservada?: SortOrder;
    estoqueMinimo?: SortOrder;
    estoqueMaximo?: SortOrderInput | SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    dataUltimaMov?: SortOrderInput | SortOrder;
    localizacao?: EstoqueLocalizacaoOrderByWithRelationInput;
    movimentacoes?: EstoqueMovimentacaoOrderByRelationAggregateInput;
    lotes?: EstoqueLoteOrderByRelationAggregateInput;
    sobras?: EstoqueSobraOrderByRelationAggregateInput;
    _relevance?: EstoqueItemOrderByRelevanceInput;
  };

  export type EstoqueItemWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      insumoId_localizacaoId_lojaId?: EstoqueItemInsumoIdLocalizacaoIdLojaIdCompoundUniqueInput;
      AND?: EstoqueItemWhereInput | EstoqueItemWhereInput[];
      OR?: EstoqueItemWhereInput[];
      NOT?: EstoqueItemWhereInput | EstoqueItemWhereInput[];
      insumoId?: StringFilter<'EstoqueItem'> | string;
      localizacaoId?: StringFilter<'EstoqueItem'> | string;
      quantidadeAtual?:
        | DecimalFilter<'EstoqueItem'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      quantidadeReservada?:
        | DecimalFilter<'EstoqueItem'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      estoqueMinimo?:
        | DecimalFilter<'EstoqueItem'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      estoqueMaximo?:
        | DecimalNullableFilter<'EstoqueItem'>
        | Decimal
        | DecimalJsLike
        | number
        | string
        | null;
      lojaId?: StringFilter<'EstoqueItem'> | string;
      createdAt?: DateTimeFilter<'EstoqueItem'> | Date | string;
      updatedAt?: DateTimeFilter<'EstoqueItem'> | Date | string;
      dataUltimaMov?:
        | DateTimeNullableFilter<'EstoqueItem'>
        | Date
        | string
        | null;
      localizacao?: XOR<
        EstoqueLocalizacaoScalarRelationFilter,
        EstoqueLocalizacaoWhereInput
      >;
      movimentacoes?: EstoqueMovimentacaoListRelationFilter;
      lotes?: EstoqueLoteListRelationFilter;
      sobras?: EstoqueSobraListRelationFilter;
    },
    'id' | 'insumoId_localizacaoId_lojaId'
  >;

  export type EstoqueItemOrderByWithAggregationInput = {
    id?: SortOrder;
    insumoId?: SortOrder;
    localizacaoId?: SortOrder;
    quantidadeAtual?: SortOrder;
    quantidadeReservada?: SortOrder;
    estoqueMinimo?: SortOrder;
    estoqueMaximo?: SortOrderInput | SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    dataUltimaMov?: SortOrderInput | SortOrder;
    _count?: EstoqueItemCountOrderByAggregateInput;
    _avg?: EstoqueItemAvgOrderByAggregateInput;
    _max?: EstoqueItemMaxOrderByAggregateInput;
    _min?: EstoqueItemMinOrderByAggregateInput;
    _sum?: EstoqueItemSumOrderByAggregateInput;
  };

  export type EstoqueItemScalarWhereWithAggregatesInput = {
    AND?:
      | EstoqueItemScalarWhereWithAggregatesInput
      | EstoqueItemScalarWhereWithAggregatesInput[];
    OR?: EstoqueItemScalarWhereWithAggregatesInput[];
    NOT?:
      | EstoqueItemScalarWhereWithAggregatesInput
      | EstoqueItemScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'EstoqueItem'> | string;
    insumoId?: StringWithAggregatesFilter<'EstoqueItem'> | string;
    localizacaoId?: StringWithAggregatesFilter<'EstoqueItem'> | string;
    quantidadeAtual?:
      | DecimalWithAggregatesFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalWithAggregatesFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalWithAggregatesFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | DecimalNullableWithAggregatesFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringWithAggregatesFilter<'EstoqueItem'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'EstoqueItem'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'EstoqueItem'> | Date | string;
    dataUltimaMov?:
      | DateTimeNullableWithAggregatesFilter<'EstoqueItem'>
      | Date
      | string
      | null;
  };

  export type EstoqueMovimentacaoWhereInput = {
    AND?: EstoqueMovimentacaoWhereInput | EstoqueMovimentacaoWhereInput[];
    OR?: EstoqueMovimentacaoWhereInput[];
    NOT?: EstoqueMovimentacaoWhereInput | EstoqueMovimentacaoWhereInput[];
    id?: StringFilter<'EstoqueMovimentacao'> | string;
    estoqueId?: StringFilter<'EstoqueMovimentacao'> | string;
    tipo?:
      | EnumTipoMovimentacaoFilter<'EstoqueMovimentacao'>
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: StringNullableFilter<'EstoqueMovimentacao'> | string | null;
    orcamentoId?: StringNullableFilter<'EstoqueMovimentacao'> | string | null;
    usuarioId?: StringFilter<'EstoqueMovimentacao'> | string;
    lojaId?: StringFilter<'EstoqueMovimentacao'> | string;
    dataMovimentacao?: DateTimeFilter<'EstoqueMovimentacao'> | Date | string;
    observacoes?: StringNullableFilter<'EstoqueMovimentacao'> | string | null;
    estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>;
  };

  export type EstoqueMovimentacaoOrderByWithRelationInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    tipo?: SortOrder;
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
    documentoRef?: SortOrderInput | SortOrder;
    orcamentoId?: SortOrderInput | SortOrder;
    usuarioId?: SortOrder;
    lojaId?: SortOrder;
    dataMovimentacao?: SortOrder;
    observacoes?: SortOrderInput | SortOrder;
    estoque?: EstoqueItemOrderByWithRelationInput;
    _relevance?: EstoqueMovimentacaoOrderByRelevanceInput;
  };

  export type EstoqueMovimentacaoWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: EstoqueMovimentacaoWhereInput | EstoqueMovimentacaoWhereInput[];
      OR?: EstoqueMovimentacaoWhereInput[];
      NOT?: EstoqueMovimentacaoWhereInput | EstoqueMovimentacaoWhereInput[];
      estoqueId?: StringFilter<'EstoqueMovimentacao'> | string;
      tipo?:
        | EnumTipoMovimentacaoFilter<'EstoqueMovimentacao'>
        | $Enums.TipoMovimentacao;
      quantidade?:
        | DecimalFilter<'EstoqueMovimentacao'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      quantidadeAnterior?:
        | DecimalFilter<'EstoqueMovimentacao'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      quantidadePosterior?:
        | DecimalFilter<'EstoqueMovimentacao'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      documentoRef?:
        | StringNullableFilter<'EstoqueMovimentacao'>
        | string
        | null;
      orcamentoId?: StringNullableFilter<'EstoqueMovimentacao'> | string | null;
      usuarioId?: StringFilter<'EstoqueMovimentacao'> | string;
      lojaId?: StringFilter<'EstoqueMovimentacao'> | string;
      dataMovimentacao?: DateTimeFilter<'EstoqueMovimentacao'> | Date | string;
      observacoes?: StringNullableFilter<'EstoqueMovimentacao'> | string | null;
      estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>;
    },
    'id'
  >;

  export type EstoqueMovimentacaoOrderByWithAggregationInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    tipo?: SortOrder;
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
    documentoRef?: SortOrderInput | SortOrder;
    orcamentoId?: SortOrderInput | SortOrder;
    usuarioId?: SortOrder;
    lojaId?: SortOrder;
    dataMovimentacao?: SortOrder;
    observacoes?: SortOrderInput | SortOrder;
    _count?: EstoqueMovimentacaoCountOrderByAggregateInput;
    _avg?: EstoqueMovimentacaoAvgOrderByAggregateInput;
    _max?: EstoqueMovimentacaoMaxOrderByAggregateInput;
    _min?: EstoqueMovimentacaoMinOrderByAggregateInput;
    _sum?: EstoqueMovimentacaoSumOrderByAggregateInput;
  };

  export type EstoqueMovimentacaoScalarWhereWithAggregatesInput = {
    AND?:
      | EstoqueMovimentacaoScalarWhereWithAggregatesInput
      | EstoqueMovimentacaoScalarWhereWithAggregatesInput[];
    OR?: EstoqueMovimentacaoScalarWhereWithAggregatesInput[];
    NOT?:
      | EstoqueMovimentacaoScalarWhereWithAggregatesInput
      | EstoqueMovimentacaoScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'EstoqueMovimentacao'> | string;
    estoqueId?: StringWithAggregatesFilter<'EstoqueMovimentacao'> | string;
    tipo?:
      | EnumTipoMovimentacaoWithAggregatesFilter<'EstoqueMovimentacao'>
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalWithAggregatesFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalWithAggregatesFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalWithAggregatesFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?:
      | StringNullableWithAggregatesFilter<'EstoqueMovimentacao'>
      | string
      | null;
    orcamentoId?:
      | StringNullableWithAggregatesFilter<'EstoqueMovimentacao'>
      | string
      | null;
    usuarioId?: StringWithAggregatesFilter<'EstoqueMovimentacao'> | string;
    lojaId?: StringWithAggregatesFilter<'EstoqueMovimentacao'> | string;
    dataMovimentacao?:
      | DateTimeWithAggregatesFilter<'EstoqueMovimentacao'>
      | Date
      | string;
    observacoes?:
      | StringNullableWithAggregatesFilter<'EstoqueMovimentacao'>
      | string
      | null;
  };

  export type EstoqueLoteWhereInput = {
    AND?: EstoqueLoteWhereInput | EstoqueLoteWhereInput[];
    OR?: EstoqueLoteWhereInput[];
    NOT?: EstoqueLoteWhereInput | EstoqueLoteWhereInput[];
    id?: StringFilter<'EstoqueLote'> | string;
    estoqueId?: StringFilter<'EstoqueLote'> | string;
    numeroLote?: StringFilter<'EstoqueLote'> | string;
    dataFabricacao?:
      | DateTimeNullableFilter<'EstoqueLote'>
      | Date
      | string
      | null;
    dataValidade?: DateTimeNullableFilter<'EstoqueLote'> | Date | string | null;
    quantidadeLote?:
      | DecimalFilter<'EstoqueLote'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFilter<'EstoqueLote'> | $Enums.StatusLote;
    lojaId?: StringFilter<'EstoqueLote'> | string;
    createdAt?: DateTimeFilter<'EstoqueLote'> | Date | string;
    updatedAt?: DateTimeFilter<'EstoqueLote'> | Date | string;
    estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>;
  };

  export type EstoqueLoteOrderByWithRelationInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    numeroLote?: SortOrder;
    dataFabricacao?: SortOrderInput | SortOrder;
    dataValidade?: SortOrderInput | SortOrder;
    quantidadeLote?: SortOrder;
    status?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    estoque?: EstoqueItemOrderByWithRelationInput;
    _relevance?: EstoqueLoteOrderByRelevanceInput;
  };

  export type EstoqueLoteWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: EstoqueLoteWhereInput | EstoqueLoteWhereInput[];
      OR?: EstoqueLoteWhereInput[];
      NOT?: EstoqueLoteWhereInput | EstoqueLoteWhereInput[];
      estoqueId?: StringFilter<'EstoqueLote'> | string;
      numeroLote?: StringFilter<'EstoqueLote'> | string;
      dataFabricacao?:
        | DateTimeNullableFilter<'EstoqueLote'>
        | Date
        | string
        | null;
      dataValidade?:
        | DateTimeNullableFilter<'EstoqueLote'>
        | Date
        | string
        | null;
      quantidadeLote?:
        | DecimalFilter<'EstoqueLote'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      status?: EnumStatusLoteFilter<'EstoqueLote'> | $Enums.StatusLote;
      lojaId?: StringFilter<'EstoqueLote'> | string;
      createdAt?: DateTimeFilter<'EstoqueLote'> | Date | string;
      updatedAt?: DateTimeFilter<'EstoqueLote'> | Date | string;
      estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>;
    },
    'id'
  >;

  export type EstoqueLoteOrderByWithAggregationInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    numeroLote?: SortOrder;
    dataFabricacao?: SortOrderInput | SortOrder;
    dataValidade?: SortOrderInput | SortOrder;
    quantidadeLote?: SortOrder;
    status?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: EstoqueLoteCountOrderByAggregateInput;
    _avg?: EstoqueLoteAvgOrderByAggregateInput;
    _max?: EstoqueLoteMaxOrderByAggregateInput;
    _min?: EstoqueLoteMinOrderByAggregateInput;
    _sum?: EstoqueLoteSumOrderByAggregateInput;
  };

  export type EstoqueLoteScalarWhereWithAggregatesInput = {
    AND?:
      | EstoqueLoteScalarWhereWithAggregatesInput
      | EstoqueLoteScalarWhereWithAggregatesInput[];
    OR?: EstoqueLoteScalarWhereWithAggregatesInput[];
    NOT?:
      | EstoqueLoteScalarWhereWithAggregatesInput
      | EstoqueLoteScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'EstoqueLote'> | string;
    estoqueId?: StringWithAggregatesFilter<'EstoqueLote'> | string;
    numeroLote?: StringWithAggregatesFilter<'EstoqueLote'> | string;
    dataFabricacao?:
      | DateTimeNullableWithAggregatesFilter<'EstoqueLote'>
      | Date
      | string
      | null;
    dataValidade?:
      | DateTimeNullableWithAggregatesFilter<'EstoqueLote'>
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalWithAggregatesFilter<'EstoqueLote'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?:
      | EnumStatusLoteWithAggregatesFilter<'EstoqueLote'>
      | $Enums.StatusLote;
    lojaId?: StringWithAggregatesFilter<'EstoqueLote'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'EstoqueLote'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'EstoqueLote'> | Date | string;
  };

  export type EstoqueSobraWhereInput = {
    AND?: EstoqueSobraWhereInput | EstoqueSobraWhereInput[];
    OR?: EstoqueSobraWhereInput[];
    NOT?: EstoqueSobraWhereInput | EstoqueSobraWhereInput[];
    id?: StringFilter<'EstoqueSobra'> | string;
    estoqueId?: StringFilter<'EstoqueSobra'> | string;
    codigoSobra?: StringFilter<'EstoqueSobra'> | string;
    descricao?: StringFilter<'EstoqueSobra'> | string;
    dimensoes?: StringNullableFilter<'EstoqueSobra'> | string | null;
    area?:
      | DecimalNullableFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFilter<'EstoqueSobra'> | string;
    material?: StringFilter<'EstoqueSobra'> | string;
    cor?: StringNullableFilter<'EstoqueSobra'> | string | null;
    acabamento?: StringNullableFilter<'EstoqueSobra'> | string | null;
    status?: EnumStatusSobraFilter<'EstoqueSobra'> | $Enums.StatusSobra;
    origem?: StringNullableFilter<'EstoqueSobra'> | string | null;
    dataGeracao?: DateTimeFilter<'EstoqueSobra'> | Date | string;
    orcamentoOrigem?: StringNullableFilter<'EstoqueSobra'> | string | null;
    dataAproveitamento?:
      | DateTimeNullableFilter<'EstoqueSobra'>
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFilter<'EstoqueSobra'> | string;
    createdAt?: DateTimeFilter<'EstoqueSobra'> | Date | string;
    updatedAt?: DateTimeFilter<'EstoqueSobra'> | Date | string;
    estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>;
    aproveitamentos?: EstoqueAproveitamentoListRelationFilter;
  };

  export type EstoqueSobraOrderByWithRelationInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    codigoSobra?: SortOrder;
    descricao?: SortOrder;
    dimensoes?: SortOrderInput | SortOrder;
    area?: SortOrderInput | SortOrder;
    quantidade?: SortOrder;
    unidadeMedida?: SortOrder;
    material?: SortOrder;
    cor?: SortOrderInput | SortOrder;
    acabamento?: SortOrderInput | SortOrder;
    status?: SortOrder;
    origem?: SortOrderInput | SortOrder;
    dataGeracao?: SortOrder;
    orcamentoOrigem?: SortOrderInput | SortOrder;
    dataAproveitamento?: SortOrderInput | SortOrder;
    quantidadeAproveitada?: SortOrder;
    economiaGerada?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    estoque?: EstoqueItemOrderByWithRelationInput;
    aproveitamentos?: EstoqueAproveitamentoOrderByRelationAggregateInput;
    _relevance?: EstoqueSobraOrderByRelevanceInput;
  };

  export type EstoqueSobraWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      codigoSobra?: string;
      AND?: EstoqueSobraWhereInput | EstoqueSobraWhereInput[];
      OR?: EstoqueSobraWhereInput[];
      NOT?: EstoqueSobraWhereInput | EstoqueSobraWhereInput[];
      estoqueId?: StringFilter<'EstoqueSobra'> | string;
      descricao?: StringFilter<'EstoqueSobra'> | string;
      dimensoes?: StringNullableFilter<'EstoqueSobra'> | string | null;
      area?:
        | DecimalNullableFilter<'EstoqueSobra'>
        | Decimal
        | DecimalJsLike
        | number
        | string
        | null;
      quantidade?:
        | DecimalFilter<'EstoqueSobra'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      unidadeMedida?: StringFilter<'EstoqueSobra'> | string;
      material?: StringFilter<'EstoqueSobra'> | string;
      cor?: StringNullableFilter<'EstoqueSobra'> | string | null;
      acabamento?: StringNullableFilter<'EstoqueSobra'> | string | null;
      status?: EnumStatusSobraFilter<'EstoqueSobra'> | $Enums.StatusSobra;
      origem?: StringNullableFilter<'EstoqueSobra'> | string | null;
      dataGeracao?: DateTimeFilter<'EstoqueSobra'> | Date | string;
      orcamentoOrigem?: StringNullableFilter<'EstoqueSobra'> | string | null;
      dataAproveitamento?:
        | DateTimeNullableFilter<'EstoqueSobra'>
        | Date
        | string
        | null;
      quantidadeAproveitada?:
        | DecimalFilter<'EstoqueSobra'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      economiaGerada?:
        | DecimalFilter<'EstoqueSobra'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      lojaId?: StringFilter<'EstoqueSobra'> | string;
      createdAt?: DateTimeFilter<'EstoqueSobra'> | Date | string;
      updatedAt?: DateTimeFilter<'EstoqueSobra'> | Date | string;
      estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>;
      aproveitamentos?: EstoqueAproveitamentoListRelationFilter;
    },
    'id' | 'codigoSobra'
  >;

  export type EstoqueSobraOrderByWithAggregationInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    codigoSobra?: SortOrder;
    descricao?: SortOrder;
    dimensoes?: SortOrderInput | SortOrder;
    area?: SortOrderInput | SortOrder;
    quantidade?: SortOrder;
    unidadeMedida?: SortOrder;
    material?: SortOrder;
    cor?: SortOrderInput | SortOrder;
    acabamento?: SortOrderInput | SortOrder;
    status?: SortOrder;
    origem?: SortOrderInput | SortOrder;
    dataGeracao?: SortOrder;
    orcamentoOrigem?: SortOrderInput | SortOrder;
    dataAproveitamento?: SortOrderInput | SortOrder;
    quantidadeAproveitada?: SortOrder;
    economiaGerada?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    _count?: EstoqueSobraCountOrderByAggregateInput;
    _avg?: EstoqueSobraAvgOrderByAggregateInput;
    _max?: EstoqueSobraMaxOrderByAggregateInput;
    _min?: EstoqueSobraMinOrderByAggregateInput;
    _sum?: EstoqueSobraSumOrderByAggregateInput;
  };

  export type EstoqueSobraScalarWhereWithAggregatesInput = {
    AND?:
      | EstoqueSobraScalarWhereWithAggregatesInput
      | EstoqueSobraScalarWhereWithAggregatesInput[];
    OR?: EstoqueSobraScalarWhereWithAggregatesInput[];
    NOT?:
      | EstoqueSobraScalarWhereWithAggregatesInput
      | EstoqueSobraScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'EstoqueSobra'> | string;
    estoqueId?: StringWithAggregatesFilter<'EstoqueSobra'> | string;
    codigoSobra?: StringWithAggregatesFilter<'EstoqueSobra'> | string;
    descricao?: StringWithAggregatesFilter<'EstoqueSobra'> | string;
    dimensoes?:
      | StringNullableWithAggregatesFilter<'EstoqueSobra'>
      | string
      | null;
    area?:
      | DecimalNullableWithAggregatesFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalWithAggregatesFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringWithAggregatesFilter<'EstoqueSobra'> | string;
    material?: StringWithAggregatesFilter<'EstoqueSobra'> | string;
    cor?: StringNullableWithAggregatesFilter<'EstoqueSobra'> | string | null;
    acabamento?:
      | StringNullableWithAggregatesFilter<'EstoqueSobra'>
      | string
      | null;
    status?:
      | EnumStatusSobraWithAggregatesFilter<'EstoqueSobra'>
      | $Enums.StatusSobra;
    origem?: StringNullableWithAggregatesFilter<'EstoqueSobra'> | string | null;
    dataGeracao?: DateTimeWithAggregatesFilter<'EstoqueSobra'> | Date | string;
    orcamentoOrigem?:
      | StringNullableWithAggregatesFilter<'EstoqueSobra'>
      | string
      | null;
    dataAproveitamento?:
      | DateTimeNullableWithAggregatesFilter<'EstoqueSobra'>
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalWithAggregatesFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalWithAggregatesFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringWithAggregatesFilter<'EstoqueSobra'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'EstoqueSobra'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'EstoqueSobra'> | Date | string;
  };

  export type EstoqueAproveitamentoWhereInput = {
    AND?: EstoqueAproveitamentoWhereInput | EstoqueAproveitamentoWhereInput[];
    OR?: EstoqueAproveitamentoWhereInput[];
    NOT?: EstoqueAproveitamentoWhereInput | EstoqueAproveitamentoWhereInput[];
    id?: StringFilter<'EstoqueAproveitamento'> | string;
    sobraId?: StringFilter<'EstoqueAproveitamento'> | string;
    quantidadeAproveitada?:
      | DecimalFilter<'EstoqueAproveitamento'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?:
      | StringNullableFilter<'EstoqueAproveitamento'>
      | string
      | null;
    orcamentoDestino?:
      | StringNullableFilter<'EstoqueAproveitamento'>
      | string
      | null;
    observacoes?: StringNullableFilter<'EstoqueAproveitamento'> | string | null;
    lojaId?: StringFilter<'EstoqueAproveitamento'> | string;
    createdAt?: DateTimeFilter<'EstoqueAproveitamento'> | Date | string;
    sobra?: XOR<EstoqueSobraScalarRelationFilter, EstoqueSobraWhereInput>;
  };

  export type EstoqueAproveitamentoOrderByWithRelationInput = {
    id?: SortOrder;
    sobraId?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    projetoDestino?: SortOrderInput | SortOrder;
    orcamentoDestino?: SortOrderInput | SortOrder;
    observacoes?: SortOrderInput | SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    sobra?: EstoqueSobraOrderByWithRelationInput;
    _relevance?: EstoqueAproveitamentoOrderByRelevanceInput;
  };

  export type EstoqueAproveitamentoWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: EstoqueAproveitamentoWhereInput | EstoqueAproveitamentoWhereInput[];
      OR?: EstoqueAproveitamentoWhereInput[];
      NOT?: EstoqueAproveitamentoWhereInput | EstoqueAproveitamentoWhereInput[];
      sobraId?: StringFilter<'EstoqueAproveitamento'> | string;
      quantidadeAproveitada?:
        | DecimalFilter<'EstoqueAproveitamento'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      projetoDestino?:
        | StringNullableFilter<'EstoqueAproveitamento'>
        | string
        | null;
      orcamentoDestino?:
        | StringNullableFilter<'EstoqueAproveitamento'>
        | string
        | null;
      observacoes?:
        | StringNullableFilter<'EstoqueAproveitamento'>
        | string
        | null;
      lojaId?: StringFilter<'EstoqueAproveitamento'> | string;
      createdAt?: DateTimeFilter<'EstoqueAproveitamento'> | Date | string;
      sobra?: XOR<EstoqueSobraScalarRelationFilter, EstoqueSobraWhereInput>;
    },
    'id'
  >;

  export type EstoqueAproveitamentoOrderByWithAggregationInput = {
    id?: SortOrder;
    sobraId?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    projetoDestino?: SortOrderInput | SortOrder;
    orcamentoDestino?: SortOrderInput | SortOrder;
    observacoes?: SortOrderInput | SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    _count?: EstoqueAproveitamentoCountOrderByAggregateInput;
    _avg?: EstoqueAproveitamentoAvgOrderByAggregateInput;
    _max?: EstoqueAproveitamentoMaxOrderByAggregateInput;
    _min?: EstoqueAproveitamentoMinOrderByAggregateInput;
    _sum?: EstoqueAproveitamentoSumOrderByAggregateInput;
  };

  export type EstoqueAproveitamentoScalarWhereWithAggregatesInput = {
    AND?:
      | EstoqueAproveitamentoScalarWhereWithAggregatesInput
      | EstoqueAproveitamentoScalarWhereWithAggregatesInput[];
    OR?: EstoqueAproveitamentoScalarWhereWithAggregatesInput[];
    NOT?:
      | EstoqueAproveitamentoScalarWhereWithAggregatesInput
      | EstoqueAproveitamentoScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'EstoqueAproveitamento'> | string;
    sobraId?: StringWithAggregatesFilter<'EstoqueAproveitamento'> | string;
    quantidadeAproveitada?:
      | DecimalWithAggregatesFilter<'EstoqueAproveitamento'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?:
      | StringNullableWithAggregatesFilter<'EstoqueAproveitamento'>
      | string
      | null;
    orcamentoDestino?:
      | StringNullableWithAggregatesFilter<'EstoqueAproveitamento'>
      | string
      | null;
    observacoes?:
      | StringNullableWithAggregatesFilter<'EstoqueAproveitamento'>
      | string
      | null;
    lojaId?: StringWithAggregatesFilter<'EstoqueAproveitamento'> | string;
    createdAt?:
      | DateTimeWithAggregatesFilter<'EstoqueAproveitamento'>
      | Date
      | string;
  };

  export type EstoqueLocalizacaoCreateInput = {
    id?: string;
    codigo: string;
    deposito: string;
    corredor?: string | null;
    prateleira?: string | null;
    nivel?: string | null;
    posicao?: string | null;
    descricao?: string | null;
    capacidade?: Decimal | DecimalJsLike | number | string | null;
    ativo?: boolean;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    estoques?: EstoqueItemCreateNestedManyWithoutLocalizacaoInput;
  };

  export type EstoqueLocalizacaoUncheckedCreateInput = {
    id?: string;
    codigo: string;
    deposito: string;
    corredor?: string | null;
    prateleira?: string | null;
    nivel?: string | null;
    posicao?: string | null;
    descricao?: string | null;
    capacidade?: Decimal | DecimalJsLike | number | string | null;
    ativo?: boolean;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    estoques?: EstoqueItemUncheckedCreateNestedManyWithoutLocalizacaoInput;
  };

  export type EstoqueLocalizacaoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigo?: StringFieldUpdateOperationsInput | string;
    deposito?: StringFieldUpdateOperationsInput | string;
    corredor?: NullableStringFieldUpdateOperationsInput | string | null;
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null;
    nivel?: NullableStringFieldUpdateOperationsInput | string | null;
    posicao?: NullableStringFieldUpdateOperationsInput | string | null;
    descricao?: NullableStringFieldUpdateOperationsInput | string | null;
    capacidade?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolFieldUpdateOperationsInput | boolean;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    estoques?: EstoqueItemUpdateManyWithoutLocalizacaoNestedInput;
  };

  export type EstoqueLocalizacaoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigo?: StringFieldUpdateOperationsInput | string;
    deposito?: StringFieldUpdateOperationsInput | string;
    corredor?: NullableStringFieldUpdateOperationsInput | string | null;
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null;
    nivel?: NullableStringFieldUpdateOperationsInput | string | null;
    posicao?: NullableStringFieldUpdateOperationsInput | string | null;
    descricao?: NullableStringFieldUpdateOperationsInput | string | null;
    capacidade?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolFieldUpdateOperationsInput | boolean;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    estoques?: EstoqueItemUncheckedUpdateManyWithoutLocalizacaoNestedInput;
  };

  export type EstoqueLocalizacaoCreateManyInput = {
    id?: string;
    codigo: string;
    deposito: string;
    corredor?: string | null;
    prateleira?: string | null;
    nivel?: string | null;
    posicao?: string | null;
    descricao?: string | null;
    capacidade?: Decimal | DecimalJsLike | number | string | null;
    ativo?: boolean;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueLocalizacaoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigo?: StringFieldUpdateOperationsInput | string;
    deposito?: StringFieldUpdateOperationsInput | string;
    corredor?: NullableStringFieldUpdateOperationsInput | string | null;
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null;
    nivel?: NullableStringFieldUpdateOperationsInput | string | null;
    posicao?: NullableStringFieldUpdateOperationsInput | string | null;
    descricao?: NullableStringFieldUpdateOperationsInput | string | null;
    capacidade?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolFieldUpdateOperationsInput | boolean;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueLocalizacaoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigo?: StringFieldUpdateOperationsInput | string;
    deposito?: StringFieldUpdateOperationsInput | string;
    corredor?: NullableStringFieldUpdateOperationsInput | string | null;
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null;
    nivel?: NullableStringFieldUpdateOperationsInput | string | null;
    posicao?: NullableStringFieldUpdateOperationsInput | string | null;
    descricao?: NullableStringFieldUpdateOperationsInput | string | null;
    capacidade?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolFieldUpdateOperationsInput | boolean;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueItemCreateInput = {
    id?: string;
    insumoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    localizacao: EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput;
    movimentacoes?: EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput;
    lotes?: EstoqueLoteCreateNestedManyWithoutEstoqueInput;
    sobras?: EstoqueSobraCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemUncheckedCreateInput = {
    id?: string;
    insumoId: string;
    localizacaoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    movimentacoes?: EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput;
    lotes?: EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput;
    sobras?: EstoqueSobraUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    localizacao?: EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput;
    movimentacoes?: EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput;
    lotes?: EstoqueLoteUpdateManyWithoutEstoqueNestedInput;
    sobras?: EstoqueSobraUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    localizacaoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    movimentacoes?: EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput;
    lotes?: EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput;
    sobras?: EstoqueSobraUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemCreateManyInput = {
    id?: string;
    insumoId: string;
    localizacaoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
  };

  export type EstoqueItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
  };

  export type EstoqueItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    localizacaoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
  };

  export type EstoqueMovimentacaoCreateInput = {
    id?: string;
    tipo: $Enums.TipoMovimentacao;
    quantidade: Decimal | DecimalJsLike | number | string;
    quantidadeAnterior: Decimal | DecimalJsLike | number | string;
    quantidadePosterior: Decimal | DecimalJsLike | number | string;
    documentoRef?: string | null;
    orcamentoId?: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao?: Date | string;
    observacoes?: string | null;
    estoque: EstoqueItemCreateNestedOneWithoutMovimentacoesInput;
  };

  export type EstoqueMovimentacaoUncheckedCreateInput = {
    id?: string;
    estoqueId: string;
    tipo: $Enums.TipoMovimentacao;
    quantidade: Decimal | DecimalJsLike | number | string;
    quantidadeAnterior: Decimal | DecimalJsLike | number | string;
    quantidadePosterior: Decimal | DecimalJsLike | number | string;
    documentoRef?: string | null;
    orcamentoId?: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao?: Date | string;
    observacoes?: string | null;
  };

  export type EstoqueMovimentacaoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumTipoMovimentacaoFieldUpdateOperationsInput
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null;
    usuarioId?: StringFieldUpdateOperationsInput | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
    estoque?: EstoqueItemUpdateOneRequiredWithoutMovimentacoesNestedInput;
  };

  export type EstoqueMovimentacaoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumTipoMovimentacaoFieldUpdateOperationsInput
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null;
    usuarioId?: StringFieldUpdateOperationsInput | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
  };

  export type EstoqueMovimentacaoCreateManyInput = {
    id?: string;
    estoqueId: string;
    tipo: $Enums.TipoMovimentacao;
    quantidade: Decimal | DecimalJsLike | number | string;
    quantidadeAnterior: Decimal | DecimalJsLike | number | string;
    quantidadePosterior: Decimal | DecimalJsLike | number | string;
    documentoRef?: string | null;
    orcamentoId?: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao?: Date | string;
    observacoes?: string | null;
  };

  export type EstoqueMovimentacaoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumTipoMovimentacaoFieldUpdateOperationsInput
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null;
    usuarioId?: StringFieldUpdateOperationsInput | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
  };

  export type EstoqueMovimentacaoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumTipoMovimentacaoFieldUpdateOperationsInput
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null;
    usuarioId?: StringFieldUpdateOperationsInput | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
  };

  export type EstoqueLoteCreateInput = {
    id?: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.StatusLote;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    estoque: EstoqueItemCreateNestedOneWithoutLotesInput;
  };

  export type EstoqueLoteUncheckedCreateInput = {
    id?: string;
    estoqueId: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.StatusLote;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueLoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    numeroLote?: StringFieldUpdateOperationsInput | string;
    dataFabricacao?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    dataValidade?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    estoque?: EstoqueItemUpdateOneRequiredWithoutLotesNestedInput;
  };

  export type EstoqueLoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    numeroLote?: StringFieldUpdateOperationsInput | string;
    dataFabricacao?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    dataValidade?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueLoteCreateManyInput = {
    id?: string;
    estoqueId: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.StatusLote;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueLoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    numeroLote?: StringFieldUpdateOperationsInput | string;
    dataFabricacao?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    dataValidade?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueLoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    numeroLote?: StringFieldUpdateOperationsInput | string;
    dataFabricacao?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    dataValidade?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueSobraCreateInput = {
    id?: string;
    codigoSobra: string;
    descricao: string;
    dimensoes?: string | null;
    area?: Decimal | DecimalJsLike | number | string | null;
    quantidade: Decimal | DecimalJsLike | number | string;
    unidadeMedida: string;
    material: string;
    cor?: string | null;
    acabamento?: string | null;
    status?: $Enums.StatusSobra;
    origem?: string | null;
    dataGeracao?: Date | string;
    orcamentoOrigem?: string | null;
    dataAproveitamento?: Date | string | null;
    quantidadeAproveitada?: Decimal | DecimalJsLike | number | string;
    economiaGerada?: Decimal | DecimalJsLike | number | string;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    estoque: EstoqueItemCreateNestedOneWithoutSobrasInput;
    aproveitamentos?: EstoqueAproveitamentoCreateNestedManyWithoutSobraInput;
  };

  export type EstoqueSobraUncheckedCreateInput = {
    id?: string;
    estoqueId: string;
    codigoSobra: string;
    descricao: string;
    dimensoes?: string | null;
    area?: Decimal | DecimalJsLike | number | string | null;
    quantidade: Decimal | DecimalJsLike | number | string;
    unidadeMedida: string;
    material: string;
    cor?: string | null;
    acabamento?: string | null;
    status?: $Enums.StatusSobra;
    origem?: string | null;
    dataGeracao?: Date | string;
    orcamentoOrigem?: string | null;
    dataAproveitamento?: Date | string | null;
    quantidadeAproveitada?: Decimal | DecimalJsLike | number | string;
    economiaGerada?: Decimal | DecimalJsLike | number | string;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    aproveitamentos?: EstoqueAproveitamentoUncheckedCreateNestedManyWithoutSobraInput;
  };

  export type EstoqueSobraUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    estoque?: EstoqueItemUpdateOneRequiredWithoutSobrasNestedInput;
    aproveitamentos?: EstoqueAproveitamentoUpdateManyWithoutSobraNestedInput;
  };

  export type EstoqueSobraUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    aproveitamentos?: EstoqueAproveitamentoUncheckedUpdateManyWithoutSobraNestedInput;
  };

  export type EstoqueSobraCreateManyInput = {
    id?: string;
    estoqueId: string;
    codigoSobra: string;
    descricao: string;
    dimensoes?: string | null;
    area?: Decimal | DecimalJsLike | number | string | null;
    quantidade: Decimal | DecimalJsLike | number | string;
    unidadeMedida: string;
    material: string;
    cor?: string | null;
    acabamento?: string | null;
    status?: $Enums.StatusSobra;
    origem?: string | null;
    dataGeracao?: Date | string;
    orcamentoOrigem?: string | null;
    dataAproveitamento?: Date | string | null;
    quantidadeAproveitada?: Decimal | DecimalJsLike | number | string;
    economiaGerada?: Decimal | DecimalJsLike | number | string;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueSobraUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueSobraUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueAproveitamentoCreateInput = {
    id?: string;
    quantidadeAproveitada: Decimal | DecimalJsLike | number | string;
    projetoDestino?: string | null;
    orcamentoDestino?: string | null;
    observacoes?: string | null;
    lojaId: string;
    createdAt?: Date | string;
    sobra: EstoqueSobraCreateNestedOneWithoutAproveitamentosInput;
  };

  export type EstoqueAproveitamentoUncheckedCreateInput = {
    id?: string;
    sobraId: string;
    quantidadeAproveitada: Decimal | DecimalJsLike | number | string;
    projetoDestino?: string | null;
    orcamentoDestino?: string | null;
    observacoes?: string | null;
    lojaId: string;
    createdAt?: Date | string;
  };

  export type EstoqueAproveitamentoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    sobra?: EstoqueSobraUpdateOneRequiredWithoutAproveitamentosNestedInput;
  };

  export type EstoqueAproveitamentoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    sobraId?: StringFieldUpdateOperationsInput | string;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueAproveitamentoCreateManyInput = {
    id?: string;
    sobraId: string;
    quantidadeAproveitada: Decimal | DecimalJsLike | number | string;
    projetoDestino?: string | null;
    orcamentoDestino?: string | null;
    observacoes?: string | null;
    lojaId: string;
    createdAt?: Date | string;
  };

  export type EstoqueAproveitamentoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueAproveitamentoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    sobraId?: StringFieldUpdateOperationsInput | string;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    search?: string;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    search?: string;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>
      | null;
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null;
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null;
    lt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    lte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    not?:
      | NestedDecimalNullableFilter<$PrismaModel>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
  };

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolFilter<$PrismaModel> | boolean;
  };

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string;
  };

  export type EstoqueItemListRelationFilter = {
    every?: EstoqueItemWhereInput;
    some?: EstoqueItemWhereInput;
    none?: EstoqueItemWhereInput;
  };

  export type SortOrderInput = {
    sort: SortOrder;
    nulls?: NullsOrder;
  };

  export type EstoqueItemOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type EstoqueLocalizacaoOrderByRelevanceInput = {
    fields:
      | EstoqueLocalizacaoOrderByRelevanceFieldEnum
      | EstoqueLocalizacaoOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type EstoqueLocalizacaoCountOrderByAggregateInput = {
    id?: SortOrder;
    codigo?: SortOrder;
    deposito?: SortOrder;
    corredor?: SortOrder;
    prateleira?: SortOrder;
    nivel?: SortOrder;
    posicao?: SortOrder;
    descricao?: SortOrder;
    capacidade?: SortOrder;
    ativo?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueLocalizacaoAvgOrderByAggregateInput = {
    capacidade?: SortOrder;
  };

  export type EstoqueLocalizacaoMaxOrderByAggregateInput = {
    id?: SortOrder;
    codigo?: SortOrder;
    deposito?: SortOrder;
    corredor?: SortOrder;
    prateleira?: SortOrder;
    nivel?: SortOrder;
    posicao?: SortOrder;
    descricao?: SortOrder;
    capacidade?: SortOrder;
    ativo?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueLocalizacaoMinOrderByAggregateInput = {
    id?: SortOrder;
    codigo?: SortOrder;
    deposito?: SortOrder;
    corredor?: SortOrder;
    prateleira?: SortOrder;
    nivel?: SortOrder;
    posicao?: SortOrder;
    descricao?: SortOrder;
    capacidade?: SortOrder;
    ativo?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueLocalizacaoSumOrderByAggregateInput = {
    capacidade?: SortOrder;
  };

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    search?: string;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    search?: string;
    not?:
      | NestedStringNullableWithAggregatesFilter<$PrismaModel>
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>
      | null;
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null;
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null;
    lt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    lte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    not?:
      | NestedDecimalNullableWithAggregatesFilter<$PrismaModel>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _avg?: NestedDecimalNullableFilter<$PrismaModel>;
    _sum?: NestedDecimalNullableFilter<$PrismaModel>;
    _min?: NestedDecimalNullableFilter<$PrismaModel>;
    _max?: NestedDecimalNullableFilter<$PrismaModel>;
  };

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedBoolFilter<$PrismaModel>;
    _max?: NestedBoolFilter<$PrismaModel>;
  };

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedDateTimeFilter<$PrismaModel>;
    _max?: NestedDateTimeFilter<$PrismaModel>;
  };

  export type DecimalFilter<$PrismaModel = never> = {
    equals?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    in?: Decimal[] | DecimalJsLike[] | number[] | string[];
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[];
    lt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    lte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    not?:
      | NestedDecimalFilter<$PrismaModel>
      | Decimal
      | DecimalJsLike
      | number
      | string;
  };

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
  };

  export type EstoqueLocalizacaoScalarRelationFilter = {
    is?: EstoqueLocalizacaoWhereInput;
    isNot?: EstoqueLocalizacaoWhereInput;
  };

  export type EstoqueMovimentacaoListRelationFilter = {
    every?: EstoqueMovimentacaoWhereInput;
    some?: EstoqueMovimentacaoWhereInput;
    none?: EstoqueMovimentacaoWhereInput;
  };

  export type EstoqueLoteListRelationFilter = {
    every?: EstoqueLoteWhereInput;
    some?: EstoqueLoteWhereInput;
    none?: EstoqueLoteWhereInput;
  };

  export type EstoqueSobraListRelationFilter = {
    every?: EstoqueSobraWhereInput;
    some?: EstoqueSobraWhereInput;
    none?: EstoqueSobraWhereInput;
  };

  export type EstoqueMovimentacaoOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type EstoqueLoteOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type EstoqueSobraOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type EstoqueItemOrderByRelevanceInput = {
    fields:
      | EstoqueItemOrderByRelevanceFieldEnum
      | EstoqueItemOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type EstoqueItemInsumoIdLocalizacaoIdLojaIdCompoundUniqueInput = {
    insumoId: string;
    localizacaoId: string;
    lojaId: string;
  };

  export type EstoqueItemCountOrderByAggregateInput = {
    id?: SortOrder;
    insumoId?: SortOrder;
    localizacaoId?: SortOrder;
    quantidadeAtual?: SortOrder;
    quantidadeReservada?: SortOrder;
    estoqueMinimo?: SortOrder;
    estoqueMaximo?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    dataUltimaMov?: SortOrder;
  };

  export type EstoqueItemAvgOrderByAggregateInput = {
    quantidadeAtual?: SortOrder;
    quantidadeReservada?: SortOrder;
    estoqueMinimo?: SortOrder;
    estoqueMaximo?: SortOrder;
  };

  export type EstoqueItemMaxOrderByAggregateInput = {
    id?: SortOrder;
    insumoId?: SortOrder;
    localizacaoId?: SortOrder;
    quantidadeAtual?: SortOrder;
    quantidadeReservada?: SortOrder;
    estoqueMinimo?: SortOrder;
    estoqueMaximo?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    dataUltimaMov?: SortOrder;
  };

  export type EstoqueItemMinOrderByAggregateInput = {
    id?: SortOrder;
    insumoId?: SortOrder;
    localizacaoId?: SortOrder;
    quantidadeAtual?: SortOrder;
    quantidadeReservada?: SortOrder;
    estoqueMinimo?: SortOrder;
    estoqueMaximo?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
    dataUltimaMov?: SortOrder;
  };

  export type EstoqueItemSumOrderByAggregateInput = {
    quantidadeAtual?: SortOrder;
    quantidadeReservada?: SortOrder;
    estoqueMinimo?: SortOrder;
    estoqueMaximo?: SortOrder;
  };

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    in?: Decimal[] | DecimalJsLike[] | number[] | string[];
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[];
    lt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    lte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    not?:
      | NestedDecimalWithAggregatesFilter<$PrismaModel>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedDecimalFilter<$PrismaModel>;
    _sum?: NestedDecimalFilter<$PrismaModel>;
    _min?: NestedDecimalFilter<$PrismaModel>;
    _max?: NestedDecimalFilter<$PrismaModel>;
  };

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?:
      | NestedDateTimeNullableWithAggregatesFilter<$PrismaModel>
      | Date
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedDateTimeNullableFilter<$PrismaModel>;
    _max?: NestedDateTimeNullableFilter<$PrismaModel>;
  };

  export type EnumTipoMovimentacaoFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.TipoMovimentacao
      | EnumTipoMovimentacaoFieldRefInput<$PrismaModel>;
    in?: $Enums.TipoMovimentacao[];
    notIn?: $Enums.TipoMovimentacao[];
    not?:
      | NestedEnumTipoMovimentacaoFilter<$PrismaModel>
      | $Enums.TipoMovimentacao;
  };

  export type EstoqueItemScalarRelationFilter = {
    is?: EstoqueItemWhereInput;
    isNot?: EstoqueItemWhereInput;
  };

  export type EstoqueMovimentacaoOrderByRelevanceInput = {
    fields:
      | EstoqueMovimentacaoOrderByRelevanceFieldEnum
      | EstoqueMovimentacaoOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type EstoqueMovimentacaoCountOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    tipo?: SortOrder;
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
    documentoRef?: SortOrder;
    orcamentoId?: SortOrder;
    usuarioId?: SortOrder;
    lojaId?: SortOrder;
    dataMovimentacao?: SortOrder;
    observacoes?: SortOrder;
  };

  export type EstoqueMovimentacaoAvgOrderByAggregateInput = {
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
  };

  export type EstoqueMovimentacaoMaxOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    tipo?: SortOrder;
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
    documentoRef?: SortOrder;
    orcamentoId?: SortOrder;
    usuarioId?: SortOrder;
    lojaId?: SortOrder;
    dataMovimentacao?: SortOrder;
    observacoes?: SortOrder;
  };

  export type EstoqueMovimentacaoMinOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    tipo?: SortOrder;
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
    documentoRef?: SortOrder;
    orcamentoId?: SortOrder;
    usuarioId?: SortOrder;
    lojaId?: SortOrder;
    dataMovimentacao?: SortOrder;
    observacoes?: SortOrder;
  };

  export type EstoqueMovimentacaoSumOrderByAggregateInput = {
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
  };

  export type EnumTipoMovimentacaoWithAggregatesFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.TipoMovimentacao
      | EnumTipoMovimentacaoFieldRefInput<$PrismaModel>;
    in?: $Enums.TipoMovimentacao[];
    notIn?: $Enums.TipoMovimentacao[];
    not?:
      | NestedEnumTipoMovimentacaoWithAggregatesFilter<$PrismaModel>
      | $Enums.TipoMovimentacao;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedEnumTipoMovimentacaoFilter<$PrismaModel>;
    _max?: NestedEnumTipoMovimentacaoFilter<$PrismaModel>;
  };

  export type EnumStatusLoteFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusLote | EnumStatusLoteFieldRefInput<$PrismaModel>;
    in?: $Enums.StatusLote[];
    notIn?: $Enums.StatusLote[];
    not?: NestedEnumStatusLoteFilter<$PrismaModel> | $Enums.StatusLote;
  };

  export type EstoqueLoteOrderByRelevanceInput = {
    fields:
      | EstoqueLoteOrderByRelevanceFieldEnum
      | EstoqueLoteOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type EstoqueLoteCountOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    numeroLote?: SortOrder;
    dataFabricacao?: SortOrder;
    dataValidade?: SortOrder;
    quantidadeLote?: SortOrder;
    status?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueLoteAvgOrderByAggregateInput = {
    quantidadeLote?: SortOrder;
  };

  export type EstoqueLoteMaxOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    numeroLote?: SortOrder;
    dataFabricacao?: SortOrder;
    dataValidade?: SortOrder;
    quantidadeLote?: SortOrder;
    status?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueLoteMinOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    numeroLote?: SortOrder;
    dataFabricacao?: SortOrder;
    dataValidade?: SortOrder;
    quantidadeLote?: SortOrder;
    status?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueLoteSumOrderByAggregateInput = {
    quantidadeLote?: SortOrder;
  };

  export type EnumStatusLoteWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusLote | EnumStatusLoteFieldRefInput<$PrismaModel>;
    in?: $Enums.StatusLote[];
    notIn?: $Enums.StatusLote[];
    not?:
      | NestedEnumStatusLoteWithAggregatesFilter<$PrismaModel>
      | $Enums.StatusLote;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedEnumStatusLoteFilter<$PrismaModel>;
    _max?: NestedEnumStatusLoteFilter<$PrismaModel>;
  };

  export type EnumStatusSobraFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusSobra | EnumStatusSobraFieldRefInput<$PrismaModel>;
    in?: $Enums.StatusSobra[];
    notIn?: $Enums.StatusSobra[];
    not?: NestedEnumStatusSobraFilter<$PrismaModel> | $Enums.StatusSobra;
  };

  export type EstoqueAproveitamentoListRelationFilter = {
    every?: EstoqueAproveitamentoWhereInput;
    some?: EstoqueAproveitamentoWhereInput;
    none?: EstoqueAproveitamentoWhereInput;
  };

  export type EstoqueAproveitamentoOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type EstoqueSobraOrderByRelevanceInput = {
    fields:
      | EstoqueSobraOrderByRelevanceFieldEnum
      | EstoqueSobraOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type EstoqueSobraCountOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    codigoSobra?: SortOrder;
    descricao?: SortOrder;
    dimensoes?: SortOrder;
    area?: SortOrder;
    quantidade?: SortOrder;
    unidadeMedida?: SortOrder;
    material?: SortOrder;
    cor?: SortOrder;
    acabamento?: SortOrder;
    status?: SortOrder;
    origem?: SortOrder;
    dataGeracao?: SortOrder;
    orcamentoOrigem?: SortOrder;
    dataAproveitamento?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    economiaGerada?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueSobraAvgOrderByAggregateInput = {
    area?: SortOrder;
    quantidade?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    economiaGerada?: SortOrder;
  };

  export type EstoqueSobraMaxOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    codigoSobra?: SortOrder;
    descricao?: SortOrder;
    dimensoes?: SortOrder;
    area?: SortOrder;
    quantidade?: SortOrder;
    unidadeMedida?: SortOrder;
    material?: SortOrder;
    cor?: SortOrder;
    acabamento?: SortOrder;
    status?: SortOrder;
    origem?: SortOrder;
    dataGeracao?: SortOrder;
    orcamentoOrigem?: SortOrder;
    dataAproveitamento?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    economiaGerada?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueSobraMinOrderByAggregateInput = {
    id?: SortOrder;
    estoqueId?: SortOrder;
    codigoSobra?: SortOrder;
    descricao?: SortOrder;
    dimensoes?: SortOrder;
    area?: SortOrder;
    quantidade?: SortOrder;
    unidadeMedida?: SortOrder;
    material?: SortOrder;
    cor?: SortOrder;
    acabamento?: SortOrder;
    status?: SortOrder;
    origem?: SortOrder;
    dataGeracao?: SortOrder;
    orcamentoOrigem?: SortOrder;
    dataAproveitamento?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    economiaGerada?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
    updatedAt?: SortOrder;
  };

  export type EstoqueSobraSumOrderByAggregateInput = {
    area?: SortOrder;
    quantidade?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    economiaGerada?: SortOrder;
  };

  export type EnumStatusSobraWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusSobra | EnumStatusSobraFieldRefInput<$PrismaModel>;
    in?: $Enums.StatusSobra[];
    notIn?: $Enums.StatusSobra[];
    not?:
      | NestedEnumStatusSobraWithAggregatesFilter<$PrismaModel>
      | $Enums.StatusSobra;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedEnumStatusSobraFilter<$PrismaModel>;
    _max?: NestedEnumStatusSobraFilter<$PrismaModel>;
  };

  export type EstoqueSobraScalarRelationFilter = {
    is?: EstoqueSobraWhereInput;
    isNot?: EstoqueSobraWhereInput;
  };

  export type EstoqueAproveitamentoOrderByRelevanceInput = {
    fields:
      | EstoqueAproveitamentoOrderByRelevanceFieldEnum
      | EstoqueAproveitamentoOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type EstoqueAproveitamentoCountOrderByAggregateInput = {
    id?: SortOrder;
    sobraId?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    projetoDestino?: SortOrder;
    orcamentoDestino?: SortOrder;
    observacoes?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
  };

  export type EstoqueAproveitamentoAvgOrderByAggregateInput = {
    quantidadeAproveitada?: SortOrder;
  };

  export type EstoqueAproveitamentoMaxOrderByAggregateInput = {
    id?: SortOrder;
    sobraId?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    projetoDestino?: SortOrder;
    orcamentoDestino?: SortOrder;
    observacoes?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
  };

  export type EstoqueAproveitamentoMinOrderByAggregateInput = {
    id?: SortOrder;
    sobraId?: SortOrder;
    quantidadeAproveitada?: SortOrder;
    projetoDestino?: SortOrder;
    orcamentoDestino?: SortOrder;
    observacoes?: SortOrder;
    lojaId?: SortOrder;
    createdAt?: SortOrder;
  };

  export type EstoqueAproveitamentoSumOrderByAggregateInput = {
    quantidadeAproveitada?: SortOrder;
  };

  export type EstoqueItemCreateNestedManyWithoutLocalizacaoInput = {
    create?:
      | XOR<
          EstoqueItemCreateWithoutLocalizacaoInput,
          EstoqueItemUncheckedCreateWithoutLocalizacaoInput
        >
      | EstoqueItemCreateWithoutLocalizacaoInput[]
      | EstoqueItemUncheckedCreateWithoutLocalizacaoInput[];
    connectOrCreate?:
      | EstoqueItemCreateOrConnectWithoutLocalizacaoInput
      | EstoqueItemCreateOrConnectWithoutLocalizacaoInput[];
    createMany?: EstoqueItemCreateManyLocalizacaoInputEnvelope;
    connect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
  };

  export type EstoqueItemUncheckedCreateNestedManyWithoutLocalizacaoInput = {
    create?:
      | XOR<
          EstoqueItemCreateWithoutLocalizacaoInput,
          EstoqueItemUncheckedCreateWithoutLocalizacaoInput
        >
      | EstoqueItemCreateWithoutLocalizacaoInput[]
      | EstoqueItemUncheckedCreateWithoutLocalizacaoInput[];
    connectOrCreate?:
      | EstoqueItemCreateOrConnectWithoutLocalizacaoInput
      | EstoqueItemCreateOrConnectWithoutLocalizacaoInput[];
    createMany?: EstoqueItemCreateManyLocalizacaoInputEnvelope;
    connect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
  };

  export type StringFieldUpdateOperationsInput = {
    set?: string;
  };

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null;
  };

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null;
    increment?: Decimal | DecimalJsLike | number | string;
    decrement?: Decimal | DecimalJsLike | number | string;
    multiply?: Decimal | DecimalJsLike | number | string;
    divide?: Decimal | DecimalJsLike | number | string;
  };

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean;
  };

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string;
  };

  export type EstoqueItemUpdateManyWithoutLocalizacaoNestedInput = {
    create?:
      | XOR<
          EstoqueItemCreateWithoutLocalizacaoInput,
          EstoqueItemUncheckedCreateWithoutLocalizacaoInput
        >
      | EstoqueItemCreateWithoutLocalizacaoInput[]
      | EstoqueItemUncheckedCreateWithoutLocalizacaoInput[];
    connectOrCreate?:
      | EstoqueItemCreateOrConnectWithoutLocalizacaoInput
      | EstoqueItemCreateOrConnectWithoutLocalizacaoInput[];
    upsert?:
      | EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput
      | EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput[];
    createMany?: EstoqueItemCreateManyLocalizacaoInputEnvelope;
    set?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
    disconnect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
    delete?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
    connect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
    update?:
      | EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput
      | EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput[];
    updateMany?:
      | EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput
      | EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput[];
    deleteMany?: EstoqueItemScalarWhereInput | EstoqueItemScalarWhereInput[];
  };

  export type EstoqueItemUncheckedUpdateManyWithoutLocalizacaoNestedInput = {
    create?:
      | XOR<
          EstoqueItemCreateWithoutLocalizacaoInput,
          EstoqueItemUncheckedCreateWithoutLocalizacaoInput
        >
      | EstoqueItemCreateWithoutLocalizacaoInput[]
      | EstoqueItemUncheckedCreateWithoutLocalizacaoInput[];
    connectOrCreate?:
      | EstoqueItemCreateOrConnectWithoutLocalizacaoInput
      | EstoqueItemCreateOrConnectWithoutLocalizacaoInput[];
    upsert?:
      | EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput
      | EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput[];
    createMany?: EstoqueItemCreateManyLocalizacaoInputEnvelope;
    set?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
    disconnect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
    delete?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
    connect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[];
    update?:
      | EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput
      | EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput[];
    updateMany?:
      | EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput
      | EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput[];
    deleteMany?: EstoqueItemScalarWhereInput | EstoqueItemScalarWhereInput[];
  };

  export type EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput = {
    create?: XOR<
      EstoqueLocalizacaoCreateWithoutEstoquesInput,
      EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput
    >;
    connectOrCreate?: EstoqueLocalizacaoCreateOrConnectWithoutEstoquesInput;
    connect?: EstoqueLocalizacaoWhereUniqueInput;
  };

  export type EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          EstoqueMovimentacaoCreateWithoutEstoqueInput,
          EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueMovimentacaoCreateWithoutEstoqueInput[]
      | EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput
      | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput[];
    createMany?: EstoqueMovimentacaoCreateManyEstoqueInputEnvelope;
    connect?:
      | EstoqueMovimentacaoWhereUniqueInput
      | EstoqueMovimentacaoWhereUniqueInput[];
  };

  export type EstoqueLoteCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          EstoqueLoteCreateWithoutEstoqueInput,
          EstoqueLoteUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueLoteCreateWithoutEstoqueInput[]
      | EstoqueLoteUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueLoteCreateOrConnectWithoutEstoqueInput
      | EstoqueLoteCreateOrConnectWithoutEstoqueInput[];
    createMany?: EstoqueLoteCreateManyEstoqueInputEnvelope;
    connect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
  };

  export type EstoqueSobraCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          EstoqueSobraCreateWithoutEstoqueInput,
          EstoqueSobraUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueSobraCreateWithoutEstoqueInput[]
      | EstoqueSobraUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueSobraCreateOrConnectWithoutEstoqueInput
      | EstoqueSobraCreateOrConnectWithoutEstoqueInput[];
    createMany?: EstoqueSobraCreateManyEstoqueInputEnvelope;
    connect?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
  };

  export type EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput =
    {
      create?:
        | XOR<
            EstoqueMovimentacaoCreateWithoutEstoqueInput,
            EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput
          >
        | EstoqueMovimentacaoCreateWithoutEstoqueInput[]
        | EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput[];
      connectOrCreate?:
        | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput
        | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput[];
      createMany?: EstoqueMovimentacaoCreateManyEstoqueInputEnvelope;
      connect?:
        | EstoqueMovimentacaoWhereUniqueInput
        | EstoqueMovimentacaoWhereUniqueInput[];
    };

  export type EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          EstoqueLoteCreateWithoutEstoqueInput,
          EstoqueLoteUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueLoteCreateWithoutEstoqueInput[]
      | EstoqueLoteUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueLoteCreateOrConnectWithoutEstoqueInput
      | EstoqueLoteCreateOrConnectWithoutEstoqueInput[];
    createMany?: EstoqueLoteCreateManyEstoqueInputEnvelope;
    connect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
  };

  export type EstoqueSobraUncheckedCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          EstoqueSobraCreateWithoutEstoqueInput,
          EstoqueSobraUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueSobraCreateWithoutEstoqueInput[]
      | EstoqueSobraUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueSobraCreateOrConnectWithoutEstoqueInput
      | EstoqueSobraCreateOrConnectWithoutEstoqueInput[];
    createMany?: EstoqueSobraCreateManyEstoqueInputEnvelope;
    connect?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
  };

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string;
    increment?: Decimal | DecimalJsLike | number | string;
    decrement?: Decimal | DecimalJsLike | number | string;
    multiply?: Decimal | DecimalJsLike | number | string;
    divide?: Decimal | DecimalJsLike | number | string;
  };

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null;
  };

  export type EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput = {
    create?: XOR<
      EstoqueLocalizacaoCreateWithoutEstoquesInput,
      EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput
    >;
    connectOrCreate?: EstoqueLocalizacaoCreateOrConnectWithoutEstoquesInput;
    upsert?: EstoqueLocalizacaoUpsertWithoutEstoquesInput;
    connect?: EstoqueLocalizacaoWhereUniqueInput;
    update?: XOR<
      XOR<
        EstoqueLocalizacaoUpdateToOneWithWhereWithoutEstoquesInput,
        EstoqueLocalizacaoUpdateWithoutEstoquesInput
      >,
      EstoqueLocalizacaoUncheckedUpdateWithoutEstoquesInput
    >;
  };

  export type EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          EstoqueMovimentacaoCreateWithoutEstoqueInput,
          EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueMovimentacaoCreateWithoutEstoqueInput[]
      | EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput
      | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput
      | EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: EstoqueMovimentacaoCreateManyEstoqueInputEnvelope;
    set?:
      | EstoqueMovimentacaoWhereUniqueInput
      | EstoqueMovimentacaoWhereUniqueInput[];
    disconnect?:
      | EstoqueMovimentacaoWhereUniqueInput
      | EstoqueMovimentacaoWhereUniqueInput[];
    delete?:
      | EstoqueMovimentacaoWhereUniqueInput
      | EstoqueMovimentacaoWhereUniqueInput[];
    connect?:
      | EstoqueMovimentacaoWhereUniqueInput
      | EstoqueMovimentacaoWhereUniqueInput[];
    update?:
      | EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput
      | EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput
      | EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?:
      | EstoqueMovimentacaoScalarWhereInput
      | EstoqueMovimentacaoScalarWhereInput[];
  };

  export type EstoqueLoteUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          EstoqueLoteCreateWithoutEstoqueInput,
          EstoqueLoteUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueLoteCreateWithoutEstoqueInput[]
      | EstoqueLoteUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueLoteCreateOrConnectWithoutEstoqueInput
      | EstoqueLoteCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput
      | EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: EstoqueLoteCreateManyEstoqueInputEnvelope;
    set?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
    disconnect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
    delete?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
    connect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
    update?:
      | EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput
      | EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput
      | EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?: EstoqueLoteScalarWhereInput | EstoqueLoteScalarWhereInput[];
  };

  export type EstoqueSobraUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          EstoqueSobraCreateWithoutEstoqueInput,
          EstoqueSobraUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueSobraCreateWithoutEstoqueInput[]
      | EstoqueSobraUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueSobraCreateOrConnectWithoutEstoqueInput
      | EstoqueSobraCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | EstoqueSobraUpsertWithWhereUniqueWithoutEstoqueInput
      | EstoqueSobraUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: EstoqueSobraCreateManyEstoqueInputEnvelope;
    set?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
    disconnect?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
    delete?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
    connect?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
    update?:
      | EstoqueSobraUpdateWithWhereUniqueWithoutEstoqueInput
      | EstoqueSobraUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | EstoqueSobraUpdateManyWithWhereWithoutEstoqueInput
      | EstoqueSobraUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?: EstoqueSobraScalarWhereInput | EstoqueSobraScalarWhereInput[];
  };

  export type EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput =
    {
      create?:
        | XOR<
            EstoqueMovimentacaoCreateWithoutEstoqueInput,
            EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput
          >
        | EstoqueMovimentacaoCreateWithoutEstoqueInput[]
        | EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput[];
      connectOrCreate?:
        | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput
        | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput[];
      upsert?:
        | EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput
        | EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput[];
      createMany?: EstoqueMovimentacaoCreateManyEstoqueInputEnvelope;
      set?:
        | EstoqueMovimentacaoWhereUniqueInput
        | EstoqueMovimentacaoWhereUniqueInput[];
      disconnect?:
        | EstoqueMovimentacaoWhereUniqueInput
        | EstoqueMovimentacaoWhereUniqueInput[];
      delete?:
        | EstoqueMovimentacaoWhereUniqueInput
        | EstoqueMovimentacaoWhereUniqueInput[];
      connect?:
        | EstoqueMovimentacaoWhereUniqueInput
        | EstoqueMovimentacaoWhereUniqueInput[];
      update?:
        | EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput
        | EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput[];
      updateMany?:
        | EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput
        | EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput[];
      deleteMany?:
        | EstoqueMovimentacaoScalarWhereInput
        | EstoqueMovimentacaoScalarWhereInput[];
    };

  export type EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          EstoqueLoteCreateWithoutEstoqueInput,
          EstoqueLoteUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueLoteCreateWithoutEstoqueInput[]
      | EstoqueLoteUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueLoteCreateOrConnectWithoutEstoqueInput
      | EstoqueLoteCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput
      | EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: EstoqueLoteCreateManyEstoqueInputEnvelope;
    set?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
    disconnect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
    delete?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
    connect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[];
    update?:
      | EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput
      | EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput
      | EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?: EstoqueLoteScalarWhereInput | EstoqueLoteScalarWhereInput[];
  };

  export type EstoqueSobraUncheckedUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          EstoqueSobraCreateWithoutEstoqueInput,
          EstoqueSobraUncheckedCreateWithoutEstoqueInput
        >
      | EstoqueSobraCreateWithoutEstoqueInput[]
      | EstoqueSobraUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | EstoqueSobraCreateOrConnectWithoutEstoqueInput
      | EstoqueSobraCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | EstoqueSobraUpsertWithWhereUniqueWithoutEstoqueInput
      | EstoqueSobraUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: EstoqueSobraCreateManyEstoqueInputEnvelope;
    set?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
    disconnect?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
    delete?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
    connect?: EstoqueSobraWhereUniqueInput | EstoqueSobraWhereUniqueInput[];
    update?:
      | EstoqueSobraUpdateWithWhereUniqueWithoutEstoqueInput
      | EstoqueSobraUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | EstoqueSobraUpdateManyWithWhereWithoutEstoqueInput
      | EstoqueSobraUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?: EstoqueSobraScalarWhereInput | EstoqueSobraScalarWhereInput[];
  };

  export type EstoqueItemCreateNestedOneWithoutMovimentacoesInput = {
    create?: XOR<
      EstoqueItemCreateWithoutMovimentacoesInput,
      EstoqueItemUncheckedCreateWithoutMovimentacoesInput
    >;
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutMovimentacoesInput;
    connect?: EstoqueItemWhereUniqueInput;
  };

  export type EnumTipoMovimentacaoFieldUpdateOperationsInput = {
    set?: $Enums.TipoMovimentacao;
  };

  export type EstoqueItemUpdateOneRequiredWithoutMovimentacoesNestedInput = {
    create?: XOR<
      EstoqueItemCreateWithoutMovimentacoesInput,
      EstoqueItemUncheckedCreateWithoutMovimentacoesInput
    >;
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutMovimentacoesInput;
    upsert?: EstoqueItemUpsertWithoutMovimentacoesInput;
    connect?: EstoqueItemWhereUniqueInput;
    update?: XOR<
      XOR<
        EstoqueItemUpdateToOneWithWhereWithoutMovimentacoesInput,
        EstoqueItemUpdateWithoutMovimentacoesInput
      >,
      EstoqueItemUncheckedUpdateWithoutMovimentacoesInput
    >;
  };

  export type EstoqueItemCreateNestedOneWithoutLotesInput = {
    create?: XOR<
      EstoqueItemCreateWithoutLotesInput,
      EstoqueItemUncheckedCreateWithoutLotesInput
    >;
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutLotesInput;
    connect?: EstoqueItemWhereUniqueInput;
  };

  export type EnumStatusLoteFieldUpdateOperationsInput = {
    set?: $Enums.StatusLote;
  };

  export type EstoqueItemUpdateOneRequiredWithoutLotesNestedInput = {
    create?: XOR<
      EstoqueItemCreateWithoutLotesInput,
      EstoqueItemUncheckedCreateWithoutLotesInput
    >;
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutLotesInput;
    upsert?: EstoqueItemUpsertWithoutLotesInput;
    connect?: EstoqueItemWhereUniqueInput;
    update?: XOR<
      XOR<
        EstoqueItemUpdateToOneWithWhereWithoutLotesInput,
        EstoqueItemUpdateWithoutLotesInput
      >,
      EstoqueItemUncheckedUpdateWithoutLotesInput
    >;
  };

  export type EstoqueItemCreateNestedOneWithoutSobrasInput = {
    create?: XOR<
      EstoqueItemCreateWithoutSobrasInput,
      EstoqueItemUncheckedCreateWithoutSobrasInput
    >;
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutSobrasInput;
    connect?: EstoqueItemWhereUniqueInput;
  };

  export type EstoqueAproveitamentoCreateNestedManyWithoutSobraInput = {
    create?:
      | XOR<
          EstoqueAproveitamentoCreateWithoutSobraInput,
          EstoqueAproveitamentoUncheckedCreateWithoutSobraInput
        >
      | EstoqueAproveitamentoCreateWithoutSobraInput[]
      | EstoqueAproveitamentoUncheckedCreateWithoutSobraInput[];
    connectOrCreate?:
      | EstoqueAproveitamentoCreateOrConnectWithoutSobraInput
      | EstoqueAproveitamentoCreateOrConnectWithoutSobraInput[];
    createMany?: EstoqueAproveitamentoCreateManySobraInputEnvelope;
    connect?:
      | EstoqueAproveitamentoWhereUniqueInput
      | EstoqueAproveitamentoWhereUniqueInput[];
  };

  export type EstoqueAproveitamentoUncheckedCreateNestedManyWithoutSobraInput =
    {
      create?:
        | XOR<
            EstoqueAproveitamentoCreateWithoutSobraInput,
            EstoqueAproveitamentoUncheckedCreateWithoutSobraInput
          >
        | EstoqueAproveitamentoCreateWithoutSobraInput[]
        | EstoqueAproveitamentoUncheckedCreateWithoutSobraInput[];
      connectOrCreate?:
        | EstoqueAproveitamentoCreateOrConnectWithoutSobraInput
        | EstoqueAproveitamentoCreateOrConnectWithoutSobraInput[];
      createMany?: EstoqueAproveitamentoCreateManySobraInputEnvelope;
      connect?:
        | EstoqueAproveitamentoWhereUniqueInput
        | EstoqueAproveitamentoWhereUniqueInput[];
    };

  export type EnumStatusSobraFieldUpdateOperationsInput = {
    set?: $Enums.StatusSobra;
  };

  export type EstoqueItemUpdateOneRequiredWithoutSobrasNestedInput = {
    create?: XOR<
      EstoqueItemCreateWithoutSobrasInput,
      EstoqueItemUncheckedCreateWithoutSobrasInput
    >;
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutSobrasInput;
    upsert?: EstoqueItemUpsertWithoutSobrasInput;
    connect?: EstoqueItemWhereUniqueInput;
    update?: XOR<
      XOR<
        EstoqueItemUpdateToOneWithWhereWithoutSobrasInput,
        EstoqueItemUpdateWithoutSobrasInput
      >,
      EstoqueItemUncheckedUpdateWithoutSobrasInput
    >;
  };

  export type EstoqueAproveitamentoUpdateManyWithoutSobraNestedInput = {
    create?:
      | XOR<
          EstoqueAproveitamentoCreateWithoutSobraInput,
          EstoqueAproveitamentoUncheckedCreateWithoutSobraInput
        >
      | EstoqueAproveitamentoCreateWithoutSobraInput[]
      | EstoqueAproveitamentoUncheckedCreateWithoutSobraInput[];
    connectOrCreate?:
      | EstoqueAproveitamentoCreateOrConnectWithoutSobraInput
      | EstoqueAproveitamentoCreateOrConnectWithoutSobraInput[];
    upsert?:
      | EstoqueAproveitamentoUpsertWithWhereUniqueWithoutSobraInput
      | EstoqueAproveitamentoUpsertWithWhereUniqueWithoutSobraInput[];
    createMany?: EstoqueAproveitamentoCreateManySobraInputEnvelope;
    set?:
      | EstoqueAproveitamentoWhereUniqueInput
      | EstoqueAproveitamentoWhereUniqueInput[];
    disconnect?:
      | EstoqueAproveitamentoWhereUniqueInput
      | EstoqueAproveitamentoWhereUniqueInput[];
    delete?:
      | EstoqueAproveitamentoWhereUniqueInput
      | EstoqueAproveitamentoWhereUniqueInput[];
    connect?:
      | EstoqueAproveitamentoWhereUniqueInput
      | EstoqueAproveitamentoWhereUniqueInput[];
    update?:
      | EstoqueAproveitamentoUpdateWithWhereUniqueWithoutSobraInput
      | EstoqueAproveitamentoUpdateWithWhereUniqueWithoutSobraInput[];
    updateMany?:
      | EstoqueAproveitamentoUpdateManyWithWhereWithoutSobraInput
      | EstoqueAproveitamentoUpdateManyWithWhereWithoutSobraInput[];
    deleteMany?:
      | EstoqueAproveitamentoScalarWhereInput
      | EstoqueAproveitamentoScalarWhereInput[];
  };

  export type EstoqueAproveitamentoUncheckedUpdateManyWithoutSobraNestedInput =
    {
      create?:
        | XOR<
            EstoqueAproveitamentoCreateWithoutSobraInput,
            EstoqueAproveitamentoUncheckedCreateWithoutSobraInput
          >
        | EstoqueAproveitamentoCreateWithoutSobraInput[]
        | EstoqueAproveitamentoUncheckedCreateWithoutSobraInput[];
      connectOrCreate?:
        | EstoqueAproveitamentoCreateOrConnectWithoutSobraInput
        | EstoqueAproveitamentoCreateOrConnectWithoutSobraInput[];
      upsert?:
        | EstoqueAproveitamentoUpsertWithWhereUniqueWithoutSobraInput
        | EstoqueAproveitamentoUpsertWithWhereUniqueWithoutSobraInput[];
      createMany?: EstoqueAproveitamentoCreateManySobraInputEnvelope;
      set?:
        | EstoqueAproveitamentoWhereUniqueInput
        | EstoqueAproveitamentoWhereUniqueInput[];
      disconnect?:
        | EstoqueAproveitamentoWhereUniqueInput
        | EstoqueAproveitamentoWhereUniqueInput[];
      delete?:
        | EstoqueAproveitamentoWhereUniqueInput
        | EstoqueAproveitamentoWhereUniqueInput[];
      connect?:
        | EstoqueAproveitamentoWhereUniqueInput
        | EstoqueAproveitamentoWhereUniqueInput[];
      update?:
        | EstoqueAproveitamentoUpdateWithWhereUniqueWithoutSobraInput
        | EstoqueAproveitamentoUpdateWithWhereUniqueWithoutSobraInput[];
      updateMany?:
        | EstoqueAproveitamentoUpdateManyWithWhereWithoutSobraInput
        | EstoqueAproveitamentoUpdateManyWithWhereWithoutSobraInput[];
      deleteMany?:
        | EstoqueAproveitamentoScalarWhereInput
        | EstoqueAproveitamentoScalarWhereInput[];
    };

  export type EstoqueSobraCreateNestedOneWithoutAproveitamentosInput = {
    create?: XOR<
      EstoqueSobraCreateWithoutAproveitamentosInput,
      EstoqueSobraUncheckedCreateWithoutAproveitamentosInput
    >;
    connectOrCreate?: EstoqueSobraCreateOrConnectWithoutAproveitamentosInput;
    connect?: EstoqueSobraWhereUniqueInput;
  };

  export type EstoqueSobraUpdateOneRequiredWithoutAproveitamentosNestedInput = {
    create?: XOR<
      EstoqueSobraCreateWithoutAproveitamentosInput,
      EstoqueSobraUncheckedCreateWithoutAproveitamentosInput
    >;
    connectOrCreate?: EstoqueSobraCreateOrConnectWithoutAproveitamentosInput;
    upsert?: EstoqueSobraUpsertWithoutAproveitamentosInput;
    connect?: EstoqueSobraWhereUniqueInput;
    update?: XOR<
      XOR<
        EstoqueSobraUpdateToOneWithWhereWithoutAproveitamentosInput,
        EstoqueSobraUpdateWithoutAproveitamentosInput
      >,
      EstoqueSobraUncheckedUpdateWithoutAproveitamentosInput
    >;
  };

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    search?: string;
    not?: NestedStringFilter<$PrismaModel> | string;
  };

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    search?: string;
    not?: NestedStringNullableFilter<$PrismaModel> | string | null;
  };

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>
      | null;
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null;
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null;
    lt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    lte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    not?:
      | NestedDecimalNullableFilter<$PrismaModel>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
  };

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolFilter<$PrismaModel> | boolean;
  };

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string;
  };

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>;
    in?: string[];
    notIn?: string[];
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    search?: string;
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedStringFilter<$PrismaModel>;
    _max?: NestedStringFilter<$PrismaModel>;
  };

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>;
    in?: number[];
    notIn?: number[];
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntFilter<$PrismaModel> | number;
  };

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null;
    in?: string[] | null;
    notIn?: string[] | null;
    lt?: string | StringFieldRefInput<$PrismaModel>;
    lte?: string | StringFieldRefInput<$PrismaModel>;
    gt?: string | StringFieldRefInput<$PrismaModel>;
    gte?: string | StringFieldRefInput<$PrismaModel>;
    contains?: string | StringFieldRefInput<$PrismaModel>;
    startsWith?: string | StringFieldRefInput<$PrismaModel>;
    endsWith?: string | StringFieldRefInput<$PrismaModel>;
    search?: string;
    not?:
      | NestedStringNullableWithAggregatesFilter<$PrismaModel>
      | string
      | null;
    _count?: NestedIntNullableFilter<$PrismaModel>;
    _min?: NestedStringNullableFilter<$PrismaModel>;
    _max?: NestedStringNullableFilter<$PrismaModel>;
  };

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null;
    in?: number[] | null;
    notIn?: number[] | null;
    lt?: number | IntFieldRefInput<$PrismaModel>;
    lte?: number | IntFieldRefInput<$PrismaModel>;
    gt?: number | IntFieldRefInput<$PrismaModel>;
    gte?: number | IntFieldRefInput<$PrismaModel>;
    not?: NestedIntNullableFilter<$PrismaModel> | number | null;
  };

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> =
    {
      equals?:
        | Decimal
        | DecimalJsLike
        | number
        | string
        | DecimalFieldRefInput<$PrismaModel>
        | null;
      in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null;
      notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null;
      lt?:
        | Decimal
        | DecimalJsLike
        | number
        | string
        | DecimalFieldRefInput<$PrismaModel>;
      lte?:
        | Decimal
        | DecimalJsLike
        | number
        | string
        | DecimalFieldRefInput<$PrismaModel>;
      gt?:
        | Decimal
        | DecimalJsLike
        | number
        | string
        | DecimalFieldRefInput<$PrismaModel>;
      gte?:
        | Decimal
        | DecimalJsLike
        | number
        | string
        | DecimalFieldRefInput<$PrismaModel>;
      not?:
        | NestedDecimalNullableWithAggregatesFilter<$PrismaModel>
        | Decimal
        | DecimalJsLike
        | number
        | string
        | null;
      _count?: NestedIntNullableFilter<$PrismaModel>;
      _avg?: NestedDecimalNullableFilter<$PrismaModel>;
      _sum?: NestedDecimalNullableFilter<$PrismaModel>;
      _min?: NestedDecimalNullableFilter<$PrismaModel>;
      _max?: NestedDecimalNullableFilter<$PrismaModel>;
    };

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>;
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedBoolFilter<$PrismaModel>;
    _max?: NestedBoolFilter<$PrismaModel>;
  };

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    in?: Date[] | string[];
    notIn?: Date[] | string[];
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedDateTimeFilter<$PrismaModel>;
    _max?: NestedDateTimeFilter<$PrismaModel>;
  };

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    in?: Decimal[] | DecimalJsLike[] | number[] | string[];
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[];
    lt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    lte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    not?:
      | NestedDecimalFilter<$PrismaModel>
      | Decimal
      | DecimalJsLike
      | number
      | string;
  };

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
    in?: Date[] | string[] | null;
    notIn?: Date[] | string[] | null;
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null;
  };

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    in?: Decimal[] | DecimalJsLike[] | number[] | string[];
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[];
    lt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    lte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gt?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    gte?:
      | Decimal
      | DecimalJsLike
      | number
      | string
      | DecimalFieldRefInput<$PrismaModel>;
    not?:
      | NestedDecimalWithAggregatesFilter<$PrismaModel>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    _count?: NestedIntFilter<$PrismaModel>;
    _avg?: NestedDecimalFilter<$PrismaModel>;
    _sum?: NestedDecimalFilter<$PrismaModel>;
    _min?: NestedDecimalFilter<$PrismaModel>;
    _max?: NestedDecimalFilter<$PrismaModel>;
  };

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> =
    {
      equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null;
      in?: Date[] | string[] | null;
      notIn?: Date[] | string[] | null;
      lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
      lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
      gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
      gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>;
      not?:
        | NestedDateTimeNullableWithAggregatesFilter<$PrismaModel>
        | Date
        | string
        | null;
      _count?: NestedIntNullableFilter<$PrismaModel>;
      _min?: NestedDateTimeNullableFilter<$PrismaModel>;
      _max?: NestedDateTimeNullableFilter<$PrismaModel>;
    };

  export type NestedEnumTipoMovimentacaoFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.TipoMovimentacao
      | EnumTipoMovimentacaoFieldRefInput<$PrismaModel>;
    in?: $Enums.TipoMovimentacao[];
    notIn?: $Enums.TipoMovimentacao[];
    not?:
      | NestedEnumTipoMovimentacaoFilter<$PrismaModel>
      | $Enums.TipoMovimentacao;
  };

  export type NestedEnumTipoMovimentacaoWithAggregatesFilter<
    $PrismaModel = never,
  > = {
    equals?:
      | $Enums.TipoMovimentacao
      | EnumTipoMovimentacaoFieldRefInput<$PrismaModel>;
    in?: $Enums.TipoMovimentacao[];
    notIn?: $Enums.TipoMovimentacao[];
    not?:
      | NestedEnumTipoMovimentacaoWithAggregatesFilter<$PrismaModel>
      | $Enums.TipoMovimentacao;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedEnumTipoMovimentacaoFilter<$PrismaModel>;
    _max?: NestedEnumTipoMovimentacaoFilter<$PrismaModel>;
  };

  export type NestedEnumStatusLoteFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusLote | EnumStatusLoteFieldRefInput<$PrismaModel>;
    in?: $Enums.StatusLote[];
    notIn?: $Enums.StatusLote[];
    not?: NestedEnumStatusLoteFilter<$PrismaModel> | $Enums.StatusLote;
  };

  export type NestedEnumStatusLoteWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusLote | EnumStatusLoteFieldRefInput<$PrismaModel>;
    in?: $Enums.StatusLote[];
    notIn?: $Enums.StatusLote[];
    not?:
      | NestedEnumStatusLoteWithAggregatesFilter<$PrismaModel>
      | $Enums.StatusLote;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedEnumStatusLoteFilter<$PrismaModel>;
    _max?: NestedEnumStatusLoteFilter<$PrismaModel>;
  };

  export type NestedEnumStatusSobraFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusSobra | EnumStatusSobraFieldRefInput<$PrismaModel>;
    in?: $Enums.StatusSobra[];
    notIn?: $Enums.StatusSobra[];
    not?: NestedEnumStatusSobraFilter<$PrismaModel> | $Enums.StatusSobra;
  };

  export type NestedEnumStatusSobraWithAggregatesFilter<$PrismaModel = never> =
    {
      equals?: $Enums.StatusSobra | EnumStatusSobraFieldRefInput<$PrismaModel>;
      in?: $Enums.StatusSobra[];
      notIn?: $Enums.StatusSobra[];
      not?:
        | NestedEnumStatusSobraWithAggregatesFilter<$PrismaModel>
        | $Enums.StatusSobra;
      _count?: NestedIntFilter<$PrismaModel>;
      _min?: NestedEnumStatusSobraFilter<$PrismaModel>;
      _max?: NestedEnumStatusSobraFilter<$PrismaModel>;
    };

  export type EstoqueItemCreateWithoutLocalizacaoInput = {
    id?: string;
    insumoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    movimentacoes?: EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput;
    lotes?: EstoqueLoteCreateNestedManyWithoutEstoqueInput;
    sobras?: EstoqueSobraCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemUncheckedCreateWithoutLocalizacaoInput = {
    id?: string;
    insumoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    movimentacoes?: EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput;
    lotes?: EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput;
    sobras?: EstoqueSobraUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemCreateOrConnectWithoutLocalizacaoInput = {
    where: EstoqueItemWhereUniqueInput;
    create: XOR<
      EstoqueItemCreateWithoutLocalizacaoInput,
      EstoqueItemUncheckedCreateWithoutLocalizacaoInput
    >;
  };

  export type EstoqueItemCreateManyLocalizacaoInputEnvelope = {
    data:
      | EstoqueItemCreateManyLocalizacaoInput
      | EstoqueItemCreateManyLocalizacaoInput[];
    skipDuplicates?: boolean;
  };

  export type EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput = {
    where: EstoqueItemWhereUniqueInput;
    update: XOR<
      EstoqueItemUpdateWithoutLocalizacaoInput,
      EstoqueItemUncheckedUpdateWithoutLocalizacaoInput
    >;
    create: XOR<
      EstoqueItemCreateWithoutLocalizacaoInput,
      EstoqueItemUncheckedCreateWithoutLocalizacaoInput
    >;
  };

  export type EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput = {
    where: EstoqueItemWhereUniqueInput;
    data: XOR<
      EstoqueItemUpdateWithoutLocalizacaoInput,
      EstoqueItemUncheckedUpdateWithoutLocalizacaoInput
    >;
  };

  export type EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput = {
    where: EstoqueItemScalarWhereInput;
    data: XOR<
      EstoqueItemUpdateManyMutationInput,
      EstoqueItemUncheckedUpdateManyWithoutLocalizacaoInput
    >;
  };

  export type EstoqueItemScalarWhereInput = {
    AND?: EstoqueItemScalarWhereInput | EstoqueItemScalarWhereInput[];
    OR?: EstoqueItemScalarWhereInput[];
    NOT?: EstoqueItemScalarWhereInput | EstoqueItemScalarWhereInput[];
    id?: StringFilter<'EstoqueItem'> | string;
    insumoId?: StringFilter<'EstoqueItem'> | string;
    localizacaoId?: StringFilter<'EstoqueItem'> | string;
    quantidadeAtual?:
      | DecimalFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | DecimalNullableFilter<'EstoqueItem'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFilter<'EstoqueItem'> | string;
    createdAt?: DateTimeFilter<'EstoqueItem'> | Date | string;
    updatedAt?: DateTimeFilter<'EstoqueItem'> | Date | string;
    dataUltimaMov?:
      | DateTimeNullableFilter<'EstoqueItem'>
      | Date
      | string
      | null;
  };

  export type EstoqueLocalizacaoCreateWithoutEstoquesInput = {
    id?: string;
    codigo: string;
    deposito: string;
    corredor?: string | null;
    prateleira?: string | null;
    nivel?: string | null;
    posicao?: string | null;
    descricao?: string | null;
    capacidade?: Decimal | DecimalJsLike | number | string | null;
    ativo?: boolean;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput = {
    id?: string;
    codigo: string;
    deposito: string;
    corredor?: string | null;
    prateleira?: string | null;
    nivel?: string | null;
    posicao?: string | null;
    descricao?: string | null;
    capacidade?: Decimal | DecimalJsLike | number | string | null;
    ativo?: boolean;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueLocalizacaoCreateOrConnectWithoutEstoquesInput = {
    where: EstoqueLocalizacaoWhereUniqueInput;
    create: XOR<
      EstoqueLocalizacaoCreateWithoutEstoquesInput,
      EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput
    >;
  };

  export type EstoqueMovimentacaoCreateWithoutEstoqueInput = {
    id?: string;
    tipo: $Enums.TipoMovimentacao;
    quantidade: Decimal | DecimalJsLike | number | string;
    quantidadeAnterior: Decimal | DecimalJsLike | number | string;
    quantidadePosterior: Decimal | DecimalJsLike | number | string;
    documentoRef?: string | null;
    orcamentoId?: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao?: Date | string;
    observacoes?: string | null;
  };

  export type EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput = {
    id?: string;
    tipo: $Enums.TipoMovimentacao;
    quantidade: Decimal | DecimalJsLike | number | string;
    quantidadeAnterior: Decimal | DecimalJsLike | number | string;
    quantidadePosterior: Decimal | DecimalJsLike | number | string;
    documentoRef?: string | null;
    orcamentoId?: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao?: Date | string;
    observacoes?: string | null;
  };

  export type EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput = {
    where: EstoqueMovimentacaoWhereUniqueInput;
    create: XOR<
      EstoqueMovimentacaoCreateWithoutEstoqueInput,
      EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type EstoqueMovimentacaoCreateManyEstoqueInputEnvelope = {
    data:
      | EstoqueMovimentacaoCreateManyEstoqueInput
      | EstoqueMovimentacaoCreateManyEstoqueInput[];
    skipDuplicates?: boolean;
  };

  export type EstoqueLoteCreateWithoutEstoqueInput = {
    id?: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.StatusLote;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueLoteUncheckedCreateWithoutEstoqueInput = {
    id?: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.StatusLote;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueLoteCreateOrConnectWithoutEstoqueInput = {
    where: EstoqueLoteWhereUniqueInput;
    create: XOR<
      EstoqueLoteCreateWithoutEstoqueInput,
      EstoqueLoteUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type EstoqueLoteCreateManyEstoqueInputEnvelope = {
    data:
      | EstoqueLoteCreateManyEstoqueInput
      | EstoqueLoteCreateManyEstoqueInput[];
    skipDuplicates?: boolean;
  };

  export type EstoqueSobraCreateWithoutEstoqueInput = {
    id?: string;
    codigoSobra: string;
    descricao: string;
    dimensoes?: string | null;
    area?: Decimal | DecimalJsLike | number | string | null;
    quantidade: Decimal | DecimalJsLike | number | string;
    unidadeMedida: string;
    material: string;
    cor?: string | null;
    acabamento?: string | null;
    status?: $Enums.StatusSobra;
    origem?: string | null;
    dataGeracao?: Date | string;
    orcamentoOrigem?: string | null;
    dataAproveitamento?: Date | string | null;
    quantidadeAproveitada?: Decimal | DecimalJsLike | number | string;
    economiaGerada?: Decimal | DecimalJsLike | number | string;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    aproveitamentos?: EstoqueAproveitamentoCreateNestedManyWithoutSobraInput;
  };

  export type EstoqueSobraUncheckedCreateWithoutEstoqueInput = {
    id?: string;
    codigoSobra: string;
    descricao: string;
    dimensoes?: string | null;
    area?: Decimal | DecimalJsLike | number | string | null;
    quantidade: Decimal | DecimalJsLike | number | string;
    unidadeMedida: string;
    material: string;
    cor?: string | null;
    acabamento?: string | null;
    status?: $Enums.StatusSobra;
    origem?: string | null;
    dataGeracao?: Date | string;
    orcamentoOrigem?: string | null;
    dataAproveitamento?: Date | string | null;
    quantidadeAproveitada?: Decimal | DecimalJsLike | number | string;
    economiaGerada?: Decimal | DecimalJsLike | number | string;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    aproveitamentos?: EstoqueAproveitamentoUncheckedCreateNestedManyWithoutSobraInput;
  };

  export type EstoqueSobraCreateOrConnectWithoutEstoqueInput = {
    where: EstoqueSobraWhereUniqueInput;
    create: XOR<
      EstoqueSobraCreateWithoutEstoqueInput,
      EstoqueSobraUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type EstoqueSobraCreateManyEstoqueInputEnvelope = {
    data:
      | EstoqueSobraCreateManyEstoqueInput
      | EstoqueSobraCreateManyEstoqueInput[];
    skipDuplicates?: boolean;
  };

  export type EstoqueLocalizacaoUpsertWithoutEstoquesInput = {
    update: XOR<
      EstoqueLocalizacaoUpdateWithoutEstoquesInput,
      EstoqueLocalizacaoUncheckedUpdateWithoutEstoquesInput
    >;
    create: XOR<
      EstoqueLocalizacaoCreateWithoutEstoquesInput,
      EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput
    >;
    where?: EstoqueLocalizacaoWhereInput;
  };

  export type EstoqueLocalizacaoUpdateToOneWithWhereWithoutEstoquesInput = {
    where?: EstoqueLocalizacaoWhereInput;
    data: XOR<
      EstoqueLocalizacaoUpdateWithoutEstoquesInput,
      EstoqueLocalizacaoUncheckedUpdateWithoutEstoquesInput
    >;
  };

  export type EstoqueLocalizacaoUpdateWithoutEstoquesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigo?: StringFieldUpdateOperationsInput | string;
    deposito?: StringFieldUpdateOperationsInput | string;
    corredor?: NullableStringFieldUpdateOperationsInput | string | null;
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null;
    nivel?: NullableStringFieldUpdateOperationsInput | string | null;
    posicao?: NullableStringFieldUpdateOperationsInput | string | null;
    descricao?: NullableStringFieldUpdateOperationsInput | string | null;
    capacidade?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolFieldUpdateOperationsInput | boolean;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueLocalizacaoUncheckedUpdateWithoutEstoquesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigo?: StringFieldUpdateOperationsInput | string;
    deposito?: StringFieldUpdateOperationsInput | string;
    corredor?: NullableStringFieldUpdateOperationsInput | string | null;
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null;
    nivel?: NullableStringFieldUpdateOperationsInput | string | null;
    posicao?: NullableStringFieldUpdateOperationsInput | string | null;
    descricao?: NullableStringFieldUpdateOperationsInput | string | null;
    capacidade?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolFieldUpdateOperationsInput | boolean;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueMovimentacaoWhereUniqueInput;
    update: XOR<
      EstoqueMovimentacaoUpdateWithoutEstoqueInput,
      EstoqueMovimentacaoUncheckedUpdateWithoutEstoqueInput
    >;
    create: XOR<
      EstoqueMovimentacaoCreateWithoutEstoqueInput,
      EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueMovimentacaoWhereUniqueInput;
    data: XOR<
      EstoqueMovimentacaoUpdateWithoutEstoqueInput,
      EstoqueMovimentacaoUncheckedUpdateWithoutEstoqueInput
    >;
  };

  export type EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput = {
    where: EstoqueMovimentacaoScalarWhereInput;
    data: XOR<
      EstoqueMovimentacaoUpdateManyMutationInput,
      EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueInput
    >;
  };

  export type EstoqueMovimentacaoScalarWhereInput = {
    AND?:
      | EstoqueMovimentacaoScalarWhereInput
      | EstoqueMovimentacaoScalarWhereInput[];
    OR?: EstoqueMovimentacaoScalarWhereInput[];
    NOT?:
      | EstoqueMovimentacaoScalarWhereInput
      | EstoqueMovimentacaoScalarWhereInput[];
    id?: StringFilter<'EstoqueMovimentacao'> | string;
    estoqueId?: StringFilter<'EstoqueMovimentacao'> | string;
    tipo?:
      | EnumTipoMovimentacaoFilter<'EstoqueMovimentacao'>
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFilter<'EstoqueMovimentacao'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: StringNullableFilter<'EstoqueMovimentacao'> | string | null;
    orcamentoId?: StringNullableFilter<'EstoqueMovimentacao'> | string | null;
    usuarioId?: StringFilter<'EstoqueMovimentacao'> | string;
    lojaId?: StringFilter<'EstoqueMovimentacao'> | string;
    dataMovimentacao?: DateTimeFilter<'EstoqueMovimentacao'> | Date | string;
    observacoes?: StringNullableFilter<'EstoqueMovimentacao'> | string | null;
  };

  export type EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueLoteWhereUniqueInput;
    update: XOR<
      EstoqueLoteUpdateWithoutEstoqueInput,
      EstoqueLoteUncheckedUpdateWithoutEstoqueInput
    >;
    create: XOR<
      EstoqueLoteCreateWithoutEstoqueInput,
      EstoqueLoteUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueLoteWhereUniqueInput;
    data: XOR<
      EstoqueLoteUpdateWithoutEstoqueInput,
      EstoqueLoteUncheckedUpdateWithoutEstoqueInput
    >;
  };

  export type EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput = {
    where: EstoqueLoteScalarWhereInput;
    data: XOR<
      EstoqueLoteUpdateManyMutationInput,
      EstoqueLoteUncheckedUpdateManyWithoutEstoqueInput
    >;
  };

  export type EstoqueLoteScalarWhereInput = {
    AND?: EstoqueLoteScalarWhereInput | EstoqueLoteScalarWhereInput[];
    OR?: EstoqueLoteScalarWhereInput[];
    NOT?: EstoqueLoteScalarWhereInput | EstoqueLoteScalarWhereInput[];
    id?: StringFilter<'EstoqueLote'> | string;
    estoqueId?: StringFilter<'EstoqueLote'> | string;
    numeroLote?: StringFilter<'EstoqueLote'> | string;
    dataFabricacao?:
      | DateTimeNullableFilter<'EstoqueLote'>
      | Date
      | string
      | null;
    dataValidade?: DateTimeNullableFilter<'EstoqueLote'> | Date | string | null;
    quantidadeLote?:
      | DecimalFilter<'EstoqueLote'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFilter<'EstoqueLote'> | $Enums.StatusLote;
    lojaId?: StringFilter<'EstoqueLote'> | string;
    createdAt?: DateTimeFilter<'EstoqueLote'> | Date | string;
    updatedAt?: DateTimeFilter<'EstoqueLote'> | Date | string;
  };

  export type EstoqueSobraUpsertWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueSobraWhereUniqueInput;
    update: XOR<
      EstoqueSobraUpdateWithoutEstoqueInput,
      EstoqueSobraUncheckedUpdateWithoutEstoqueInput
    >;
    create: XOR<
      EstoqueSobraCreateWithoutEstoqueInput,
      EstoqueSobraUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type EstoqueSobraUpdateWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueSobraWhereUniqueInput;
    data: XOR<
      EstoqueSobraUpdateWithoutEstoqueInput,
      EstoqueSobraUncheckedUpdateWithoutEstoqueInput
    >;
  };

  export type EstoqueSobraUpdateManyWithWhereWithoutEstoqueInput = {
    where: EstoqueSobraScalarWhereInput;
    data: XOR<
      EstoqueSobraUpdateManyMutationInput,
      EstoqueSobraUncheckedUpdateManyWithoutEstoqueInput
    >;
  };

  export type EstoqueSobraScalarWhereInput = {
    AND?: EstoqueSobraScalarWhereInput | EstoqueSobraScalarWhereInput[];
    OR?: EstoqueSobraScalarWhereInput[];
    NOT?: EstoqueSobraScalarWhereInput | EstoqueSobraScalarWhereInput[];
    id?: StringFilter<'EstoqueSobra'> | string;
    estoqueId?: StringFilter<'EstoqueSobra'> | string;
    codigoSobra?: StringFilter<'EstoqueSobra'> | string;
    descricao?: StringFilter<'EstoqueSobra'> | string;
    dimensoes?: StringNullableFilter<'EstoqueSobra'> | string | null;
    area?:
      | DecimalNullableFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFilter<'EstoqueSobra'> | string;
    material?: StringFilter<'EstoqueSobra'> | string;
    cor?: StringNullableFilter<'EstoqueSobra'> | string | null;
    acabamento?: StringNullableFilter<'EstoqueSobra'> | string | null;
    status?: EnumStatusSobraFilter<'EstoqueSobra'> | $Enums.StatusSobra;
    origem?: StringNullableFilter<'EstoqueSobra'> | string | null;
    dataGeracao?: DateTimeFilter<'EstoqueSobra'> | Date | string;
    orcamentoOrigem?: StringNullableFilter<'EstoqueSobra'> | string | null;
    dataAproveitamento?:
      | DateTimeNullableFilter<'EstoqueSobra'>
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFilter<'EstoqueSobra'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFilter<'EstoqueSobra'> | string;
    createdAt?: DateTimeFilter<'EstoqueSobra'> | Date | string;
    updatedAt?: DateTimeFilter<'EstoqueSobra'> | Date | string;
  };

  export type EstoqueItemCreateWithoutMovimentacoesInput = {
    id?: string;
    insumoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    localizacao: EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput;
    lotes?: EstoqueLoteCreateNestedManyWithoutEstoqueInput;
    sobras?: EstoqueSobraCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemUncheckedCreateWithoutMovimentacoesInput = {
    id?: string;
    insumoId: string;
    localizacaoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    lotes?: EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput;
    sobras?: EstoqueSobraUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemCreateOrConnectWithoutMovimentacoesInput = {
    where: EstoqueItemWhereUniqueInput;
    create: XOR<
      EstoqueItemCreateWithoutMovimentacoesInput,
      EstoqueItemUncheckedCreateWithoutMovimentacoesInput
    >;
  };

  export type EstoqueItemUpsertWithoutMovimentacoesInput = {
    update: XOR<
      EstoqueItemUpdateWithoutMovimentacoesInput,
      EstoqueItemUncheckedUpdateWithoutMovimentacoesInput
    >;
    create: XOR<
      EstoqueItemCreateWithoutMovimentacoesInput,
      EstoqueItemUncheckedCreateWithoutMovimentacoesInput
    >;
    where?: EstoqueItemWhereInput;
  };

  export type EstoqueItemUpdateToOneWithWhereWithoutMovimentacoesInput = {
    where?: EstoqueItemWhereInput;
    data: XOR<
      EstoqueItemUpdateWithoutMovimentacoesInput,
      EstoqueItemUncheckedUpdateWithoutMovimentacoesInput
    >;
  };

  export type EstoqueItemUpdateWithoutMovimentacoesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    localizacao?: EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput;
    lotes?: EstoqueLoteUpdateManyWithoutEstoqueNestedInput;
    sobras?: EstoqueSobraUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemUncheckedUpdateWithoutMovimentacoesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    localizacaoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    lotes?: EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput;
    sobras?: EstoqueSobraUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemCreateWithoutLotesInput = {
    id?: string;
    insumoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    localizacao: EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput;
    movimentacoes?: EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput;
    sobras?: EstoqueSobraCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemUncheckedCreateWithoutLotesInput = {
    id?: string;
    insumoId: string;
    localizacaoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    movimentacoes?: EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput;
    sobras?: EstoqueSobraUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemCreateOrConnectWithoutLotesInput = {
    where: EstoqueItemWhereUniqueInput;
    create: XOR<
      EstoqueItemCreateWithoutLotesInput,
      EstoqueItemUncheckedCreateWithoutLotesInput
    >;
  };

  export type EstoqueItemUpsertWithoutLotesInput = {
    update: XOR<
      EstoqueItemUpdateWithoutLotesInput,
      EstoqueItemUncheckedUpdateWithoutLotesInput
    >;
    create: XOR<
      EstoqueItemCreateWithoutLotesInput,
      EstoqueItemUncheckedCreateWithoutLotesInput
    >;
    where?: EstoqueItemWhereInput;
  };

  export type EstoqueItemUpdateToOneWithWhereWithoutLotesInput = {
    where?: EstoqueItemWhereInput;
    data: XOR<
      EstoqueItemUpdateWithoutLotesInput,
      EstoqueItemUncheckedUpdateWithoutLotesInput
    >;
  };

  export type EstoqueItemUpdateWithoutLotesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    localizacao?: EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput;
    movimentacoes?: EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput;
    sobras?: EstoqueSobraUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemUncheckedUpdateWithoutLotesInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    localizacaoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    movimentacoes?: EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput;
    sobras?: EstoqueSobraUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemCreateWithoutSobrasInput = {
    id?: string;
    insumoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    localizacao: EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput;
    movimentacoes?: EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput;
    lotes?: EstoqueLoteCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemUncheckedCreateWithoutSobrasInput = {
    id?: string;
    insumoId: string;
    localizacaoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
    movimentacoes?: EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput;
    lotes?: EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type EstoqueItemCreateOrConnectWithoutSobrasInput = {
    where: EstoqueItemWhereUniqueInput;
    create: XOR<
      EstoqueItemCreateWithoutSobrasInput,
      EstoqueItemUncheckedCreateWithoutSobrasInput
    >;
  };

  export type EstoqueAproveitamentoCreateWithoutSobraInput = {
    id?: string;
    quantidadeAproveitada: Decimal | DecimalJsLike | number | string;
    projetoDestino?: string | null;
    orcamentoDestino?: string | null;
    observacoes?: string | null;
    lojaId: string;
    createdAt?: Date | string;
  };

  export type EstoqueAproveitamentoUncheckedCreateWithoutSobraInput = {
    id?: string;
    quantidadeAproveitada: Decimal | DecimalJsLike | number | string;
    projetoDestino?: string | null;
    orcamentoDestino?: string | null;
    observacoes?: string | null;
    lojaId: string;
    createdAt?: Date | string;
  };

  export type EstoqueAproveitamentoCreateOrConnectWithoutSobraInput = {
    where: EstoqueAproveitamentoWhereUniqueInput;
    create: XOR<
      EstoqueAproveitamentoCreateWithoutSobraInput,
      EstoqueAproveitamentoUncheckedCreateWithoutSobraInput
    >;
  };

  export type EstoqueAproveitamentoCreateManySobraInputEnvelope = {
    data:
      | EstoqueAproveitamentoCreateManySobraInput
      | EstoqueAproveitamentoCreateManySobraInput[];
    skipDuplicates?: boolean;
  };

  export type EstoqueItemUpsertWithoutSobrasInput = {
    update: XOR<
      EstoqueItemUpdateWithoutSobrasInput,
      EstoqueItemUncheckedUpdateWithoutSobrasInput
    >;
    create: XOR<
      EstoqueItemCreateWithoutSobrasInput,
      EstoqueItemUncheckedCreateWithoutSobrasInput
    >;
    where?: EstoqueItemWhereInput;
  };

  export type EstoqueItemUpdateToOneWithWhereWithoutSobrasInput = {
    where?: EstoqueItemWhereInput;
    data: XOR<
      EstoqueItemUpdateWithoutSobrasInput,
      EstoqueItemUncheckedUpdateWithoutSobrasInput
    >;
  };

  export type EstoqueItemUpdateWithoutSobrasInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    localizacao?: EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput;
    movimentacoes?: EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput;
    lotes?: EstoqueLoteUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemUncheckedUpdateWithoutSobrasInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    localizacaoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    movimentacoes?: EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput;
    lotes?: EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueAproveitamentoUpsertWithWhereUniqueWithoutSobraInput = {
    where: EstoqueAproveitamentoWhereUniqueInput;
    update: XOR<
      EstoqueAproveitamentoUpdateWithoutSobraInput,
      EstoqueAproveitamentoUncheckedUpdateWithoutSobraInput
    >;
    create: XOR<
      EstoqueAproveitamentoCreateWithoutSobraInput,
      EstoqueAproveitamentoUncheckedCreateWithoutSobraInput
    >;
  };

  export type EstoqueAproveitamentoUpdateWithWhereUniqueWithoutSobraInput = {
    where: EstoqueAproveitamentoWhereUniqueInput;
    data: XOR<
      EstoqueAproveitamentoUpdateWithoutSobraInput,
      EstoqueAproveitamentoUncheckedUpdateWithoutSobraInput
    >;
  };

  export type EstoqueAproveitamentoUpdateManyWithWhereWithoutSobraInput = {
    where: EstoqueAproveitamentoScalarWhereInput;
    data: XOR<
      EstoqueAproveitamentoUpdateManyMutationInput,
      EstoqueAproveitamentoUncheckedUpdateManyWithoutSobraInput
    >;
  };

  export type EstoqueAproveitamentoScalarWhereInput = {
    AND?:
      | EstoqueAproveitamentoScalarWhereInput
      | EstoqueAproveitamentoScalarWhereInput[];
    OR?: EstoqueAproveitamentoScalarWhereInput[];
    NOT?:
      | EstoqueAproveitamentoScalarWhereInput
      | EstoqueAproveitamentoScalarWhereInput[];
    id?: StringFilter<'EstoqueAproveitamento'> | string;
    sobraId?: StringFilter<'EstoqueAproveitamento'> | string;
    quantidadeAproveitada?:
      | DecimalFilter<'EstoqueAproveitamento'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?:
      | StringNullableFilter<'EstoqueAproveitamento'>
      | string
      | null;
    orcamentoDestino?:
      | StringNullableFilter<'EstoqueAproveitamento'>
      | string
      | null;
    observacoes?: StringNullableFilter<'EstoqueAproveitamento'> | string | null;
    lojaId?: StringFilter<'EstoqueAproveitamento'> | string;
    createdAt?: DateTimeFilter<'EstoqueAproveitamento'> | Date | string;
  };

  export type EstoqueSobraCreateWithoutAproveitamentosInput = {
    id?: string;
    codigoSobra: string;
    descricao: string;
    dimensoes?: string | null;
    area?: Decimal | DecimalJsLike | number | string | null;
    quantidade: Decimal | DecimalJsLike | number | string;
    unidadeMedida: string;
    material: string;
    cor?: string | null;
    acabamento?: string | null;
    status?: $Enums.StatusSobra;
    origem?: string | null;
    dataGeracao?: Date | string;
    orcamentoOrigem?: string | null;
    dataAproveitamento?: Date | string | null;
    quantidadeAproveitada?: Decimal | DecimalJsLike | number | string;
    economiaGerada?: Decimal | DecimalJsLike | number | string;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    estoque: EstoqueItemCreateNestedOneWithoutSobrasInput;
  };

  export type EstoqueSobraUncheckedCreateWithoutAproveitamentosInput = {
    id?: string;
    estoqueId: string;
    codigoSobra: string;
    descricao: string;
    dimensoes?: string | null;
    area?: Decimal | DecimalJsLike | number | string | null;
    quantidade: Decimal | DecimalJsLike | number | string;
    unidadeMedida: string;
    material: string;
    cor?: string | null;
    acabamento?: string | null;
    status?: $Enums.StatusSobra;
    origem?: string | null;
    dataGeracao?: Date | string;
    orcamentoOrigem?: string | null;
    dataAproveitamento?: Date | string | null;
    quantidadeAproveitada?: Decimal | DecimalJsLike | number | string;
    economiaGerada?: Decimal | DecimalJsLike | number | string;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueSobraCreateOrConnectWithoutAproveitamentosInput = {
    where: EstoqueSobraWhereUniqueInput;
    create: XOR<
      EstoqueSobraCreateWithoutAproveitamentosInput,
      EstoqueSobraUncheckedCreateWithoutAproveitamentosInput
    >;
  };

  export type EstoqueSobraUpsertWithoutAproveitamentosInput = {
    update: XOR<
      EstoqueSobraUpdateWithoutAproveitamentosInput,
      EstoqueSobraUncheckedUpdateWithoutAproveitamentosInput
    >;
    create: XOR<
      EstoqueSobraCreateWithoutAproveitamentosInput,
      EstoqueSobraUncheckedCreateWithoutAproveitamentosInput
    >;
    where?: EstoqueSobraWhereInput;
  };

  export type EstoqueSobraUpdateToOneWithWhereWithoutAproveitamentosInput = {
    where?: EstoqueSobraWhereInput;
    data: XOR<
      EstoqueSobraUpdateWithoutAproveitamentosInput,
      EstoqueSobraUncheckedUpdateWithoutAproveitamentosInput
    >;
  };

  export type EstoqueSobraUpdateWithoutAproveitamentosInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    estoque?: EstoqueItemUpdateOneRequiredWithoutSobrasNestedInput;
  };

  export type EstoqueSobraUncheckedUpdateWithoutAproveitamentosInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueItemCreateManyLocalizacaoInput = {
    id?: string;
    insumoId: string;
    quantidadeAtual?: Decimal | DecimalJsLike | number | string;
    quantidadeReservada?: Decimal | DecimalJsLike | number | string;
    estoqueMinimo?: Decimal | DecimalJsLike | number | string;
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    dataUltimaMov?: Date | string | null;
  };

  export type EstoqueItemUpdateWithoutLocalizacaoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    movimentacoes?: EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput;
    lotes?: EstoqueLoteUpdateManyWithoutEstoqueNestedInput;
    sobras?: EstoqueSobraUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemUncheckedUpdateWithoutLocalizacaoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    movimentacoes?: EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput;
    lotes?: EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput;
    sobras?: EstoqueSobraUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type EstoqueItemUncheckedUpdateManyWithoutLocalizacaoInput = {
    id?: StringFieldUpdateOperationsInput | string;
    insumoId?: StringFieldUpdateOperationsInput | string;
    quantidadeAtual?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    dataUltimaMov?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
  };

  export type EstoqueMovimentacaoCreateManyEstoqueInput = {
    id?: string;
    tipo: $Enums.TipoMovimentacao;
    quantidade: Decimal | DecimalJsLike | number | string;
    quantidadeAnterior: Decimal | DecimalJsLike | number | string;
    quantidadePosterior: Decimal | DecimalJsLike | number | string;
    documentoRef?: string | null;
    orcamentoId?: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao?: Date | string;
    observacoes?: string | null;
  };

  export type EstoqueLoteCreateManyEstoqueInput = {
    id?: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.StatusLote;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueSobraCreateManyEstoqueInput = {
    id?: string;
    codigoSobra: string;
    descricao: string;
    dimensoes?: string | null;
    area?: Decimal | DecimalJsLike | number | string | null;
    quantidade: Decimal | DecimalJsLike | number | string;
    unidadeMedida: string;
    material: string;
    cor?: string | null;
    acabamento?: string | null;
    status?: $Enums.StatusSobra;
    origem?: string | null;
    dataGeracao?: Date | string;
    orcamentoOrigem?: string | null;
    dataAproveitamento?: Date | string | null;
    quantidadeAproveitada?: Decimal | DecimalJsLike | number | string;
    economiaGerada?: Decimal | DecimalJsLike | number | string;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type EstoqueMovimentacaoUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumTipoMovimentacaoFieldUpdateOperationsInput
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null;
    usuarioId?: StringFieldUpdateOperationsInput | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
  };

  export type EstoqueMovimentacaoUncheckedUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumTipoMovimentacaoFieldUpdateOperationsInput
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null;
    usuarioId?: StringFieldUpdateOperationsInput | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
  };

  export type EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumTipoMovimentacaoFieldUpdateOperationsInput
      | $Enums.TipoMovimentacao;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null;
    usuarioId?: StringFieldUpdateOperationsInput | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
  };

  export type EstoqueLoteUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    numeroLote?: StringFieldUpdateOperationsInput | string;
    dataFabricacao?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    dataValidade?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueLoteUncheckedUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    numeroLote?: StringFieldUpdateOperationsInput | string;
    dataFabricacao?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    dataValidade?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueLoteUncheckedUpdateManyWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    numeroLote?: StringFieldUpdateOperationsInput | string;
    dataFabricacao?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    dataValidade?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueSobraUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    aproveitamentos?: EstoqueAproveitamentoUpdateManyWithoutSobraNestedInput;
  };

  export type EstoqueSobraUncheckedUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    aproveitamentos?: EstoqueAproveitamentoUncheckedUpdateManyWithoutSobraNestedInput;
  };

  export type EstoqueSobraUncheckedUpdateManyWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    codigoSobra?: StringFieldUpdateOperationsInput | string;
    descricao?: StringFieldUpdateOperationsInput | string;
    dimensoes?: NullableStringFieldUpdateOperationsInput | string | null;
    area?:
      | NullableDecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    quantidade?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    unidadeMedida?: StringFieldUpdateOperationsInput | string;
    material?: StringFieldUpdateOperationsInput | string;
    cor?: NullableStringFieldUpdateOperationsInput | string | null;
    acabamento?: NullableStringFieldUpdateOperationsInput | string | null;
    status?: EnumStatusSobraFieldUpdateOperationsInput | $Enums.StatusSobra;
    origem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataGeracao?: DateTimeFieldUpdateOperationsInput | Date | string;
    orcamentoOrigem?: NullableStringFieldUpdateOperationsInput | string | null;
    dataAproveitamento?:
      | NullableDateTimeFieldUpdateOperationsInput
      | Date
      | string
      | null;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    economiaGerada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueAproveitamentoCreateManySobraInput = {
    id?: string;
    quantidadeAproveitada: Decimal | DecimalJsLike | number | string;
    projetoDestino?: string | null;
    orcamentoDestino?: string | null;
    observacoes?: string | null;
    lojaId: string;
    createdAt?: Date | string;
  };

  export type EstoqueAproveitamentoUpdateWithoutSobraInput = {
    id?: StringFieldUpdateOperationsInput | string;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueAproveitamentoUncheckedUpdateWithoutSobraInput = {
    id?: StringFieldUpdateOperationsInput | string;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type EstoqueAproveitamentoUncheckedUpdateManyWithoutSobraInput = {
    id?: StringFieldUpdateOperationsInput | string;
    quantidadeAproveitada?:
      | DecimalFieldUpdateOperationsInput
      | Decimal
      | DecimalJsLike
      | number
      | string;
    projetoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    orcamentoDestino?: NullableStringFieldUpdateOperationsInput | string | null;
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number;
  };

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF;
}
