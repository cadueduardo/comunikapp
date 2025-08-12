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
 * Model InventoryLocation
 *
 */
export type InventoryLocation =
  $Result.DefaultSelection<Prisma.$InventoryLocationPayload>;
/**
 * Model InventoryStock
 *
 */
export type InventoryStock =
  $Result.DefaultSelection<Prisma.$InventoryStockPayload>;
/**
 * Model InventoryMovement
 *
 */
export type InventoryMovement =
  $Result.DefaultSelection<Prisma.$InventoryMovementPayload>;
/**
 * Model InventoryLot
 *
 */
export type InventoryLot =
  $Result.DefaultSelection<Prisma.$InventoryLotPayload>;

/**
 * Enums
 */
export namespace $Enums {
  export const InventoryMovementType: {
    ENTRADA: 'ENTRADA';
    SAIDA: 'SAIDA';
    AJUSTE: 'AJUSTE';
    INVENTARIO: 'INVENTARIO';
    TRANSFERENCIA: 'TRANSFERENCIA';
  };

  export type InventoryMovementType =
    (typeof InventoryMovementType)[keyof typeof InventoryMovementType];

  export const InventoryLotStatus: {
    ATIVO: 'ATIVO';
    VENCIDO: 'VENCIDO';
    CONSUMIDO: 'CONSUMIDO';
    BLOQUEADO: 'BLOQUEADO';
  };

  export type InventoryLotStatus =
    (typeof InventoryLotStatus)[keyof typeof InventoryLotStatus];
}

export type InventoryMovementType = $Enums.InventoryMovementType;

export const InventoryMovementType: typeof $Enums.InventoryMovementType;

export type InventoryLotStatus = $Enums.InventoryLotStatus;

export const InventoryLotStatus: typeof $Enums.InventoryLotStatus;

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more InventoryLocations
 * const inventoryLocations = await prisma.inventoryLocation.findMany()
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
   * // Fetch zero or more InventoryLocations
   * const inventoryLocations = await prisma.inventoryLocation.findMany()
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
   * `prisma.inventoryLocation`: Exposes CRUD operations for the **InventoryLocation** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more InventoryLocations
   * const inventoryLocations = await prisma.inventoryLocation.findMany()
   * ```
   */
  get inventoryLocation(): Prisma.InventoryLocationDelegate<
    ExtArgs,
    ClientOptions
  >;

  /**
   * `prisma.inventoryStock`: Exposes CRUD operations for the **InventoryStock** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more InventoryStocks
   * const inventoryStocks = await prisma.inventoryStock.findMany()
   * ```
   */
  get inventoryStock(): Prisma.InventoryStockDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.inventoryMovement`: Exposes CRUD operations for the **InventoryMovement** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more InventoryMovements
   * const inventoryMovements = await prisma.inventoryMovement.findMany()
   * ```
   */
  get inventoryMovement(): Prisma.InventoryMovementDelegate<
    ExtArgs,
    ClientOptions
  >;

  /**
   * `prisma.inventoryLot`: Exposes CRUD operations for the **InventoryLot** model.
   * Example usage:
   * ```ts
   * // Fetch zero or more InventoryLots
   * const inventoryLots = await prisma.inventoryLot.findMany()
   * ```
   */
  get inventoryLot(): Prisma.InventoryLotDelegate<ExtArgs, ClientOptions>;
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
    InventoryLocation: 'InventoryLocation';
    InventoryStock: 'InventoryStock';
    InventoryMovement: 'InventoryMovement';
    InventoryLot: 'InventoryLot';
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName];

  export type Datasources = {
    inventoryDb?: Datasource;
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
        | 'inventoryLocation'
        | 'inventoryStock'
        | 'inventoryMovement'
        | 'inventoryLot';
      txIsolationLevel: Prisma.TransactionIsolationLevel;
    };
    model: {
      InventoryLocation: {
        payload: Prisma.$InventoryLocationPayload<ExtArgs>;
        fields: Prisma.InventoryLocationFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.InventoryLocationFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.InventoryLocationFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload>;
          };
          findFirst: {
            args: Prisma.InventoryLocationFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.InventoryLocationFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload>;
          };
          findMany: {
            args: Prisma.InventoryLocationFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload>[];
          };
          create: {
            args: Prisma.InventoryLocationCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload>;
          };
          createMany: {
            args: Prisma.InventoryLocationCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.InventoryLocationDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload>;
          };
          update: {
            args: Prisma.InventoryLocationUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload>;
          };
          deleteMany: {
            args: Prisma.InventoryLocationDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.InventoryLocationUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.InventoryLocationUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLocationPayload>;
          };
          aggregate: {
            args: Prisma.InventoryLocationAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateInventoryLocation>;
          };
          groupBy: {
            args: Prisma.InventoryLocationGroupByArgs<ExtArgs>;
            result: $Utils.Optional<InventoryLocationGroupByOutputType>[];
          };
          count: {
            args: Prisma.InventoryLocationCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<InventoryLocationCountAggregateOutputType>
              | number;
          };
        };
      };
      InventoryStock: {
        payload: Prisma.$InventoryStockPayload<ExtArgs>;
        fields: Prisma.InventoryStockFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.InventoryStockFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.InventoryStockFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload>;
          };
          findFirst: {
            args: Prisma.InventoryStockFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.InventoryStockFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload>;
          };
          findMany: {
            args: Prisma.InventoryStockFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload>[];
          };
          create: {
            args: Prisma.InventoryStockCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload>;
          };
          createMany: {
            args: Prisma.InventoryStockCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.InventoryStockDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload>;
          };
          update: {
            args: Prisma.InventoryStockUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload>;
          };
          deleteMany: {
            args: Prisma.InventoryStockDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.InventoryStockUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.InventoryStockUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryStockPayload>;
          };
          aggregate: {
            args: Prisma.InventoryStockAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateInventoryStock>;
          };
          groupBy: {
            args: Prisma.InventoryStockGroupByArgs<ExtArgs>;
            result: $Utils.Optional<InventoryStockGroupByOutputType>[];
          };
          count: {
            args: Prisma.InventoryStockCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<InventoryStockCountAggregateOutputType>
              | number;
          };
        };
      };
      InventoryMovement: {
        payload: Prisma.$InventoryMovementPayload<ExtArgs>;
        fields: Prisma.InventoryMovementFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.InventoryMovementFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.InventoryMovementFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload>;
          };
          findFirst: {
            args: Prisma.InventoryMovementFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.InventoryMovementFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload>;
          };
          findMany: {
            args: Prisma.InventoryMovementFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload>[];
          };
          create: {
            args: Prisma.InventoryMovementCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload>;
          };
          createMany: {
            args: Prisma.InventoryMovementCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.InventoryMovementDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload>;
          };
          update: {
            args: Prisma.InventoryMovementUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload>;
          };
          deleteMany: {
            args: Prisma.InventoryMovementDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.InventoryMovementUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.InventoryMovementUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryMovementPayload>;
          };
          aggregate: {
            args: Prisma.InventoryMovementAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateInventoryMovement>;
          };
          groupBy: {
            args: Prisma.InventoryMovementGroupByArgs<ExtArgs>;
            result: $Utils.Optional<InventoryMovementGroupByOutputType>[];
          };
          count: {
            args: Prisma.InventoryMovementCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<InventoryMovementCountAggregateOutputType>
              | number;
          };
        };
      };
      InventoryLot: {
        payload: Prisma.$InventoryLotPayload<ExtArgs>;
        fields: Prisma.InventoryLotFieldRefs;
        operations: {
          findUnique: {
            args: Prisma.InventoryLotFindUniqueArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload> | null;
          };
          findUniqueOrThrow: {
            args: Prisma.InventoryLotFindUniqueOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload>;
          };
          findFirst: {
            args: Prisma.InventoryLotFindFirstArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload> | null;
          };
          findFirstOrThrow: {
            args: Prisma.InventoryLotFindFirstOrThrowArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload>;
          };
          findMany: {
            args: Prisma.InventoryLotFindManyArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload>[];
          };
          create: {
            args: Prisma.InventoryLotCreateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload>;
          };
          createMany: {
            args: Prisma.InventoryLotCreateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          delete: {
            args: Prisma.InventoryLotDeleteArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload>;
          };
          update: {
            args: Prisma.InventoryLotUpdateArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload>;
          };
          deleteMany: {
            args: Prisma.InventoryLotDeleteManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          updateMany: {
            args: Prisma.InventoryLotUpdateManyArgs<ExtArgs>;
            result: BatchPayload;
          };
          upsert: {
            args: Prisma.InventoryLotUpsertArgs<ExtArgs>;
            result: $Utils.PayloadToResult<Prisma.$InventoryLotPayload>;
          };
          aggregate: {
            args: Prisma.InventoryLotAggregateArgs<ExtArgs>;
            result: $Utils.Optional<AggregateInventoryLot>;
          };
          groupBy: {
            args: Prisma.InventoryLotGroupByArgs<ExtArgs>;
            result: $Utils.Optional<InventoryLotGroupByOutputType>[];
          };
          count: {
            args: Prisma.InventoryLotCountArgs<ExtArgs>;
            result:
              | $Utils.Optional<InventoryLotCountAggregateOutputType>
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
    inventoryLocation?: InventoryLocationOmit;
    inventoryStock?: InventoryStockOmit;
    inventoryMovement?: InventoryMovementOmit;
    inventoryLot?: InventoryLotOmit;
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
   * Count Type InventoryLocationCountOutputType
   */

  export type InventoryLocationCountOutputType = {
    estoques: number;
  };

  export type InventoryLocationCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoques?: boolean | InventoryLocationCountOutputTypeCountEstoquesArgs;
  };

  // Custom InputTypes
  /**
   * InventoryLocationCountOutputType without action
   */
  export type InventoryLocationCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocationCountOutputType
     */
    select?: InventoryLocationCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * InventoryLocationCountOutputType without action
   */
  export type InventoryLocationCountOutputTypeCountEstoquesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: InventoryStockWhereInput;
  };

  /**
   * Count Type InventoryStockCountOutputType
   */

  export type InventoryStockCountOutputType = {
    movimentacoes: number;
    lotes: number;
  };

  export type InventoryStockCountOutputTypeSelect<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    movimentacoes?:
      | boolean
      | InventoryStockCountOutputTypeCountMovimentacoesArgs;
    lotes?: boolean | InventoryStockCountOutputTypeCountLotesArgs;
  };

  // Custom InputTypes
  /**
   * InventoryStockCountOutputType without action
   */
  export type InventoryStockCountOutputTypeDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStockCountOutputType
     */
    select?: InventoryStockCountOutputTypeSelect<ExtArgs> | null;
  };

  /**
   * InventoryStockCountOutputType without action
   */
  export type InventoryStockCountOutputTypeCountMovimentacoesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: InventoryMovementWhereInput;
  };

  /**
   * InventoryStockCountOutputType without action
   */
  export type InventoryStockCountOutputTypeCountLotesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: InventoryLotWhereInput;
  };

  /**
   * Models
   */

  /**
   * Model InventoryLocation
   */

  export type AggregateInventoryLocation = {
    _count: InventoryLocationCountAggregateOutputType | null;
    _avg: InventoryLocationAvgAggregateOutputType | null;
    _sum: InventoryLocationSumAggregateOutputType | null;
    _min: InventoryLocationMinAggregateOutputType | null;
    _max: InventoryLocationMaxAggregateOutputType | null;
  };

  export type InventoryLocationAvgAggregateOutputType = {
    capacidade: Decimal | null;
  };

  export type InventoryLocationSumAggregateOutputType = {
    capacidade: Decimal | null;
  };

  export type InventoryLocationMinAggregateOutputType = {
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

  export type InventoryLocationMaxAggregateOutputType = {
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

  export type InventoryLocationCountAggregateOutputType = {
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

  export type InventoryLocationAvgAggregateInputType = {
    capacidade?: true;
  };

  export type InventoryLocationSumAggregateInputType = {
    capacidade?: true;
  };

  export type InventoryLocationMinAggregateInputType = {
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

  export type InventoryLocationMaxAggregateInputType = {
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

  export type InventoryLocationCountAggregateInputType = {
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

  export type InventoryLocationAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which InventoryLocation to aggregate.
     */
    where?: InventoryLocationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryLocations to fetch.
     */
    orderBy?:
      | InventoryLocationOrderByWithRelationInput
      | InventoryLocationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: InventoryLocationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryLocations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryLocations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned InventoryLocations
     **/
    _count?: true | InventoryLocationCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: InventoryLocationAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: InventoryLocationSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: InventoryLocationMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: InventoryLocationMaxAggregateInputType;
  };

  export type GetInventoryLocationAggregateType<
    T extends InventoryLocationAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateInventoryLocation]: P extends
      | '_count'
      | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryLocation[P]>
      : GetScalarType<T[P], AggregateInventoryLocation[P]>;
  };

  export type InventoryLocationGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: InventoryLocationWhereInput;
    orderBy?:
      | InventoryLocationOrderByWithAggregationInput
      | InventoryLocationOrderByWithAggregationInput[];
    by: InventoryLocationScalarFieldEnum[] | InventoryLocationScalarFieldEnum;
    having?: InventoryLocationScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: InventoryLocationCountAggregateInputType | true;
    _avg?: InventoryLocationAvgAggregateInputType;
    _sum?: InventoryLocationSumAggregateInputType;
    _min?: InventoryLocationMinAggregateInputType;
    _max?: InventoryLocationMaxAggregateInputType;
  };

  export type InventoryLocationGroupByOutputType = {
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
    _count: InventoryLocationCountAggregateOutputType | null;
    _avg: InventoryLocationAvgAggregateOutputType | null;
    _sum: InventoryLocationSumAggregateOutputType | null;
    _min: InventoryLocationMinAggregateOutputType | null;
    _max: InventoryLocationMaxAggregateOutputType | null;
  };

  type GetInventoryLocationGroupByPayload<
    T extends InventoryLocationGroupByArgs,
  > = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryLocationGroupByOutputType, T['by']> & {
        [P in keyof T &
          keyof InventoryLocationGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], InventoryLocationGroupByOutputType[P]>
          : GetScalarType<T[P], InventoryLocationGroupByOutputType[P]>;
      }
    >
  >;

  export type InventoryLocationSelect<
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
      estoques?: boolean | InventoryLocation$estoquesArgs<ExtArgs>;
      _count?: boolean | InventoryLocationCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['inventoryLocation']
  >;

  export type InventoryLocationSelectScalar = {
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

  export type InventoryLocationOmit<
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
    ExtArgs['result']['inventoryLocation']
  >;
  export type InventoryLocationInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoques?: boolean | InventoryLocation$estoquesArgs<ExtArgs>;
    _count?: boolean | InventoryLocationCountOutputTypeDefaultArgs<ExtArgs>;
  };

  export type $InventoryLocationPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'InventoryLocation';
    objects: {
      estoques: Prisma.$InventoryStockPayload<ExtArgs>[];
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
      ExtArgs['result']['inventoryLocation']
    >;
    composites: {};
  };

  type InventoryLocationGetPayload<
    S extends boolean | null | undefined | InventoryLocationDefaultArgs,
  > = $Result.GetResult<Prisma.$InventoryLocationPayload, S>;

  type InventoryLocationCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    InventoryLocationFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: InventoryLocationCountAggregateInputType | true;
  };

  export interface InventoryLocationDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['InventoryLocation'];
      meta: { name: 'InventoryLocation' };
    };
    /**
     * Find zero or one InventoryLocation that matches the filter.
     * @param {InventoryLocationFindUniqueArgs} args - Arguments to find a InventoryLocation
     * @example
     * // Get one InventoryLocation
     * const inventoryLocation = await prisma.inventoryLocation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryLocationFindUniqueArgs>(
      args: SelectSubset<T, InventoryLocationFindUniqueArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one InventoryLocation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InventoryLocationFindUniqueOrThrowArgs} args - Arguments to find a InventoryLocation
     * @example
     * // Get one InventoryLocation
     * const inventoryLocation = await prisma.inventoryLocation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryLocationFindUniqueOrThrowArgs>(
      args: SelectSubset<T, InventoryLocationFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first InventoryLocation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLocationFindFirstArgs} args - Arguments to find a InventoryLocation
     * @example
     * // Get one InventoryLocation
     * const inventoryLocation = await prisma.inventoryLocation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryLocationFindFirstArgs>(
      args?: SelectSubset<T, InventoryLocationFindFirstArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first InventoryLocation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLocationFindFirstOrThrowArgs} args - Arguments to find a InventoryLocation
     * @example
     * // Get one InventoryLocation
     * const inventoryLocation = await prisma.inventoryLocation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryLocationFindFirstOrThrowArgs>(
      args?: SelectSubset<T, InventoryLocationFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more InventoryLocations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLocationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryLocations
     * const inventoryLocations = await prisma.inventoryLocation.findMany()
     *
     * // Get first 10 InventoryLocations
     * const inventoryLocations = await prisma.inventoryLocation.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const inventoryLocationWithIdOnly = await prisma.inventoryLocation.findMany({ select: { id: true } })
     *
     */
    findMany<T extends InventoryLocationFindManyArgs>(
      args?: SelectSubset<T, InventoryLocationFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a InventoryLocation.
     * @param {InventoryLocationCreateArgs} args - Arguments to create a InventoryLocation.
     * @example
     * // Create one InventoryLocation
     * const InventoryLocation = await prisma.inventoryLocation.create({
     *   data: {
     *     // ... data to create a InventoryLocation
     *   }
     * })
     *
     */
    create<T extends InventoryLocationCreateArgs>(
      args: SelectSubset<T, InventoryLocationCreateArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many InventoryLocations.
     * @param {InventoryLocationCreateManyArgs} args - Arguments to create many InventoryLocations.
     * @example
     * // Create many InventoryLocations
     * const inventoryLocation = await prisma.inventoryLocation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends InventoryLocationCreateManyArgs>(
      args?: SelectSubset<T, InventoryLocationCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a InventoryLocation.
     * @param {InventoryLocationDeleteArgs} args - Arguments to delete one InventoryLocation.
     * @example
     * // Delete one InventoryLocation
     * const InventoryLocation = await prisma.inventoryLocation.delete({
     *   where: {
     *     // ... filter to delete one InventoryLocation
     *   }
     * })
     *
     */
    delete<T extends InventoryLocationDeleteArgs>(
      args: SelectSubset<T, InventoryLocationDeleteArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one InventoryLocation.
     * @param {InventoryLocationUpdateArgs} args - Arguments to update one InventoryLocation.
     * @example
     * // Update one InventoryLocation
     * const inventoryLocation = await prisma.inventoryLocation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends InventoryLocationUpdateArgs>(
      args: SelectSubset<T, InventoryLocationUpdateArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more InventoryLocations.
     * @param {InventoryLocationDeleteManyArgs} args - Arguments to filter InventoryLocations to delete.
     * @example
     * // Delete a few InventoryLocations
     * const { count } = await prisma.inventoryLocation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends InventoryLocationDeleteManyArgs>(
      args?: SelectSubset<T, InventoryLocationDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more InventoryLocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLocationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryLocations
     * const inventoryLocation = await prisma.inventoryLocation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends InventoryLocationUpdateManyArgs>(
      args: SelectSubset<T, InventoryLocationUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one InventoryLocation.
     * @param {InventoryLocationUpsertArgs} args - Arguments to update or create a InventoryLocation.
     * @example
     * // Update or create a InventoryLocation
     * const inventoryLocation = await prisma.inventoryLocation.upsert({
     *   create: {
     *     // ... data to create a InventoryLocation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryLocation we want to update
     *   }
     * })
     */
    upsert<T extends InventoryLocationUpsertArgs>(
      args: SelectSubset<T, InventoryLocationUpsertArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      $Result.GetResult<
        Prisma.$InventoryLocationPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of InventoryLocations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLocationCountArgs} args - Arguments to filter InventoryLocations to count.
     * @example
     * // Count the number of InventoryLocations
     * const count = await prisma.inventoryLocation.count({
     *   where: {
     *     // ... the filter for the InventoryLocations we want to count
     *   }
     * })
     **/
    count<T extends InventoryLocationCountArgs>(
      args?: Subset<T, InventoryLocationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<
              T['select'],
              InventoryLocationCountAggregateOutputType
            >
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a InventoryLocation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLocationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends InventoryLocationAggregateArgs>(
      args: Subset<T, InventoryLocationAggregateArgs>,
    ): Prisma.PrismaPromise<GetInventoryLocationAggregateType<T>>;

    /**
     * Group by InventoryLocation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLocationGroupByArgs} args - Group by arguments.
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
      T extends InventoryLocationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryLocationGroupByArgs['orderBy'] }
        : { orderBy?: InventoryLocationGroupByArgs['orderBy'] },
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
      args: SubsetIntersection<T, InventoryLocationGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetInventoryLocationGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the InventoryLocation model
     */
    readonly fields: InventoryLocationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryLocation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryLocationClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    estoques<T extends InventoryLocation$estoquesArgs<ExtArgs> = {}>(
      args?: Subset<T, InventoryLocation$estoquesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$InventoryStockPayload<ExtArgs>,
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
   * Fields of the InventoryLocation model
   */
  interface InventoryLocationFieldRefs {
    readonly id: FieldRef<'InventoryLocation', 'String'>;
    readonly codigo: FieldRef<'InventoryLocation', 'String'>;
    readonly deposito: FieldRef<'InventoryLocation', 'String'>;
    readonly corredor: FieldRef<'InventoryLocation', 'String'>;
    readonly prateleira: FieldRef<'InventoryLocation', 'String'>;
    readonly nivel: FieldRef<'InventoryLocation', 'String'>;
    readonly posicao: FieldRef<'InventoryLocation', 'String'>;
    readonly descricao: FieldRef<'InventoryLocation', 'String'>;
    readonly capacidade: FieldRef<'InventoryLocation', 'Decimal'>;
    readonly ativo: FieldRef<'InventoryLocation', 'Boolean'>;
    readonly lojaId: FieldRef<'InventoryLocation', 'String'>;
    readonly createdAt: FieldRef<'InventoryLocation', 'DateTime'>;
    readonly updatedAt: FieldRef<'InventoryLocation', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * InventoryLocation findUnique
   */
  export type InventoryLocationFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLocation to fetch.
     */
    where: InventoryLocationWhereUniqueInput;
  };

  /**
   * InventoryLocation findUniqueOrThrow
   */
  export type InventoryLocationFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLocation to fetch.
     */
    where: InventoryLocationWhereUniqueInput;
  };

  /**
   * InventoryLocation findFirst
   */
  export type InventoryLocationFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLocation to fetch.
     */
    where?: InventoryLocationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryLocations to fetch.
     */
    orderBy?:
      | InventoryLocationOrderByWithRelationInput
      | InventoryLocationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for InventoryLocations.
     */
    cursor?: InventoryLocationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryLocations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryLocations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of InventoryLocations.
     */
    distinct?:
      | InventoryLocationScalarFieldEnum
      | InventoryLocationScalarFieldEnum[];
  };

  /**
   * InventoryLocation findFirstOrThrow
   */
  export type InventoryLocationFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLocation to fetch.
     */
    where?: InventoryLocationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryLocations to fetch.
     */
    orderBy?:
      | InventoryLocationOrderByWithRelationInput
      | InventoryLocationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for InventoryLocations.
     */
    cursor?: InventoryLocationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryLocations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryLocations.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of InventoryLocations.
     */
    distinct?:
      | InventoryLocationScalarFieldEnum
      | InventoryLocationScalarFieldEnum[];
  };

  /**
   * InventoryLocation findMany
   */
  export type InventoryLocationFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLocations to fetch.
     */
    where?: InventoryLocationWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryLocations to fetch.
     */
    orderBy?:
      | InventoryLocationOrderByWithRelationInput
      | InventoryLocationOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing InventoryLocations.
     */
    cursor?: InventoryLocationWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryLocations from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryLocations.
     */
    skip?: number;
    distinct?:
      | InventoryLocationScalarFieldEnum
      | InventoryLocationScalarFieldEnum[];
  };

  /**
   * InventoryLocation create
   */
  export type InventoryLocationCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * The data needed to create a InventoryLocation.
     */
    data: XOR<
      InventoryLocationCreateInput,
      InventoryLocationUncheckedCreateInput
    >;
  };

  /**
   * InventoryLocation createMany
   */
  export type InventoryLocationCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many InventoryLocations.
     */
    data: InventoryLocationCreateManyInput | InventoryLocationCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * InventoryLocation update
   */
  export type InventoryLocationUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * The data needed to update a InventoryLocation.
     */
    data: XOR<
      InventoryLocationUpdateInput,
      InventoryLocationUncheckedUpdateInput
    >;
    /**
     * Choose, which InventoryLocation to update.
     */
    where: InventoryLocationWhereUniqueInput;
  };

  /**
   * InventoryLocation updateMany
   */
  export type InventoryLocationUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update InventoryLocations.
     */
    data: XOR<
      InventoryLocationUpdateManyMutationInput,
      InventoryLocationUncheckedUpdateManyInput
    >;
    /**
     * Filter which InventoryLocations to update
     */
    where?: InventoryLocationWhereInput;
    /**
     * Limit how many InventoryLocations to update.
     */
    limit?: number;
  };

  /**
   * InventoryLocation upsert
   */
  export type InventoryLocationUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * The filter to search for the InventoryLocation to update in case it exists.
     */
    where: InventoryLocationWhereUniqueInput;
    /**
     * In case the InventoryLocation found by the `where` argument doesn't exist, create a new InventoryLocation with this data.
     */
    create: XOR<
      InventoryLocationCreateInput,
      InventoryLocationUncheckedCreateInput
    >;
    /**
     * In case the InventoryLocation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<
      InventoryLocationUpdateInput,
      InventoryLocationUncheckedUpdateInput
    >;
  };

  /**
   * InventoryLocation delete
   */
  export type InventoryLocationDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
    /**
     * Filter which InventoryLocation to delete.
     */
    where: InventoryLocationWhereUniqueInput;
  };

  /**
   * InventoryLocation deleteMany
   */
  export type InventoryLocationDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which InventoryLocations to delete
     */
    where?: InventoryLocationWhereInput;
    /**
     * Limit how many InventoryLocations to delete.
     */
    limit?: number;
  };

  /**
   * InventoryLocation.estoques
   */
  export type InventoryLocation$estoquesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    where?: InventoryStockWhereInput;
    orderBy?:
      | InventoryStockOrderByWithRelationInput
      | InventoryStockOrderByWithRelationInput[];
    cursor?: InventoryStockWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: InventoryStockScalarFieldEnum | InventoryStockScalarFieldEnum[];
  };

  /**
   * InventoryLocation without action
   */
  export type InventoryLocationDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLocation
     */
    select?: InventoryLocationSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLocation
     */
    omit?: InventoryLocationOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLocationInclude<ExtArgs> | null;
  };

  /**
   * Model InventoryStock
   */

  export type AggregateInventoryStock = {
    _count: InventoryStockCountAggregateOutputType | null;
    _avg: InventoryStockAvgAggregateOutputType | null;
    _sum: InventoryStockSumAggregateOutputType | null;
    _min: InventoryStockMinAggregateOutputType | null;
    _max: InventoryStockMaxAggregateOutputType | null;
  };

  export type InventoryStockAvgAggregateOutputType = {
    quantidadeAtual: Decimal | null;
    quantidadeReservada: Decimal | null;
    estoqueMinimo: Decimal | null;
    estoqueMaximo: Decimal | null;
  };

  export type InventoryStockSumAggregateOutputType = {
    quantidadeAtual: Decimal | null;
    quantidadeReservada: Decimal | null;
    estoqueMinimo: Decimal | null;
    estoqueMaximo: Decimal | null;
  };

  export type InventoryStockMinAggregateOutputType = {
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

  export type InventoryStockMaxAggregateOutputType = {
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

  export type InventoryStockCountAggregateOutputType = {
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

  export type InventoryStockAvgAggregateInputType = {
    quantidadeAtual?: true;
    quantidadeReservada?: true;
    estoqueMinimo?: true;
    estoqueMaximo?: true;
  };

  export type InventoryStockSumAggregateInputType = {
    quantidadeAtual?: true;
    quantidadeReservada?: true;
    estoqueMinimo?: true;
    estoqueMaximo?: true;
  };

  export type InventoryStockMinAggregateInputType = {
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

  export type InventoryStockMaxAggregateInputType = {
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

  export type InventoryStockCountAggregateInputType = {
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

  export type InventoryStockAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which InventoryStock to aggregate.
     */
    where?: InventoryStockWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryStocks to fetch.
     */
    orderBy?:
      | InventoryStockOrderByWithRelationInput
      | InventoryStockOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: InventoryStockWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryStocks from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryStocks.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned InventoryStocks
     **/
    _count?: true | InventoryStockCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: InventoryStockAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: InventoryStockSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: InventoryStockMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: InventoryStockMaxAggregateInputType;
  };

  export type GetInventoryStockAggregateType<
    T extends InventoryStockAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateInventoryStock]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryStock[P]>
      : GetScalarType<T[P], AggregateInventoryStock[P]>;
  };

  export type InventoryStockGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: InventoryStockWhereInput;
    orderBy?:
      | InventoryStockOrderByWithAggregationInput
      | InventoryStockOrderByWithAggregationInput[];
    by: InventoryStockScalarFieldEnum[] | InventoryStockScalarFieldEnum;
    having?: InventoryStockScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: InventoryStockCountAggregateInputType | true;
    _avg?: InventoryStockAvgAggregateInputType;
    _sum?: InventoryStockSumAggregateInputType;
    _min?: InventoryStockMinAggregateInputType;
    _max?: InventoryStockMaxAggregateInputType;
  };

  export type InventoryStockGroupByOutputType = {
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
    _count: InventoryStockCountAggregateOutputType | null;
    _avg: InventoryStockAvgAggregateOutputType | null;
    _sum: InventoryStockSumAggregateOutputType | null;
    _min: InventoryStockMinAggregateOutputType | null;
    _max: InventoryStockMaxAggregateOutputType | null;
  };

  type GetInventoryStockGroupByPayload<T extends InventoryStockGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<InventoryStockGroupByOutputType, T['by']> & {
          [P in keyof T &
            keyof InventoryStockGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryStockGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryStockGroupByOutputType[P]>;
        }
      >
    >;

  export type InventoryStockSelect<
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
      localizacao?: boolean | InventoryLocationDefaultArgs<ExtArgs>;
      movimentacoes?: boolean | InventoryStock$movimentacoesArgs<ExtArgs>;
      lotes?: boolean | InventoryStock$lotesArgs<ExtArgs>;
      _count?: boolean | InventoryStockCountOutputTypeDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['inventoryStock']
  >;

  export type InventoryStockSelectScalar = {
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

  export type InventoryStockOmit<
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
    ExtArgs['result']['inventoryStock']
  >;
  export type InventoryStockInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    localizacao?: boolean | InventoryLocationDefaultArgs<ExtArgs>;
    movimentacoes?: boolean | InventoryStock$movimentacoesArgs<ExtArgs>;
    lotes?: boolean | InventoryStock$lotesArgs<ExtArgs>;
    _count?: boolean | InventoryStockCountOutputTypeDefaultArgs<ExtArgs>;
  };

  export type $InventoryStockPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'InventoryStock';
    objects: {
      localizacao: Prisma.$InventoryLocationPayload<ExtArgs>;
      movimentacoes: Prisma.$InventoryMovementPayload<ExtArgs>[];
      lotes: Prisma.$InventoryLotPayload<ExtArgs>[];
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
      ExtArgs['result']['inventoryStock']
    >;
    composites: {};
  };

  type InventoryStockGetPayload<
    S extends boolean | null | undefined | InventoryStockDefaultArgs,
  > = $Result.GetResult<Prisma.$InventoryStockPayload, S>;

  type InventoryStockCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    InventoryStockFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: InventoryStockCountAggregateInputType | true;
  };

  export interface InventoryStockDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['InventoryStock'];
      meta: { name: 'InventoryStock' };
    };
    /**
     * Find zero or one InventoryStock that matches the filter.
     * @param {InventoryStockFindUniqueArgs} args - Arguments to find a InventoryStock
     * @example
     * // Get one InventoryStock
     * const inventoryStock = await prisma.inventoryStock.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryStockFindUniqueArgs>(
      args: SelectSubset<T, InventoryStockFindUniqueArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one InventoryStock that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InventoryStockFindUniqueOrThrowArgs} args - Arguments to find a InventoryStock
     * @example
     * // Get one InventoryStock
     * const inventoryStock = await prisma.inventoryStock.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryStockFindUniqueOrThrowArgs>(
      args: SelectSubset<T, InventoryStockFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first InventoryStock that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryStockFindFirstArgs} args - Arguments to find a InventoryStock
     * @example
     * // Get one InventoryStock
     * const inventoryStock = await prisma.inventoryStock.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryStockFindFirstArgs>(
      args?: SelectSubset<T, InventoryStockFindFirstArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first InventoryStock that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryStockFindFirstOrThrowArgs} args - Arguments to find a InventoryStock
     * @example
     * // Get one InventoryStock
     * const inventoryStock = await prisma.inventoryStock.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryStockFindFirstOrThrowArgs>(
      args?: SelectSubset<T, InventoryStockFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more InventoryStocks that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryStockFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryStocks
     * const inventoryStocks = await prisma.inventoryStock.findMany()
     *
     * // Get first 10 InventoryStocks
     * const inventoryStocks = await prisma.inventoryStock.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const inventoryStockWithIdOnly = await prisma.inventoryStock.findMany({ select: { id: true } })
     *
     */
    findMany<T extends InventoryStockFindManyArgs>(
      args?: SelectSubset<T, InventoryStockFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a InventoryStock.
     * @param {InventoryStockCreateArgs} args - Arguments to create a InventoryStock.
     * @example
     * // Create one InventoryStock
     * const InventoryStock = await prisma.inventoryStock.create({
     *   data: {
     *     // ... data to create a InventoryStock
     *   }
     * })
     *
     */
    create<T extends InventoryStockCreateArgs>(
      args: SelectSubset<T, InventoryStockCreateArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many InventoryStocks.
     * @param {InventoryStockCreateManyArgs} args - Arguments to create many InventoryStocks.
     * @example
     * // Create many InventoryStocks
     * const inventoryStock = await prisma.inventoryStock.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends InventoryStockCreateManyArgs>(
      args?: SelectSubset<T, InventoryStockCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a InventoryStock.
     * @param {InventoryStockDeleteArgs} args - Arguments to delete one InventoryStock.
     * @example
     * // Delete one InventoryStock
     * const InventoryStock = await prisma.inventoryStock.delete({
     *   where: {
     *     // ... filter to delete one InventoryStock
     *   }
     * })
     *
     */
    delete<T extends InventoryStockDeleteArgs>(
      args: SelectSubset<T, InventoryStockDeleteArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one InventoryStock.
     * @param {InventoryStockUpdateArgs} args - Arguments to update one InventoryStock.
     * @example
     * // Update one InventoryStock
     * const inventoryStock = await prisma.inventoryStock.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends InventoryStockUpdateArgs>(
      args: SelectSubset<T, InventoryStockUpdateArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more InventoryStocks.
     * @param {InventoryStockDeleteManyArgs} args - Arguments to filter InventoryStocks to delete.
     * @example
     * // Delete a few InventoryStocks
     * const { count } = await prisma.inventoryStock.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends InventoryStockDeleteManyArgs>(
      args?: SelectSubset<T, InventoryStockDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more InventoryStocks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryStockUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryStocks
     * const inventoryStock = await prisma.inventoryStock.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends InventoryStockUpdateManyArgs>(
      args: SelectSubset<T, InventoryStockUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one InventoryStock.
     * @param {InventoryStockUpsertArgs} args - Arguments to update or create a InventoryStock.
     * @example
     * // Update or create a InventoryStock
     * const inventoryStock = await prisma.inventoryStock.upsert({
     *   create: {
     *     // ... data to create a InventoryStock
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryStock we want to update
     *   }
     * })
     */
    upsert<T extends InventoryStockUpsertArgs>(
      args: SelectSubset<T, InventoryStockUpsertArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      $Result.GetResult<
        Prisma.$InventoryStockPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of InventoryStocks.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryStockCountArgs} args - Arguments to filter InventoryStocks to count.
     * @example
     * // Count the number of InventoryStocks
     * const count = await prisma.inventoryStock.count({
     *   where: {
     *     // ... the filter for the InventoryStocks we want to count
     *   }
     * })
     **/
    count<T extends InventoryStockCountArgs>(
      args?: Subset<T, InventoryStockCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryStockCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a InventoryStock.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryStockAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends InventoryStockAggregateArgs>(
      args: Subset<T, InventoryStockAggregateArgs>,
    ): Prisma.PrismaPromise<GetInventoryStockAggregateType<T>>;

    /**
     * Group by InventoryStock.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryStockGroupByArgs} args - Group by arguments.
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
      T extends InventoryStockGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryStockGroupByArgs['orderBy'] }
        : { orderBy?: InventoryStockGroupByArgs['orderBy'] },
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
      args: SubsetIntersection<T, InventoryStockGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetInventoryStockGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the InventoryStock model
     */
    readonly fields: InventoryStockFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryStock.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryStockClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    localizacao<T extends InventoryLocationDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, InventoryLocationDefaultArgs<ExtArgs>>,
    ): Prisma__InventoryLocationClient<
      | $Result.GetResult<
          Prisma.$InventoryLocationPayload<ExtArgs>,
          T,
          'findUniqueOrThrow',
          GlobalOmitOptions
        >
      | Null,
      Null,
      ExtArgs,
      GlobalOmitOptions
    >;
    movimentacoes<T extends InventoryStock$movimentacoesArgs<ExtArgs> = {}>(
      args?: Subset<T, InventoryStock$movimentacoesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$InventoryMovementPayload<ExtArgs>,
          T,
          'findMany',
          GlobalOmitOptions
        >
      | Null
    >;
    lotes<T extends InventoryStock$lotesArgs<ExtArgs> = {}>(
      args?: Subset<T, InventoryStock$lotesArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      | $Result.GetResult<
          Prisma.$InventoryLotPayload<ExtArgs>,
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
   * Fields of the InventoryStock model
   */
  interface InventoryStockFieldRefs {
    readonly id: FieldRef<'InventoryStock', 'String'>;
    readonly insumoId: FieldRef<'InventoryStock', 'String'>;
    readonly localizacaoId: FieldRef<'InventoryStock', 'String'>;
    readonly quantidadeAtual: FieldRef<'InventoryStock', 'Decimal'>;
    readonly quantidadeReservada: FieldRef<'InventoryStock', 'Decimal'>;
    readonly estoqueMinimo: FieldRef<'InventoryStock', 'Decimal'>;
    readonly estoqueMaximo: FieldRef<'InventoryStock', 'Decimal'>;
    readonly lojaId: FieldRef<'InventoryStock', 'String'>;
    readonly createdAt: FieldRef<'InventoryStock', 'DateTime'>;
    readonly updatedAt: FieldRef<'InventoryStock', 'DateTime'>;
    readonly dataUltimaMov: FieldRef<'InventoryStock', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * InventoryStock findUnique
   */
  export type InventoryStockFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryStock to fetch.
     */
    where: InventoryStockWhereUniqueInput;
  };

  /**
   * InventoryStock findUniqueOrThrow
   */
  export type InventoryStockFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryStock to fetch.
     */
    where: InventoryStockWhereUniqueInput;
  };

  /**
   * InventoryStock findFirst
   */
  export type InventoryStockFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryStock to fetch.
     */
    where?: InventoryStockWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryStocks to fetch.
     */
    orderBy?:
      | InventoryStockOrderByWithRelationInput
      | InventoryStockOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for InventoryStocks.
     */
    cursor?: InventoryStockWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryStocks from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryStocks.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of InventoryStocks.
     */
    distinct?: InventoryStockScalarFieldEnum | InventoryStockScalarFieldEnum[];
  };

  /**
   * InventoryStock findFirstOrThrow
   */
  export type InventoryStockFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryStock to fetch.
     */
    where?: InventoryStockWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryStocks to fetch.
     */
    orderBy?:
      | InventoryStockOrderByWithRelationInput
      | InventoryStockOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for InventoryStocks.
     */
    cursor?: InventoryStockWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryStocks from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryStocks.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of InventoryStocks.
     */
    distinct?: InventoryStockScalarFieldEnum | InventoryStockScalarFieldEnum[];
  };

  /**
   * InventoryStock findMany
   */
  export type InventoryStockFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryStocks to fetch.
     */
    where?: InventoryStockWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryStocks to fetch.
     */
    orderBy?:
      | InventoryStockOrderByWithRelationInput
      | InventoryStockOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing InventoryStocks.
     */
    cursor?: InventoryStockWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryStocks from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryStocks.
     */
    skip?: number;
    distinct?: InventoryStockScalarFieldEnum | InventoryStockScalarFieldEnum[];
  };

  /**
   * InventoryStock create
   */
  export type InventoryStockCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * The data needed to create a InventoryStock.
     */
    data: XOR<InventoryStockCreateInput, InventoryStockUncheckedCreateInput>;
  };

  /**
   * InventoryStock createMany
   */
  export type InventoryStockCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many InventoryStocks.
     */
    data: InventoryStockCreateManyInput | InventoryStockCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * InventoryStock update
   */
  export type InventoryStockUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * The data needed to update a InventoryStock.
     */
    data: XOR<InventoryStockUpdateInput, InventoryStockUncheckedUpdateInput>;
    /**
     * Choose, which InventoryStock to update.
     */
    where: InventoryStockWhereUniqueInput;
  };

  /**
   * InventoryStock updateMany
   */
  export type InventoryStockUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update InventoryStocks.
     */
    data: XOR<
      InventoryStockUpdateManyMutationInput,
      InventoryStockUncheckedUpdateManyInput
    >;
    /**
     * Filter which InventoryStocks to update
     */
    where?: InventoryStockWhereInput;
    /**
     * Limit how many InventoryStocks to update.
     */
    limit?: number;
  };

  /**
   * InventoryStock upsert
   */
  export type InventoryStockUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * The filter to search for the InventoryStock to update in case it exists.
     */
    where: InventoryStockWhereUniqueInput;
    /**
     * In case the InventoryStock found by the `where` argument doesn't exist, create a new InventoryStock with this data.
     */
    create: XOR<InventoryStockCreateInput, InventoryStockUncheckedCreateInput>;
    /**
     * In case the InventoryStock was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryStockUpdateInput, InventoryStockUncheckedUpdateInput>;
  };

  /**
   * InventoryStock delete
   */
  export type InventoryStockDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
    /**
     * Filter which InventoryStock to delete.
     */
    where: InventoryStockWhereUniqueInput;
  };

  /**
   * InventoryStock deleteMany
   */
  export type InventoryStockDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which InventoryStocks to delete
     */
    where?: InventoryStockWhereInput;
    /**
     * Limit how many InventoryStocks to delete.
     */
    limit?: number;
  };

  /**
   * InventoryStock.movimentacoes
   */
  export type InventoryStock$movimentacoesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    where?: InventoryMovementWhereInput;
    orderBy?:
      | InventoryMovementOrderByWithRelationInput
      | InventoryMovementOrderByWithRelationInput[];
    cursor?: InventoryMovementWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?:
      | InventoryMovementScalarFieldEnum
      | InventoryMovementScalarFieldEnum[];
  };

  /**
   * InventoryStock.lotes
   */
  export type InventoryStock$lotesArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    where?: InventoryLotWhereInput;
    orderBy?:
      | InventoryLotOrderByWithRelationInput
      | InventoryLotOrderByWithRelationInput[];
    cursor?: InventoryLotWhereUniqueInput;
    take?: number;
    skip?: number;
    distinct?: InventoryLotScalarFieldEnum | InventoryLotScalarFieldEnum[];
  };

  /**
   * InventoryStock without action
   */
  export type InventoryStockDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryStock
     */
    select?: InventoryStockSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryStock
     */
    omit?: InventoryStockOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryStockInclude<ExtArgs> | null;
  };

  /**
   * Model InventoryMovement
   */

  export type AggregateInventoryMovement = {
    _count: InventoryMovementCountAggregateOutputType | null;
    _avg: InventoryMovementAvgAggregateOutputType | null;
    _sum: InventoryMovementSumAggregateOutputType | null;
    _min: InventoryMovementMinAggregateOutputType | null;
    _max: InventoryMovementMaxAggregateOutputType | null;
  };

  export type InventoryMovementAvgAggregateOutputType = {
    quantidade: Decimal | null;
    quantidadeAnterior: Decimal | null;
    quantidadePosterior: Decimal | null;
  };

  export type InventoryMovementSumAggregateOutputType = {
    quantidade: Decimal | null;
    quantidadeAnterior: Decimal | null;
    quantidadePosterior: Decimal | null;
  };

  export type InventoryMovementMinAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    tipo: $Enums.InventoryMovementType | null;
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

  export type InventoryMovementMaxAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    tipo: $Enums.InventoryMovementType | null;
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

  export type InventoryMovementCountAggregateOutputType = {
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

  export type InventoryMovementAvgAggregateInputType = {
    quantidade?: true;
    quantidadeAnterior?: true;
    quantidadePosterior?: true;
  };

  export type InventoryMovementSumAggregateInputType = {
    quantidade?: true;
    quantidadeAnterior?: true;
    quantidadePosterior?: true;
  };

  export type InventoryMovementMinAggregateInputType = {
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

  export type InventoryMovementMaxAggregateInputType = {
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

  export type InventoryMovementCountAggregateInputType = {
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

  export type InventoryMovementAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which InventoryMovement to aggregate.
     */
    where?: InventoryMovementWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryMovements to fetch.
     */
    orderBy?:
      | InventoryMovementOrderByWithRelationInput
      | InventoryMovementOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: InventoryMovementWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryMovements from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryMovements.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned InventoryMovements
     **/
    _count?: true | InventoryMovementCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: InventoryMovementAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: InventoryMovementSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: InventoryMovementMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: InventoryMovementMaxAggregateInputType;
  };

  export type GetInventoryMovementAggregateType<
    T extends InventoryMovementAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateInventoryMovement]: P extends
      | '_count'
      | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryMovement[P]>
      : GetScalarType<T[P], AggregateInventoryMovement[P]>;
  };

  export type InventoryMovementGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: InventoryMovementWhereInput;
    orderBy?:
      | InventoryMovementOrderByWithAggregationInput
      | InventoryMovementOrderByWithAggregationInput[];
    by: InventoryMovementScalarFieldEnum[] | InventoryMovementScalarFieldEnum;
    having?: InventoryMovementScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: InventoryMovementCountAggregateInputType | true;
    _avg?: InventoryMovementAvgAggregateInputType;
    _sum?: InventoryMovementSumAggregateInputType;
    _min?: InventoryMovementMinAggregateInputType;
    _max?: InventoryMovementMaxAggregateInputType;
  };

  export type InventoryMovementGroupByOutputType = {
    id: string;
    estoqueId: string;
    tipo: $Enums.InventoryMovementType;
    quantidade: Decimal;
    quantidadeAnterior: Decimal;
    quantidadePosterior: Decimal;
    documentoRef: string | null;
    orcamentoId: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao: Date;
    observacoes: string | null;
    _count: InventoryMovementCountAggregateOutputType | null;
    _avg: InventoryMovementAvgAggregateOutputType | null;
    _sum: InventoryMovementSumAggregateOutputType | null;
    _min: InventoryMovementMinAggregateOutputType | null;
    _max: InventoryMovementMaxAggregateOutputType | null;
  };

  type GetInventoryMovementGroupByPayload<
    T extends InventoryMovementGroupByArgs,
  > = Prisma.PrismaPromise<
    Array<
      PickEnumerable<InventoryMovementGroupByOutputType, T['by']> & {
        [P in keyof T &
          keyof InventoryMovementGroupByOutputType]: P extends '_count'
          ? T[P] extends boolean
            ? number
            : GetScalarType<T[P], InventoryMovementGroupByOutputType[P]>
          : GetScalarType<T[P], InventoryMovementGroupByOutputType[P]>;
      }
    >
  >;

  export type InventoryMovementSelect<
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
      estoque?: boolean | InventoryStockDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['inventoryMovement']
  >;

  export type InventoryMovementSelectScalar = {
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

  export type InventoryMovementOmit<
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
    ExtArgs['result']['inventoryMovement']
  >;
  export type InventoryMovementInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoque?: boolean | InventoryStockDefaultArgs<ExtArgs>;
  };

  export type $InventoryMovementPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'InventoryMovement';
    objects: {
      estoque: Prisma.$InventoryStockPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        estoqueId: string;
        tipo: $Enums.InventoryMovementType;
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
      ExtArgs['result']['inventoryMovement']
    >;
    composites: {};
  };

  type InventoryMovementGetPayload<
    S extends boolean | null | undefined | InventoryMovementDefaultArgs,
  > = $Result.GetResult<Prisma.$InventoryMovementPayload, S>;

  type InventoryMovementCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    InventoryMovementFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: InventoryMovementCountAggregateInputType | true;
  };

  export interface InventoryMovementDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['InventoryMovement'];
      meta: { name: 'InventoryMovement' };
    };
    /**
     * Find zero or one InventoryMovement that matches the filter.
     * @param {InventoryMovementFindUniqueArgs} args - Arguments to find a InventoryMovement
     * @example
     * // Get one InventoryMovement
     * const inventoryMovement = await prisma.inventoryMovement.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryMovementFindUniqueArgs>(
      args: SelectSubset<T, InventoryMovementFindUniqueArgs<ExtArgs>>,
    ): Prisma__InventoryMovementClient<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one InventoryMovement that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InventoryMovementFindUniqueOrThrowArgs} args - Arguments to find a InventoryMovement
     * @example
     * // Get one InventoryMovement
     * const inventoryMovement = await prisma.inventoryMovement.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryMovementFindUniqueOrThrowArgs>(
      args: SelectSubset<T, InventoryMovementFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__InventoryMovementClient<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first InventoryMovement that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryMovementFindFirstArgs} args - Arguments to find a InventoryMovement
     * @example
     * // Get one InventoryMovement
     * const inventoryMovement = await prisma.inventoryMovement.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryMovementFindFirstArgs>(
      args?: SelectSubset<T, InventoryMovementFindFirstArgs<ExtArgs>>,
    ): Prisma__InventoryMovementClient<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first InventoryMovement that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryMovementFindFirstOrThrowArgs} args - Arguments to find a InventoryMovement
     * @example
     * // Get one InventoryMovement
     * const inventoryMovement = await prisma.inventoryMovement.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryMovementFindFirstOrThrowArgs>(
      args?: SelectSubset<T, InventoryMovementFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__InventoryMovementClient<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more InventoryMovements that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryMovementFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryMovements
     * const inventoryMovements = await prisma.inventoryMovement.findMany()
     *
     * // Get first 10 InventoryMovements
     * const inventoryMovements = await prisma.inventoryMovement.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const inventoryMovementWithIdOnly = await prisma.inventoryMovement.findMany({ select: { id: true } })
     *
     */
    findMany<T extends InventoryMovementFindManyArgs>(
      args?: SelectSubset<T, InventoryMovementFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a InventoryMovement.
     * @param {InventoryMovementCreateArgs} args - Arguments to create a InventoryMovement.
     * @example
     * // Create one InventoryMovement
     * const InventoryMovement = await prisma.inventoryMovement.create({
     *   data: {
     *     // ... data to create a InventoryMovement
     *   }
     * })
     *
     */
    create<T extends InventoryMovementCreateArgs>(
      args: SelectSubset<T, InventoryMovementCreateArgs<ExtArgs>>,
    ): Prisma__InventoryMovementClient<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many InventoryMovements.
     * @param {InventoryMovementCreateManyArgs} args - Arguments to create many InventoryMovements.
     * @example
     * // Create many InventoryMovements
     * const inventoryMovement = await prisma.inventoryMovement.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends InventoryMovementCreateManyArgs>(
      args?: SelectSubset<T, InventoryMovementCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a InventoryMovement.
     * @param {InventoryMovementDeleteArgs} args - Arguments to delete one InventoryMovement.
     * @example
     * // Delete one InventoryMovement
     * const InventoryMovement = await prisma.inventoryMovement.delete({
     *   where: {
     *     // ... filter to delete one InventoryMovement
     *   }
     * })
     *
     */
    delete<T extends InventoryMovementDeleteArgs>(
      args: SelectSubset<T, InventoryMovementDeleteArgs<ExtArgs>>,
    ): Prisma__InventoryMovementClient<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one InventoryMovement.
     * @param {InventoryMovementUpdateArgs} args - Arguments to update one InventoryMovement.
     * @example
     * // Update one InventoryMovement
     * const inventoryMovement = await prisma.inventoryMovement.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends InventoryMovementUpdateArgs>(
      args: SelectSubset<T, InventoryMovementUpdateArgs<ExtArgs>>,
    ): Prisma__InventoryMovementClient<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more InventoryMovements.
     * @param {InventoryMovementDeleteManyArgs} args - Arguments to filter InventoryMovements to delete.
     * @example
     * // Delete a few InventoryMovements
     * const { count } = await prisma.inventoryMovement.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends InventoryMovementDeleteManyArgs>(
      args?: SelectSubset<T, InventoryMovementDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more InventoryMovements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryMovementUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryMovements
     * const inventoryMovement = await prisma.inventoryMovement.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends InventoryMovementUpdateManyArgs>(
      args: SelectSubset<T, InventoryMovementUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one InventoryMovement.
     * @param {InventoryMovementUpsertArgs} args - Arguments to update or create a InventoryMovement.
     * @example
     * // Update or create a InventoryMovement
     * const inventoryMovement = await prisma.inventoryMovement.upsert({
     *   create: {
     *     // ... data to create a InventoryMovement
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryMovement we want to update
     *   }
     * })
     */
    upsert<T extends InventoryMovementUpsertArgs>(
      args: SelectSubset<T, InventoryMovementUpsertArgs<ExtArgs>>,
    ): Prisma__InventoryMovementClient<
      $Result.GetResult<
        Prisma.$InventoryMovementPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of InventoryMovements.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryMovementCountArgs} args - Arguments to filter InventoryMovements to count.
     * @example
     * // Count the number of InventoryMovements
     * const count = await prisma.inventoryMovement.count({
     *   where: {
     *     // ... the filter for the InventoryMovements we want to count
     *   }
     * })
     **/
    count<T extends InventoryMovementCountArgs>(
      args?: Subset<T, InventoryMovementCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<
              T['select'],
              InventoryMovementCountAggregateOutputType
            >
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a InventoryMovement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryMovementAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends InventoryMovementAggregateArgs>(
      args: Subset<T, InventoryMovementAggregateArgs>,
    ): Prisma.PrismaPromise<GetInventoryMovementAggregateType<T>>;

    /**
     * Group by InventoryMovement.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryMovementGroupByArgs} args - Group by arguments.
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
      T extends InventoryMovementGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryMovementGroupByArgs['orderBy'] }
        : { orderBy?: InventoryMovementGroupByArgs['orderBy'] },
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
      args: SubsetIntersection<T, InventoryMovementGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetInventoryMovementGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the InventoryMovement model
     */
    readonly fields: InventoryMovementFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryMovement.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryMovementClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    estoque<T extends InventoryStockDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, InventoryStockDefaultArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      | $Result.GetResult<
          Prisma.$InventoryStockPayload<ExtArgs>,
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
   * Fields of the InventoryMovement model
   */
  interface InventoryMovementFieldRefs {
    readonly id: FieldRef<'InventoryMovement', 'String'>;
    readonly estoqueId: FieldRef<'InventoryMovement', 'String'>;
    readonly tipo: FieldRef<'InventoryMovement', 'InventoryMovementType'>;
    readonly quantidade: FieldRef<'InventoryMovement', 'Decimal'>;
    readonly quantidadeAnterior: FieldRef<'InventoryMovement', 'Decimal'>;
    readonly quantidadePosterior: FieldRef<'InventoryMovement', 'Decimal'>;
    readonly documentoRef: FieldRef<'InventoryMovement', 'String'>;
    readonly orcamentoId: FieldRef<'InventoryMovement', 'String'>;
    readonly usuarioId: FieldRef<'InventoryMovement', 'String'>;
    readonly lojaId: FieldRef<'InventoryMovement', 'String'>;
    readonly dataMovimentacao: FieldRef<'InventoryMovement', 'DateTime'>;
    readonly observacoes: FieldRef<'InventoryMovement', 'String'>;
  }

  // Custom InputTypes
  /**
   * InventoryMovement findUnique
   */
  export type InventoryMovementFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryMovement to fetch.
     */
    where: InventoryMovementWhereUniqueInput;
  };

  /**
   * InventoryMovement findUniqueOrThrow
   */
  export type InventoryMovementFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryMovement to fetch.
     */
    where: InventoryMovementWhereUniqueInput;
  };

  /**
   * InventoryMovement findFirst
   */
  export type InventoryMovementFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryMovement to fetch.
     */
    where?: InventoryMovementWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryMovements to fetch.
     */
    orderBy?:
      | InventoryMovementOrderByWithRelationInput
      | InventoryMovementOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for InventoryMovements.
     */
    cursor?: InventoryMovementWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryMovements from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryMovements.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of InventoryMovements.
     */
    distinct?:
      | InventoryMovementScalarFieldEnum
      | InventoryMovementScalarFieldEnum[];
  };

  /**
   * InventoryMovement findFirstOrThrow
   */
  export type InventoryMovementFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryMovement to fetch.
     */
    where?: InventoryMovementWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryMovements to fetch.
     */
    orderBy?:
      | InventoryMovementOrderByWithRelationInput
      | InventoryMovementOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for InventoryMovements.
     */
    cursor?: InventoryMovementWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryMovements from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryMovements.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of InventoryMovements.
     */
    distinct?:
      | InventoryMovementScalarFieldEnum
      | InventoryMovementScalarFieldEnum[];
  };

  /**
   * InventoryMovement findMany
   */
  export type InventoryMovementFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryMovements to fetch.
     */
    where?: InventoryMovementWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryMovements to fetch.
     */
    orderBy?:
      | InventoryMovementOrderByWithRelationInput
      | InventoryMovementOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing InventoryMovements.
     */
    cursor?: InventoryMovementWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryMovements from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryMovements.
     */
    skip?: number;
    distinct?:
      | InventoryMovementScalarFieldEnum
      | InventoryMovementScalarFieldEnum[];
  };

  /**
   * InventoryMovement create
   */
  export type InventoryMovementCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * The data needed to create a InventoryMovement.
     */
    data: XOR<
      InventoryMovementCreateInput,
      InventoryMovementUncheckedCreateInput
    >;
  };

  /**
   * InventoryMovement createMany
   */
  export type InventoryMovementCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many InventoryMovements.
     */
    data: InventoryMovementCreateManyInput | InventoryMovementCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * InventoryMovement update
   */
  export type InventoryMovementUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * The data needed to update a InventoryMovement.
     */
    data: XOR<
      InventoryMovementUpdateInput,
      InventoryMovementUncheckedUpdateInput
    >;
    /**
     * Choose, which InventoryMovement to update.
     */
    where: InventoryMovementWhereUniqueInput;
  };

  /**
   * InventoryMovement updateMany
   */
  export type InventoryMovementUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update InventoryMovements.
     */
    data: XOR<
      InventoryMovementUpdateManyMutationInput,
      InventoryMovementUncheckedUpdateManyInput
    >;
    /**
     * Filter which InventoryMovements to update
     */
    where?: InventoryMovementWhereInput;
    /**
     * Limit how many InventoryMovements to update.
     */
    limit?: number;
  };

  /**
   * InventoryMovement upsert
   */
  export type InventoryMovementUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * The filter to search for the InventoryMovement to update in case it exists.
     */
    where: InventoryMovementWhereUniqueInput;
    /**
     * In case the InventoryMovement found by the `where` argument doesn't exist, create a new InventoryMovement with this data.
     */
    create: XOR<
      InventoryMovementCreateInput,
      InventoryMovementUncheckedCreateInput
    >;
    /**
     * In case the InventoryMovement was found with the provided `where` argument, update it with this data.
     */
    update: XOR<
      InventoryMovementUpdateInput,
      InventoryMovementUncheckedUpdateInput
    >;
  };

  /**
   * InventoryMovement delete
   */
  export type InventoryMovementDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
    /**
     * Filter which InventoryMovement to delete.
     */
    where: InventoryMovementWhereUniqueInput;
  };

  /**
   * InventoryMovement deleteMany
   */
  export type InventoryMovementDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which InventoryMovements to delete
     */
    where?: InventoryMovementWhereInput;
    /**
     * Limit how many InventoryMovements to delete.
     */
    limit?: number;
  };

  /**
   * InventoryMovement without action
   */
  export type InventoryMovementDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryMovement
     */
    select?: InventoryMovementSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryMovement
     */
    omit?: InventoryMovementOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryMovementInclude<ExtArgs> | null;
  };

  /**
   * Model InventoryLot
   */

  export type AggregateInventoryLot = {
    _count: InventoryLotCountAggregateOutputType | null;
    _avg: InventoryLotAvgAggregateOutputType | null;
    _sum: InventoryLotSumAggregateOutputType | null;
    _min: InventoryLotMinAggregateOutputType | null;
    _max: InventoryLotMaxAggregateOutputType | null;
  };

  export type InventoryLotAvgAggregateOutputType = {
    quantidadeLote: Decimal | null;
  };

  export type InventoryLotSumAggregateOutputType = {
    quantidadeLote: Decimal | null;
  };

  export type InventoryLotMinAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    numeroLote: string | null;
    dataFabricacao: Date | null;
    dataValidade: Date | null;
    quantidadeLote: Decimal | null;
    status: $Enums.InventoryLotStatus | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type InventoryLotMaxAggregateOutputType = {
    id: string | null;
    estoqueId: string | null;
    numeroLote: string | null;
    dataFabricacao: Date | null;
    dataValidade: Date | null;
    quantidadeLote: Decimal | null;
    status: $Enums.InventoryLotStatus | null;
    lojaId: string | null;
    createdAt: Date | null;
    updatedAt: Date | null;
  };

  export type InventoryLotCountAggregateOutputType = {
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

  export type InventoryLotAvgAggregateInputType = {
    quantidadeLote?: true;
  };

  export type InventoryLotSumAggregateInputType = {
    quantidadeLote?: true;
  };

  export type InventoryLotMinAggregateInputType = {
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

  export type InventoryLotMaxAggregateInputType = {
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

  export type InventoryLotCountAggregateInputType = {
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

  export type InventoryLotAggregateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which InventoryLot to aggregate.
     */
    where?: InventoryLotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryLots to fetch.
     */
    orderBy?:
      | InventoryLotOrderByWithRelationInput
      | InventoryLotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the start position
     */
    cursor?: InventoryLotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryLots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryLots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Count returned InventoryLots
     **/
    _count?: true | InventoryLotCountAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to average
     **/
    _avg?: InventoryLotAvgAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to sum
     **/
    _sum?: InventoryLotSumAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the minimum value
     **/
    _min?: InventoryLotMinAggregateInputType;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     *
     * Select which fields to find the maximum value
     **/
    _max?: InventoryLotMaxAggregateInputType;
  };

  export type GetInventoryLotAggregateType<
    T extends InventoryLotAggregateArgs,
  > = {
    [P in keyof T & keyof AggregateInventoryLot]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateInventoryLot[P]>
      : GetScalarType<T[P], AggregateInventoryLot[P]>;
  };

  export type InventoryLotGroupByArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    where?: InventoryLotWhereInput;
    orderBy?:
      | InventoryLotOrderByWithAggregationInput
      | InventoryLotOrderByWithAggregationInput[];
    by: InventoryLotScalarFieldEnum[] | InventoryLotScalarFieldEnum;
    having?: InventoryLotScalarWhereWithAggregatesInput;
    take?: number;
    skip?: number;
    _count?: InventoryLotCountAggregateInputType | true;
    _avg?: InventoryLotAvgAggregateInputType;
    _sum?: InventoryLotSumAggregateInputType;
    _min?: InventoryLotMinAggregateInputType;
    _max?: InventoryLotMaxAggregateInputType;
  };

  export type InventoryLotGroupByOutputType = {
    id: string;
    estoqueId: string;
    numeroLote: string;
    dataFabricacao: Date | null;
    dataValidade: Date | null;
    quantidadeLote: Decimal;
    status: $Enums.InventoryLotStatus;
    lojaId: string;
    createdAt: Date;
    updatedAt: Date;
    _count: InventoryLotCountAggregateOutputType | null;
    _avg: InventoryLotAvgAggregateOutputType | null;
    _sum: InventoryLotSumAggregateOutputType | null;
    _min: InventoryLotMinAggregateOutputType | null;
    _max: InventoryLotMaxAggregateOutputType | null;
  };

  type GetInventoryLotGroupByPayload<T extends InventoryLotGroupByArgs> =
    Prisma.PrismaPromise<
      Array<
        PickEnumerable<InventoryLotGroupByOutputType, T['by']> & {
          [P in keyof T &
            keyof InventoryLotGroupByOutputType]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], InventoryLotGroupByOutputType[P]>
            : GetScalarType<T[P], InventoryLotGroupByOutputType[P]>;
        }
      >
    >;

  export type InventoryLotSelect<
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
      estoque?: boolean | InventoryStockDefaultArgs<ExtArgs>;
    },
    ExtArgs['result']['inventoryLot']
  >;

  export type InventoryLotSelectScalar = {
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

  export type InventoryLotOmit<
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
    ExtArgs['result']['inventoryLot']
  >;
  export type InventoryLotInclude<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    estoque?: boolean | InventoryStockDefaultArgs<ExtArgs>;
  };

  export type $InventoryLotPayload<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    name: 'InventoryLot';
    objects: {
      estoque: Prisma.$InventoryStockPayload<ExtArgs>;
    };
    scalars: $Extensions.GetPayloadResult<
      {
        id: string;
        estoqueId: string;
        numeroLote: string;
        dataFabricacao: Date | null;
        dataValidade: Date | null;
        quantidadeLote: Prisma.Decimal;
        status: $Enums.InventoryLotStatus;
        lojaId: string;
        createdAt: Date;
        updatedAt: Date;
      },
      ExtArgs['result']['inventoryLot']
    >;
    composites: {};
  };

  type InventoryLotGetPayload<
    S extends boolean | null | undefined | InventoryLotDefaultArgs,
  > = $Result.GetResult<Prisma.$InventoryLotPayload, S>;

  type InventoryLotCountArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = Omit<
    InventoryLotFindManyArgs,
    'select' | 'include' | 'distinct' | 'omit'
  > & {
    select?: InventoryLotCountAggregateInputType | true;
  };

  export interface InventoryLotDelegate<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > {
    [K: symbol]: {
      types: Prisma.TypeMap<ExtArgs>['model']['InventoryLot'];
      meta: { name: 'InventoryLot' };
    };
    /**
     * Find zero or one InventoryLot that matches the filter.
     * @param {InventoryLotFindUniqueArgs} args - Arguments to find a InventoryLot
     * @example
     * // Get one InventoryLot
     * const inventoryLot = await prisma.inventoryLot.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends InventoryLotFindUniqueArgs>(
      args: SelectSubset<T, InventoryLotFindUniqueArgs<ExtArgs>>,
    ): Prisma__InventoryLotClient<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'findUnique',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find one InventoryLot that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {InventoryLotFindUniqueOrThrowArgs} args - Arguments to find a InventoryLot
     * @example
     * // Get one InventoryLot
     * const inventoryLot = await prisma.inventoryLot.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends InventoryLotFindUniqueOrThrowArgs>(
      args: SelectSubset<T, InventoryLotFindUniqueOrThrowArgs<ExtArgs>>,
    ): Prisma__InventoryLotClient<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'findUniqueOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first InventoryLot that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLotFindFirstArgs} args - Arguments to find a InventoryLot
     * @example
     * // Get one InventoryLot
     * const inventoryLot = await prisma.inventoryLot.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends InventoryLotFindFirstArgs>(
      args?: SelectSubset<T, InventoryLotFindFirstArgs<ExtArgs>>,
    ): Prisma__InventoryLotClient<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'findFirst',
        GlobalOmitOptions
      > | null,
      null,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find the first InventoryLot that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLotFindFirstOrThrowArgs} args - Arguments to find a InventoryLot
     * @example
     * // Get one InventoryLot
     * const inventoryLot = await prisma.inventoryLot.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends InventoryLotFindFirstOrThrowArgs>(
      args?: SelectSubset<T, InventoryLotFindFirstOrThrowArgs<ExtArgs>>,
    ): Prisma__InventoryLotClient<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'findFirstOrThrow',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Find zero or more InventoryLots that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLotFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all InventoryLots
     * const inventoryLots = await prisma.inventoryLot.findMany()
     *
     * // Get first 10 InventoryLots
     * const inventoryLots = await prisma.inventoryLot.findMany({ take: 10 })
     *
     * // Only select the `id`
     * const inventoryLotWithIdOnly = await prisma.inventoryLot.findMany({ select: { id: true } })
     *
     */
    findMany<T extends InventoryLotFindManyArgs>(
      args?: SelectSubset<T, InventoryLotFindManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'findMany',
        GlobalOmitOptions
      >
    >;

    /**
     * Create a InventoryLot.
     * @param {InventoryLotCreateArgs} args - Arguments to create a InventoryLot.
     * @example
     * // Create one InventoryLot
     * const InventoryLot = await prisma.inventoryLot.create({
     *   data: {
     *     // ... data to create a InventoryLot
     *   }
     * })
     *
     */
    create<T extends InventoryLotCreateArgs>(
      args: SelectSubset<T, InventoryLotCreateArgs<ExtArgs>>,
    ): Prisma__InventoryLotClient<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'create',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Create many InventoryLots.
     * @param {InventoryLotCreateManyArgs} args - Arguments to create many InventoryLots.
     * @example
     * // Create many InventoryLots
     * const inventoryLot = await prisma.inventoryLot.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *
     */
    createMany<T extends InventoryLotCreateManyArgs>(
      args?: SelectSubset<T, InventoryLotCreateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Delete a InventoryLot.
     * @param {InventoryLotDeleteArgs} args - Arguments to delete one InventoryLot.
     * @example
     * // Delete one InventoryLot
     * const InventoryLot = await prisma.inventoryLot.delete({
     *   where: {
     *     // ... filter to delete one InventoryLot
     *   }
     * })
     *
     */
    delete<T extends InventoryLotDeleteArgs>(
      args: SelectSubset<T, InventoryLotDeleteArgs<ExtArgs>>,
    ): Prisma__InventoryLotClient<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'delete',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Update one InventoryLot.
     * @param {InventoryLotUpdateArgs} args - Arguments to update one InventoryLot.
     * @example
     * // Update one InventoryLot
     * const inventoryLot = await prisma.inventoryLot.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    update<T extends InventoryLotUpdateArgs>(
      args: SelectSubset<T, InventoryLotUpdateArgs<ExtArgs>>,
    ): Prisma__InventoryLotClient<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'update',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Delete zero or more InventoryLots.
     * @param {InventoryLotDeleteManyArgs} args - Arguments to filter InventoryLots to delete.
     * @example
     * // Delete a few InventoryLots
     * const { count } = await prisma.inventoryLot.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     *
     */
    deleteMany<T extends InventoryLotDeleteManyArgs>(
      args?: SelectSubset<T, InventoryLotDeleteManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Update zero or more InventoryLots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLotUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many InventoryLots
     * const inventoryLot = await prisma.inventoryLot.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     *
     */
    updateMany<T extends InventoryLotUpdateManyArgs>(
      args: SelectSubset<T, InventoryLotUpdateManyArgs<ExtArgs>>,
    ): Prisma.PrismaPromise<BatchPayload>;

    /**
     * Create or update one InventoryLot.
     * @param {InventoryLotUpsertArgs} args - Arguments to update or create a InventoryLot.
     * @example
     * // Update or create a InventoryLot
     * const inventoryLot = await prisma.inventoryLot.upsert({
     *   create: {
     *     // ... data to create a InventoryLot
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the InventoryLot we want to update
     *   }
     * })
     */
    upsert<T extends InventoryLotUpsertArgs>(
      args: SelectSubset<T, InventoryLotUpsertArgs<ExtArgs>>,
    ): Prisma__InventoryLotClient<
      $Result.GetResult<
        Prisma.$InventoryLotPayload<ExtArgs>,
        T,
        'upsert',
        GlobalOmitOptions
      >,
      never,
      ExtArgs,
      GlobalOmitOptions
    >;

    /**
     * Count the number of InventoryLots.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLotCountArgs} args - Arguments to filter InventoryLots to count.
     * @example
     * // Count the number of InventoryLots
     * const count = await prisma.inventoryLot.count({
     *   where: {
     *     // ... the filter for the InventoryLots we want to count
     *   }
     * })
     **/
    count<T extends InventoryLotCountArgs>(
      args?: Subset<T, InventoryLotCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], InventoryLotCountAggregateOutputType>
        : number
    >;

    /**
     * Allows you to perform aggregations operations on a InventoryLot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLotAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
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
    aggregate<T extends InventoryLotAggregateArgs>(
      args: Subset<T, InventoryLotAggregateArgs>,
    ): Prisma.PrismaPromise<GetInventoryLotAggregateType<T>>;

    /**
     * Group by InventoryLot.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {InventoryLotGroupByArgs} args - Group by arguments.
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
      T extends InventoryLotGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: InventoryLotGroupByArgs['orderBy'] }
        : { orderBy?: InventoryLotGroupByArgs['orderBy'] },
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
      args: SubsetIntersection<T, InventoryLotGroupByArgs, OrderByArg> &
        InputErrors,
    ): {} extends InputErrors
      ? GetInventoryLotGroupByPayload<T>
      : Prisma.PrismaPromise<InputErrors>;
    /**
     * Fields of the InventoryLot model
     */
    readonly fields: InventoryLotFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for InventoryLot.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__InventoryLotClient<
    T,
    Null = never,
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
    GlobalOmitOptions = {},
  > extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: 'PrismaPromise';
    estoque<T extends InventoryStockDefaultArgs<ExtArgs> = {}>(
      args?: Subset<T, InventoryStockDefaultArgs<ExtArgs>>,
    ): Prisma__InventoryStockClient<
      | $Result.GetResult<
          Prisma.$InventoryStockPayload<ExtArgs>,
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
   * Fields of the InventoryLot model
   */
  interface InventoryLotFieldRefs {
    readonly id: FieldRef<'InventoryLot', 'String'>;
    readonly estoqueId: FieldRef<'InventoryLot', 'String'>;
    readonly numeroLote: FieldRef<'InventoryLot', 'String'>;
    readonly dataFabricacao: FieldRef<'InventoryLot', 'DateTime'>;
    readonly dataValidade: FieldRef<'InventoryLot', 'DateTime'>;
    readonly quantidadeLote: FieldRef<'InventoryLot', 'Decimal'>;
    readonly status: FieldRef<'InventoryLot', 'InventoryLotStatus'>;
    readonly lojaId: FieldRef<'InventoryLot', 'String'>;
    readonly createdAt: FieldRef<'InventoryLot', 'DateTime'>;
    readonly updatedAt: FieldRef<'InventoryLot', 'DateTime'>;
  }

  // Custom InputTypes
  /**
   * InventoryLot findUnique
   */
  export type InventoryLotFindUniqueArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLot to fetch.
     */
    where: InventoryLotWhereUniqueInput;
  };

  /**
   * InventoryLot findUniqueOrThrow
   */
  export type InventoryLotFindUniqueOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLot to fetch.
     */
    where: InventoryLotWhereUniqueInput;
  };

  /**
   * InventoryLot findFirst
   */
  export type InventoryLotFindFirstArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLot to fetch.
     */
    where?: InventoryLotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryLots to fetch.
     */
    orderBy?:
      | InventoryLotOrderByWithRelationInput
      | InventoryLotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for InventoryLots.
     */
    cursor?: InventoryLotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryLots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryLots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of InventoryLots.
     */
    distinct?: InventoryLotScalarFieldEnum | InventoryLotScalarFieldEnum[];
  };

  /**
   * InventoryLot findFirstOrThrow
   */
  export type InventoryLotFindFirstOrThrowArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLot to fetch.
     */
    where?: InventoryLotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryLots to fetch.
     */
    orderBy?:
      | InventoryLotOrderByWithRelationInput
      | InventoryLotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for searching for InventoryLots.
     */
    cursor?: InventoryLotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryLots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryLots.
     */
    skip?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     *
     * Filter by unique combinations of InventoryLots.
     */
    distinct?: InventoryLotScalarFieldEnum | InventoryLotScalarFieldEnum[];
  };

  /**
   * InventoryLot findMany
   */
  export type InventoryLotFindManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * Filter, which InventoryLots to fetch.
     */
    where?: InventoryLotWhereInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     *
     * Determine the order of InventoryLots to fetch.
     */
    orderBy?:
      | InventoryLotOrderByWithRelationInput
      | InventoryLotOrderByWithRelationInput[];
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     *
     * Sets the position for listing InventoryLots.
     */
    cursor?: InventoryLotWhereUniqueInput;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Take `±n` InventoryLots from the position of the cursor.
     */
    take?: number;
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     *
     * Skip the first `n` InventoryLots.
     */
    skip?: number;
    distinct?: InventoryLotScalarFieldEnum | InventoryLotScalarFieldEnum[];
  };

  /**
   * InventoryLot create
   */
  export type InventoryLotCreateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * The data needed to create a InventoryLot.
     */
    data: XOR<InventoryLotCreateInput, InventoryLotUncheckedCreateInput>;
  };

  /**
   * InventoryLot createMany
   */
  export type InventoryLotCreateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to create many InventoryLots.
     */
    data: InventoryLotCreateManyInput | InventoryLotCreateManyInput[];
    skipDuplicates?: boolean;
  };

  /**
   * InventoryLot update
   */
  export type InventoryLotUpdateArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * The data needed to update a InventoryLot.
     */
    data: XOR<InventoryLotUpdateInput, InventoryLotUncheckedUpdateInput>;
    /**
     * Choose, which InventoryLot to update.
     */
    where: InventoryLotWhereUniqueInput;
  };

  /**
   * InventoryLot updateMany
   */
  export type InventoryLotUpdateManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * The data used to update InventoryLots.
     */
    data: XOR<
      InventoryLotUpdateManyMutationInput,
      InventoryLotUncheckedUpdateManyInput
    >;
    /**
     * Filter which InventoryLots to update
     */
    where?: InventoryLotWhereInput;
    /**
     * Limit how many InventoryLots to update.
     */
    limit?: number;
  };

  /**
   * InventoryLot upsert
   */
  export type InventoryLotUpsertArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * The filter to search for the InventoryLot to update in case it exists.
     */
    where: InventoryLotWhereUniqueInput;
    /**
     * In case the InventoryLot found by the `where` argument doesn't exist, create a new InventoryLot with this data.
     */
    create: XOR<InventoryLotCreateInput, InventoryLotUncheckedCreateInput>;
    /**
     * In case the InventoryLot was found with the provided `where` argument, update it with this data.
     */
    update: XOR<InventoryLotUpdateInput, InventoryLotUncheckedUpdateInput>;
  };

  /**
   * InventoryLot delete
   */
  export type InventoryLotDeleteArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
    /**
     * Filter which InventoryLot to delete.
     */
    where: InventoryLotWhereUniqueInput;
  };

  /**
   * InventoryLot deleteMany
   */
  export type InventoryLotDeleteManyArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Filter which InventoryLots to delete
     */
    where?: InventoryLotWhereInput;
    /**
     * Limit how many InventoryLots to delete.
     */
    limit?: number;
  };

  /**
   * InventoryLot without action
   */
  export type InventoryLotDefaultArgs<
    ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs,
  > = {
    /**
     * Select specific fields to fetch from the InventoryLot
     */
    select?: InventoryLotSelect<ExtArgs> | null;
    /**
     * Omit specific fields from the InventoryLot
     */
    omit?: InventoryLotOmit<ExtArgs> | null;
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: InventoryLotInclude<ExtArgs> | null;
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

  export const InventoryLocationScalarFieldEnum: {
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

  export type InventoryLocationScalarFieldEnum =
    (typeof InventoryLocationScalarFieldEnum)[keyof typeof InventoryLocationScalarFieldEnum];

  export const InventoryStockScalarFieldEnum: {
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

  export type InventoryStockScalarFieldEnum =
    (typeof InventoryStockScalarFieldEnum)[keyof typeof InventoryStockScalarFieldEnum];

  export const InventoryMovementScalarFieldEnum: {
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

  export type InventoryMovementScalarFieldEnum =
    (typeof InventoryMovementScalarFieldEnum)[keyof typeof InventoryMovementScalarFieldEnum];

  export const InventoryLotScalarFieldEnum: {
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

  export type InventoryLotScalarFieldEnum =
    (typeof InventoryLotScalarFieldEnum)[keyof typeof InventoryLotScalarFieldEnum];

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

  export const InventoryLocationOrderByRelevanceFieldEnum: {
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

  export type InventoryLocationOrderByRelevanceFieldEnum =
    (typeof InventoryLocationOrderByRelevanceFieldEnum)[keyof typeof InventoryLocationOrderByRelevanceFieldEnum];

  export const InventoryStockOrderByRelevanceFieldEnum: {
    id: 'id';
    insumoId: 'insumoId';
    localizacaoId: 'localizacaoId';
    lojaId: 'lojaId';
  };

  export type InventoryStockOrderByRelevanceFieldEnum =
    (typeof InventoryStockOrderByRelevanceFieldEnum)[keyof typeof InventoryStockOrderByRelevanceFieldEnum];

  export const InventoryMovementOrderByRelevanceFieldEnum: {
    id: 'id';
    estoqueId: 'estoqueId';
    documentoRef: 'documentoRef';
    orcamentoId: 'orcamentoId';
    usuarioId: 'usuarioId';
    lojaId: 'lojaId';
    observacoes: 'observacoes';
  };

  export type InventoryMovementOrderByRelevanceFieldEnum =
    (typeof InventoryMovementOrderByRelevanceFieldEnum)[keyof typeof InventoryMovementOrderByRelevanceFieldEnum];

  export const InventoryLotOrderByRelevanceFieldEnum: {
    id: 'id';
    estoqueId: 'estoqueId';
    numeroLote: 'numeroLote';
    lojaId: 'lojaId';
  };

  export type InventoryLotOrderByRelevanceFieldEnum =
    (typeof InventoryLotOrderByRelevanceFieldEnum)[keyof typeof InventoryLotOrderByRelevanceFieldEnum];

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
   * Reference to a field of type 'InventoryMovementType'
   */
  export type EnumInventoryMovementTypeFieldRefInput<$PrismaModel> =
    FieldRefInputType<$PrismaModel, 'InventoryMovementType'>;

  /**
   * Reference to a field of type 'InventoryLotStatus'
   */
  export type EnumInventoryLotStatusFieldRefInput<$PrismaModel> =
    FieldRefInputType<$PrismaModel, 'InventoryLotStatus'>;

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

  export type InventoryLocationWhereInput = {
    AND?: InventoryLocationWhereInput | InventoryLocationWhereInput[];
    OR?: InventoryLocationWhereInput[];
    NOT?: InventoryLocationWhereInput | InventoryLocationWhereInput[];
    id?: StringFilter<'InventoryLocation'> | string;
    codigo?: StringFilter<'InventoryLocation'> | string;
    deposito?: StringFilter<'InventoryLocation'> | string;
    corredor?: StringNullableFilter<'InventoryLocation'> | string | null;
    prateleira?: StringNullableFilter<'InventoryLocation'> | string | null;
    nivel?: StringNullableFilter<'InventoryLocation'> | string | null;
    posicao?: StringNullableFilter<'InventoryLocation'> | string | null;
    descricao?: StringNullableFilter<'InventoryLocation'> | string | null;
    capacidade?:
      | DecimalNullableFilter<'InventoryLocation'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolFilter<'InventoryLocation'> | boolean;
    lojaId?: StringFilter<'InventoryLocation'> | string;
    createdAt?: DateTimeFilter<'InventoryLocation'> | Date | string;
    updatedAt?: DateTimeFilter<'InventoryLocation'> | Date | string;
    estoques?: InventoryStockListRelationFilter;
  };

  export type InventoryLocationOrderByWithRelationInput = {
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
    estoques?: InventoryStockOrderByRelationAggregateInput;
    _relevance?: InventoryLocationOrderByRelevanceInput;
  };

  export type InventoryLocationWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      codigo?: string;
      AND?: InventoryLocationWhereInput | InventoryLocationWhereInput[];
      OR?: InventoryLocationWhereInput[];
      NOT?: InventoryLocationWhereInput | InventoryLocationWhereInput[];
      deposito?: StringFilter<'InventoryLocation'> | string;
      corredor?: StringNullableFilter<'InventoryLocation'> | string | null;
      prateleira?: StringNullableFilter<'InventoryLocation'> | string | null;
      nivel?: StringNullableFilter<'InventoryLocation'> | string | null;
      posicao?: StringNullableFilter<'InventoryLocation'> | string | null;
      descricao?: StringNullableFilter<'InventoryLocation'> | string | null;
      capacidade?:
        | DecimalNullableFilter<'InventoryLocation'>
        | Decimal
        | DecimalJsLike
        | number
        | string
        | null;
      ativo?: BoolFilter<'InventoryLocation'> | boolean;
      lojaId?: StringFilter<'InventoryLocation'> | string;
      createdAt?: DateTimeFilter<'InventoryLocation'> | Date | string;
      updatedAt?: DateTimeFilter<'InventoryLocation'> | Date | string;
      estoques?: InventoryStockListRelationFilter;
    },
    'id' | 'codigo'
  >;

  export type InventoryLocationOrderByWithAggregationInput = {
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
    _count?: InventoryLocationCountOrderByAggregateInput;
    _avg?: InventoryLocationAvgOrderByAggregateInput;
    _max?: InventoryLocationMaxOrderByAggregateInput;
    _min?: InventoryLocationMinOrderByAggregateInput;
    _sum?: InventoryLocationSumOrderByAggregateInput;
  };

  export type InventoryLocationScalarWhereWithAggregatesInput = {
    AND?:
      | InventoryLocationScalarWhereWithAggregatesInput
      | InventoryLocationScalarWhereWithAggregatesInput[];
    OR?: InventoryLocationScalarWhereWithAggregatesInput[];
    NOT?:
      | InventoryLocationScalarWhereWithAggregatesInput
      | InventoryLocationScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'InventoryLocation'> | string;
    codigo?: StringWithAggregatesFilter<'InventoryLocation'> | string;
    deposito?: StringWithAggregatesFilter<'InventoryLocation'> | string;
    corredor?:
      | StringNullableWithAggregatesFilter<'InventoryLocation'>
      | string
      | null;
    prateleira?:
      | StringNullableWithAggregatesFilter<'InventoryLocation'>
      | string
      | null;
    nivel?:
      | StringNullableWithAggregatesFilter<'InventoryLocation'>
      | string
      | null;
    posicao?:
      | StringNullableWithAggregatesFilter<'InventoryLocation'>
      | string
      | null;
    descricao?:
      | StringNullableWithAggregatesFilter<'InventoryLocation'>
      | string
      | null;
    capacidade?:
      | DecimalNullableWithAggregatesFilter<'InventoryLocation'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    ativo?: BoolWithAggregatesFilter<'InventoryLocation'> | boolean;
    lojaId?: StringWithAggregatesFilter<'InventoryLocation'> | string;
    createdAt?:
      | DateTimeWithAggregatesFilter<'InventoryLocation'>
      | Date
      | string;
    updatedAt?:
      | DateTimeWithAggregatesFilter<'InventoryLocation'>
      | Date
      | string;
  };

  export type InventoryStockWhereInput = {
    AND?: InventoryStockWhereInput | InventoryStockWhereInput[];
    OR?: InventoryStockWhereInput[];
    NOT?: InventoryStockWhereInput | InventoryStockWhereInput[];
    id?: StringFilter<'InventoryStock'> | string;
    insumoId?: StringFilter<'InventoryStock'> | string;
    localizacaoId?: StringFilter<'InventoryStock'> | string;
    quantidadeAtual?:
      | DecimalFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | DecimalNullableFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFilter<'InventoryStock'> | string;
    createdAt?: DateTimeFilter<'InventoryStock'> | Date | string;
    updatedAt?: DateTimeFilter<'InventoryStock'> | Date | string;
    dataUltimaMov?:
      | DateTimeNullableFilter<'InventoryStock'>
      | Date
      | string
      | null;
    localizacao?: XOR<
      InventoryLocationScalarRelationFilter,
      InventoryLocationWhereInput
    >;
    movimentacoes?: InventoryMovementListRelationFilter;
    lotes?: InventoryLotListRelationFilter;
  };

  export type InventoryStockOrderByWithRelationInput = {
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
    localizacao?: InventoryLocationOrderByWithRelationInput;
    movimentacoes?: InventoryMovementOrderByRelationAggregateInput;
    lotes?: InventoryLotOrderByRelationAggregateInput;
    _relevance?: InventoryStockOrderByRelevanceInput;
  };

  export type InventoryStockWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      insumoId_localizacaoId_lojaId?: InventoryStockInsumoIdLocalizacaoIdLojaIdCompoundUniqueInput;
      AND?: InventoryStockWhereInput | InventoryStockWhereInput[];
      OR?: InventoryStockWhereInput[];
      NOT?: InventoryStockWhereInput | InventoryStockWhereInput[];
      insumoId?: StringFilter<'InventoryStock'> | string;
      localizacaoId?: StringFilter<'InventoryStock'> | string;
      quantidadeAtual?:
        | DecimalFilter<'InventoryStock'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      quantidadeReservada?:
        | DecimalFilter<'InventoryStock'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      estoqueMinimo?:
        | DecimalFilter<'InventoryStock'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      estoqueMaximo?:
        | DecimalNullableFilter<'InventoryStock'>
        | Decimal
        | DecimalJsLike
        | number
        | string
        | null;
      lojaId?: StringFilter<'InventoryStock'> | string;
      createdAt?: DateTimeFilter<'InventoryStock'> | Date | string;
      updatedAt?: DateTimeFilter<'InventoryStock'> | Date | string;
      dataUltimaMov?:
        | DateTimeNullableFilter<'InventoryStock'>
        | Date
        | string
        | null;
      localizacao?: XOR<
        InventoryLocationScalarRelationFilter,
        InventoryLocationWhereInput
      >;
      movimentacoes?: InventoryMovementListRelationFilter;
      lotes?: InventoryLotListRelationFilter;
    },
    'id' | 'insumoId_localizacaoId_lojaId'
  >;

  export type InventoryStockOrderByWithAggregationInput = {
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
    _count?: InventoryStockCountOrderByAggregateInput;
    _avg?: InventoryStockAvgOrderByAggregateInput;
    _max?: InventoryStockMaxOrderByAggregateInput;
    _min?: InventoryStockMinOrderByAggregateInput;
    _sum?: InventoryStockSumOrderByAggregateInput;
  };

  export type InventoryStockScalarWhereWithAggregatesInput = {
    AND?:
      | InventoryStockScalarWhereWithAggregatesInput
      | InventoryStockScalarWhereWithAggregatesInput[];
    OR?: InventoryStockScalarWhereWithAggregatesInput[];
    NOT?:
      | InventoryStockScalarWhereWithAggregatesInput
      | InventoryStockScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'InventoryStock'> | string;
    insumoId?: StringWithAggregatesFilter<'InventoryStock'> | string;
    localizacaoId?: StringWithAggregatesFilter<'InventoryStock'> | string;
    quantidadeAtual?:
      | DecimalWithAggregatesFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalWithAggregatesFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalWithAggregatesFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | DecimalNullableWithAggregatesFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringWithAggregatesFilter<'InventoryStock'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'InventoryStock'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'InventoryStock'> | Date | string;
    dataUltimaMov?:
      | DateTimeNullableWithAggregatesFilter<'InventoryStock'>
      | Date
      | string
      | null;
  };

  export type InventoryMovementWhereInput = {
    AND?: InventoryMovementWhereInput | InventoryMovementWhereInput[];
    OR?: InventoryMovementWhereInput[];
    NOT?: InventoryMovementWhereInput | InventoryMovementWhereInput[];
    id?: StringFilter<'InventoryMovement'> | string;
    estoqueId?: StringFilter<'InventoryMovement'> | string;
    tipo?:
      | EnumInventoryMovementTypeFilter<'InventoryMovement'>
      | $Enums.InventoryMovementType;
    quantidade?:
      | DecimalFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: StringNullableFilter<'InventoryMovement'> | string | null;
    orcamentoId?: StringNullableFilter<'InventoryMovement'> | string | null;
    usuarioId?: StringFilter<'InventoryMovement'> | string;
    lojaId?: StringFilter<'InventoryMovement'> | string;
    dataMovimentacao?: DateTimeFilter<'InventoryMovement'> | Date | string;
    observacoes?: StringNullableFilter<'InventoryMovement'> | string | null;
    estoque?: XOR<InventoryStockScalarRelationFilter, InventoryStockWhereInput>;
  };

  export type InventoryMovementOrderByWithRelationInput = {
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
    estoque?: InventoryStockOrderByWithRelationInput;
    _relevance?: InventoryMovementOrderByRelevanceInput;
  };

  export type InventoryMovementWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: InventoryMovementWhereInput | InventoryMovementWhereInput[];
      OR?: InventoryMovementWhereInput[];
      NOT?: InventoryMovementWhereInput | InventoryMovementWhereInput[];
      estoqueId?: StringFilter<'InventoryMovement'> | string;
      tipo?:
        | EnumInventoryMovementTypeFilter<'InventoryMovement'>
        | $Enums.InventoryMovementType;
      quantidade?:
        | DecimalFilter<'InventoryMovement'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      quantidadeAnterior?:
        | DecimalFilter<'InventoryMovement'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      quantidadePosterior?:
        | DecimalFilter<'InventoryMovement'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      documentoRef?: StringNullableFilter<'InventoryMovement'> | string | null;
      orcamentoId?: StringNullableFilter<'InventoryMovement'> | string | null;
      usuarioId?: StringFilter<'InventoryMovement'> | string;
      lojaId?: StringFilter<'InventoryMovement'> | string;
      dataMovimentacao?: DateTimeFilter<'InventoryMovement'> | Date | string;
      observacoes?: StringNullableFilter<'InventoryMovement'> | string | null;
      estoque?: XOR<
        InventoryStockScalarRelationFilter,
        InventoryStockWhereInput
      >;
    },
    'id'
  >;

  export type InventoryMovementOrderByWithAggregationInput = {
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
    _count?: InventoryMovementCountOrderByAggregateInput;
    _avg?: InventoryMovementAvgOrderByAggregateInput;
    _max?: InventoryMovementMaxOrderByAggregateInput;
    _min?: InventoryMovementMinOrderByAggregateInput;
    _sum?: InventoryMovementSumOrderByAggregateInput;
  };

  export type InventoryMovementScalarWhereWithAggregatesInput = {
    AND?:
      | InventoryMovementScalarWhereWithAggregatesInput
      | InventoryMovementScalarWhereWithAggregatesInput[];
    OR?: InventoryMovementScalarWhereWithAggregatesInput[];
    NOT?:
      | InventoryMovementScalarWhereWithAggregatesInput
      | InventoryMovementScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'InventoryMovement'> | string;
    estoqueId?: StringWithAggregatesFilter<'InventoryMovement'> | string;
    tipo?:
      | EnumInventoryMovementTypeWithAggregatesFilter<'InventoryMovement'>
      | $Enums.InventoryMovementType;
    quantidade?:
      | DecimalWithAggregatesFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalWithAggregatesFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalWithAggregatesFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?:
      | StringNullableWithAggregatesFilter<'InventoryMovement'>
      | string
      | null;
    orcamentoId?:
      | StringNullableWithAggregatesFilter<'InventoryMovement'>
      | string
      | null;
    usuarioId?: StringWithAggregatesFilter<'InventoryMovement'> | string;
    lojaId?: StringWithAggregatesFilter<'InventoryMovement'> | string;
    dataMovimentacao?:
      | DateTimeWithAggregatesFilter<'InventoryMovement'>
      | Date
      | string;
    observacoes?:
      | StringNullableWithAggregatesFilter<'InventoryMovement'>
      | string
      | null;
  };

  export type InventoryLotWhereInput = {
    AND?: InventoryLotWhereInput | InventoryLotWhereInput[];
    OR?: InventoryLotWhereInput[];
    NOT?: InventoryLotWhereInput | InventoryLotWhereInput[];
    id?: StringFilter<'InventoryLot'> | string;
    estoqueId?: StringFilter<'InventoryLot'> | string;
    numeroLote?: StringFilter<'InventoryLot'> | string;
    dataFabricacao?:
      | DateTimeNullableFilter<'InventoryLot'>
      | Date
      | string
      | null;
    dataValidade?:
      | DateTimeNullableFilter<'InventoryLot'>
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFilter<'InventoryLot'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?:
      | EnumInventoryLotStatusFilter<'InventoryLot'>
      | $Enums.InventoryLotStatus;
    lojaId?: StringFilter<'InventoryLot'> | string;
    createdAt?: DateTimeFilter<'InventoryLot'> | Date | string;
    updatedAt?: DateTimeFilter<'InventoryLot'> | Date | string;
    estoque?: XOR<InventoryStockScalarRelationFilter, InventoryStockWhereInput>;
  };

  export type InventoryLotOrderByWithRelationInput = {
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
    estoque?: InventoryStockOrderByWithRelationInput;
    _relevance?: InventoryLotOrderByRelevanceInput;
  };

  export type InventoryLotWhereUniqueInput = Prisma.AtLeast<
    {
      id?: string;
      AND?: InventoryLotWhereInput | InventoryLotWhereInput[];
      OR?: InventoryLotWhereInput[];
      NOT?: InventoryLotWhereInput | InventoryLotWhereInput[];
      estoqueId?: StringFilter<'InventoryLot'> | string;
      numeroLote?: StringFilter<'InventoryLot'> | string;
      dataFabricacao?:
        | DateTimeNullableFilter<'InventoryLot'>
        | Date
        | string
        | null;
      dataValidade?:
        | DateTimeNullableFilter<'InventoryLot'>
        | Date
        | string
        | null;
      quantidadeLote?:
        | DecimalFilter<'InventoryLot'>
        | Decimal
        | DecimalJsLike
        | number
        | string;
      status?:
        | EnumInventoryLotStatusFilter<'InventoryLot'>
        | $Enums.InventoryLotStatus;
      lojaId?: StringFilter<'InventoryLot'> | string;
      createdAt?: DateTimeFilter<'InventoryLot'> | Date | string;
      updatedAt?: DateTimeFilter<'InventoryLot'> | Date | string;
      estoque?: XOR<
        InventoryStockScalarRelationFilter,
        InventoryStockWhereInput
      >;
    },
    'id'
  >;

  export type InventoryLotOrderByWithAggregationInput = {
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
    _count?: InventoryLotCountOrderByAggregateInput;
    _avg?: InventoryLotAvgOrderByAggregateInput;
    _max?: InventoryLotMaxOrderByAggregateInput;
    _min?: InventoryLotMinOrderByAggregateInput;
    _sum?: InventoryLotSumOrderByAggregateInput;
  };

  export type InventoryLotScalarWhereWithAggregatesInput = {
    AND?:
      | InventoryLotScalarWhereWithAggregatesInput
      | InventoryLotScalarWhereWithAggregatesInput[];
    OR?: InventoryLotScalarWhereWithAggregatesInput[];
    NOT?:
      | InventoryLotScalarWhereWithAggregatesInput
      | InventoryLotScalarWhereWithAggregatesInput[];
    id?: StringWithAggregatesFilter<'InventoryLot'> | string;
    estoqueId?: StringWithAggregatesFilter<'InventoryLot'> | string;
    numeroLote?: StringWithAggregatesFilter<'InventoryLot'> | string;
    dataFabricacao?:
      | DateTimeNullableWithAggregatesFilter<'InventoryLot'>
      | Date
      | string
      | null;
    dataValidade?:
      | DateTimeNullableWithAggregatesFilter<'InventoryLot'>
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalWithAggregatesFilter<'InventoryLot'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?:
      | EnumInventoryLotStatusWithAggregatesFilter<'InventoryLot'>
      | $Enums.InventoryLotStatus;
    lojaId?: StringWithAggregatesFilter<'InventoryLot'> | string;
    createdAt?: DateTimeWithAggregatesFilter<'InventoryLot'> | Date | string;
    updatedAt?: DateTimeWithAggregatesFilter<'InventoryLot'> | Date | string;
  };

  export type InventoryLocationCreateInput = {
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
    estoques?: InventoryStockCreateNestedManyWithoutLocalizacaoInput;
  };

  export type InventoryLocationUncheckedCreateInput = {
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
    estoques?: InventoryStockUncheckedCreateNestedManyWithoutLocalizacaoInput;
  };

  export type InventoryLocationUpdateInput = {
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
    estoques?: InventoryStockUpdateManyWithoutLocalizacaoNestedInput;
  };

  export type InventoryLocationUncheckedUpdateInput = {
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
    estoques?: InventoryStockUncheckedUpdateManyWithoutLocalizacaoNestedInput;
  };

  export type InventoryLocationCreateManyInput = {
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

  export type InventoryLocationUpdateManyMutationInput = {
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

  export type InventoryLocationUncheckedUpdateManyInput = {
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

  export type InventoryStockCreateInput = {
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
    localizacao: InventoryLocationCreateNestedOneWithoutEstoquesInput;
    movimentacoes?: InventoryMovementCreateNestedManyWithoutEstoqueInput;
    lotes?: InventoryLotCreateNestedManyWithoutEstoqueInput;
  };

  export type InventoryStockUncheckedCreateInput = {
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
    movimentacoes?: InventoryMovementUncheckedCreateNestedManyWithoutEstoqueInput;
    lotes?: InventoryLotUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type InventoryStockUpdateInput = {
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
    localizacao?: InventoryLocationUpdateOneRequiredWithoutEstoquesNestedInput;
    movimentacoes?: InventoryMovementUpdateManyWithoutEstoqueNestedInput;
    lotes?: InventoryLotUpdateManyWithoutEstoqueNestedInput;
  };

  export type InventoryStockUncheckedUpdateInput = {
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
    movimentacoes?: InventoryMovementUncheckedUpdateManyWithoutEstoqueNestedInput;
    lotes?: InventoryLotUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type InventoryStockCreateManyInput = {
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

  export type InventoryStockUpdateManyMutationInput = {
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

  export type InventoryStockUncheckedUpdateManyInput = {
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

  export type InventoryMovementCreateInput = {
    id?: string;
    tipo: $Enums.InventoryMovementType;
    quantidade: Decimal | DecimalJsLike | number | string;
    quantidadeAnterior: Decimal | DecimalJsLike | number | string;
    quantidadePosterior: Decimal | DecimalJsLike | number | string;
    documentoRef?: string | null;
    orcamentoId?: string | null;
    usuarioId: string;
    lojaId: string;
    dataMovimentacao?: Date | string;
    observacoes?: string | null;
    estoque: InventoryStockCreateNestedOneWithoutMovimentacoesInput;
  };

  export type InventoryMovementUncheckedCreateInput = {
    id?: string;
    estoqueId: string;
    tipo: $Enums.InventoryMovementType;
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

  export type InventoryMovementUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumInventoryMovementTypeFieldUpdateOperationsInput
      | $Enums.InventoryMovementType;
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
    estoque?: InventoryStockUpdateOneRequiredWithoutMovimentacoesNestedInput;
  };

  export type InventoryMovementUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumInventoryMovementTypeFieldUpdateOperationsInput
      | $Enums.InventoryMovementType;
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

  export type InventoryMovementCreateManyInput = {
    id?: string;
    estoqueId: string;
    tipo: $Enums.InventoryMovementType;
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

  export type InventoryMovementUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumInventoryMovementTypeFieldUpdateOperationsInput
      | $Enums.InventoryMovementType;
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

  export type InventoryMovementUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string;
    estoqueId?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumInventoryMovementTypeFieldUpdateOperationsInput
      | $Enums.InventoryMovementType;
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

  export type InventoryLotCreateInput = {
    id?: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.InventoryLotStatus;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
    estoque: InventoryStockCreateNestedOneWithoutLotesInput;
  };

  export type InventoryLotUncheckedCreateInput = {
    id?: string;
    estoqueId: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.InventoryLotStatus;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type InventoryLotUpdateInput = {
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
    status?:
      | EnumInventoryLotStatusFieldUpdateOperationsInput
      | $Enums.InventoryLotStatus;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    estoque?: InventoryStockUpdateOneRequiredWithoutLotesNestedInput;
  };

  export type InventoryLotUncheckedUpdateInput = {
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
    status?:
      | EnumInventoryLotStatusFieldUpdateOperationsInput
      | $Enums.InventoryLotStatus;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type InventoryLotCreateManyInput = {
    id?: string;
    estoqueId: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.InventoryLotStatus;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type InventoryLotUpdateManyMutationInput = {
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
    status?:
      | EnumInventoryLotStatusFieldUpdateOperationsInput
      | $Enums.InventoryLotStatus;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type InventoryLotUncheckedUpdateManyInput = {
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
    status?:
      | EnumInventoryLotStatusFieldUpdateOperationsInput
      | $Enums.InventoryLotStatus;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
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

  export type InventoryStockListRelationFilter = {
    every?: InventoryStockWhereInput;
    some?: InventoryStockWhereInput;
    none?: InventoryStockWhereInput;
  };

  export type SortOrderInput = {
    sort: SortOrder;
    nulls?: NullsOrder;
  };

  export type InventoryStockOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type InventoryLocationOrderByRelevanceInput = {
    fields:
      | InventoryLocationOrderByRelevanceFieldEnum
      | InventoryLocationOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type InventoryLocationCountOrderByAggregateInput = {
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

  export type InventoryLocationAvgOrderByAggregateInput = {
    capacidade?: SortOrder;
  };

  export type InventoryLocationMaxOrderByAggregateInput = {
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

  export type InventoryLocationMinOrderByAggregateInput = {
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

  export type InventoryLocationSumOrderByAggregateInput = {
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

  export type InventoryLocationScalarRelationFilter = {
    is?: InventoryLocationWhereInput;
    isNot?: InventoryLocationWhereInput;
  };

  export type InventoryMovementListRelationFilter = {
    every?: InventoryMovementWhereInput;
    some?: InventoryMovementWhereInput;
    none?: InventoryMovementWhereInput;
  };

  export type InventoryLotListRelationFilter = {
    every?: InventoryLotWhereInput;
    some?: InventoryLotWhereInput;
    none?: InventoryLotWhereInput;
  };

  export type InventoryMovementOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type InventoryLotOrderByRelationAggregateInput = {
    _count?: SortOrder;
  };

  export type InventoryStockOrderByRelevanceInput = {
    fields:
      | InventoryStockOrderByRelevanceFieldEnum
      | InventoryStockOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type InventoryStockInsumoIdLocalizacaoIdLojaIdCompoundUniqueInput = {
    insumoId: string;
    localizacaoId: string;
    lojaId: string;
  };

  export type InventoryStockCountOrderByAggregateInput = {
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

  export type InventoryStockAvgOrderByAggregateInput = {
    quantidadeAtual?: SortOrder;
    quantidadeReservada?: SortOrder;
    estoqueMinimo?: SortOrder;
    estoqueMaximo?: SortOrder;
  };

  export type InventoryStockMaxOrderByAggregateInput = {
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

  export type InventoryStockMinOrderByAggregateInput = {
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

  export type InventoryStockSumOrderByAggregateInput = {
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

  export type EnumInventoryMovementTypeFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.InventoryMovementType
      | EnumInventoryMovementTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.InventoryMovementType[];
    notIn?: $Enums.InventoryMovementType[];
    not?:
      | NestedEnumInventoryMovementTypeFilter<$PrismaModel>
      | $Enums.InventoryMovementType;
  };

  export type InventoryStockScalarRelationFilter = {
    is?: InventoryStockWhereInput;
    isNot?: InventoryStockWhereInput;
  };

  export type InventoryMovementOrderByRelevanceInput = {
    fields:
      | InventoryMovementOrderByRelevanceFieldEnum
      | InventoryMovementOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type InventoryMovementCountOrderByAggregateInput = {
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

  export type InventoryMovementAvgOrderByAggregateInput = {
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
  };

  export type InventoryMovementMaxOrderByAggregateInput = {
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

  export type InventoryMovementMinOrderByAggregateInput = {
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

  export type InventoryMovementSumOrderByAggregateInput = {
    quantidade?: SortOrder;
    quantidadeAnterior?: SortOrder;
    quantidadePosterior?: SortOrder;
  };

  export type EnumInventoryMovementTypeWithAggregatesFilter<
    $PrismaModel = never,
  > = {
    equals?:
      | $Enums.InventoryMovementType
      | EnumInventoryMovementTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.InventoryMovementType[];
    notIn?: $Enums.InventoryMovementType[];
    not?:
      | NestedEnumInventoryMovementTypeWithAggregatesFilter<$PrismaModel>
      | $Enums.InventoryMovementType;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedEnumInventoryMovementTypeFilter<$PrismaModel>;
    _max?: NestedEnumInventoryMovementTypeFilter<$PrismaModel>;
  };

  export type EnumInventoryLotStatusFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.InventoryLotStatus
      | EnumInventoryLotStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.InventoryLotStatus[];
    notIn?: $Enums.InventoryLotStatus[];
    not?:
      | NestedEnumInventoryLotStatusFilter<$PrismaModel>
      | $Enums.InventoryLotStatus;
  };

  export type InventoryLotOrderByRelevanceInput = {
    fields:
      | InventoryLotOrderByRelevanceFieldEnum
      | InventoryLotOrderByRelevanceFieldEnum[];
    sort: SortOrder;
    search: string;
  };

  export type InventoryLotCountOrderByAggregateInput = {
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

  export type InventoryLotAvgOrderByAggregateInput = {
    quantidadeLote?: SortOrder;
  };

  export type InventoryLotMaxOrderByAggregateInput = {
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

  export type InventoryLotMinOrderByAggregateInput = {
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

  export type InventoryLotSumOrderByAggregateInput = {
    quantidadeLote?: SortOrder;
  };

  export type EnumInventoryLotStatusWithAggregatesFilter<$PrismaModel = never> =
    {
      equals?:
        | $Enums.InventoryLotStatus
        | EnumInventoryLotStatusFieldRefInput<$PrismaModel>;
      in?: $Enums.InventoryLotStatus[];
      notIn?: $Enums.InventoryLotStatus[];
      not?:
        | NestedEnumInventoryLotStatusWithAggregatesFilter<$PrismaModel>
        | $Enums.InventoryLotStatus;
      _count?: NestedIntFilter<$PrismaModel>;
      _min?: NestedEnumInventoryLotStatusFilter<$PrismaModel>;
      _max?: NestedEnumInventoryLotStatusFilter<$PrismaModel>;
    };

  export type InventoryStockCreateNestedManyWithoutLocalizacaoInput = {
    create?:
      | XOR<
          InventoryStockCreateWithoutLocalizacaoInput,
          InventoryStockUncheckedCreateWithoutLocalizacaoInput
        >
      | InventoryStockCreateWithoutLocalizacaoInput[]
      | InventoryStockUncheckedCreateWithoutLocalizacaoInput[];
    connectOrCreate?:
      | InventoryStockCreateOrConnectWithoutLocalizacaoInput
      | InventoryStockCreateOrConnectWithoutLocalizacaoInput[];
    createMany?: InventoryStockCreateManyLocalizacaoInputEnvelope;
    connect?: InventoryStockWhereUniqueInput | InventoryStockWhereUniqueInput[];
  };

  export type InventoryStockUncheckedCreateNestedManyWithoutLocalizacaoInput = {
    create?:
      | XOR<
          InventoryStockCreateWithoutLocalizacaoInput,
          InventoryStockUncheckedCreateWithoutLocalizacaoInput
        >
      | InventoryStockCreateWithoutLocalizacaoInput[]
      | InventoryStockUncheckedCreateWithoutLocalizacaoInput[];
    connectOrCreate?:
      | InventoryStockCreateOrConnectWithoutLocalizacaoInput
      | InventoryStockCreateOrConnectWithoutLocalizacaoInput[];
    createMany?: InventoryStockCreateManyLocalizacaoInputEnvelope;
    connect?: InventoryStockWhereUniqueInput | InventoryStockWhereUniqueInput[];
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

  export type InventoryStockUpdateManyWithoutLocalizacaoNestedInput = {
    create?:
      | XOR<
          InventoryStockCreateWithoutLocalizacaoInput,
          InventoryStockUncheckedCreateWithoutLocalizacaoInput
        >
      | InventoryStockCreateWithoutLocalizacaoInput[]
      | InventoryStockUncheckedCreateWithoutLocalizacaoInput[];
    connectOrCreate?:
      | InventoryStockCreateOrConnectWithoutLocalizacaoInput
      | InventoryStockCreateOrConnectWithoutLocalizacaoInput[];
    upsert?:
      | InventoryStockUpsertWithWhereUniqueWithoutLocalizacaoInput
      | InventoryStockUpsertWithWhereUniqueWithoutLocalizacaoInput[];
    createMany?: InventoryStockCreateManyLocalizacaoInputEnvelope;
    set?: InventoryStockWhereUniqueInput | InventoryStockWhereUniqueInput[];
    disconnect?:
      | InventoryStockWhereUniqueInput
      | InventoryStockWhereUniqueInput[];
    delete?: InventoryStockWhereUniqueInput | InventoryStockWhereUniqueInput[];
    connect?: InventoryStockWhereUniqueInput | InventoryStockWhereUniqueInput[];
    update?:
      | InventoryStockUpdateWithWhereUniqueWithoutLocalizacaoInput
      | InventoryStockUpdateWithWhereUniqueWithoutLocalizacaoInput[];
    updateMany?:
      | InventoryStockUpdateManyWithWhereWithoutLocalizacaoInput
      | InventoryStockUpdateManyWithWhereWithoutLocalizacaoInput[];
    deleteMany?:
      | InventoryStockScalarWhereInput
      | InventoryStockScalarWhereInput[];
  };

  export type InventoryStockUncheckedUpdateManyWithoutLocalizacaoNestedInput = {
    create?:
      | XOR<
          InventoryStockCreateWithoutLocalizacaoInput,
          InventoryStockUncheckedCreateWithoutLocalizacaoInput
        >
      | InventoryStockCreateWithoutLocalizacaoInput[]
      | InventoryStockUncheckedCreateWithoutLocalizacaoInput[];
    connectOrCreate?:
      | InventoryStockCreateOrConnectWithoutLocalizacaoInput
      | InventoryStockCreateOrConnectWithoutLocalizacaoInput[];
    upsert?:
      | InventoryStockUpsertWithWhereUniqueWithoutLocalizacaoInput
      | InventoryStockUpsertWithWhereUniqueWithoutLocalizacaoInput[];
    createMany?: InventoryStockCreateManyLocalizacaoInputEnvelope;
    set?: InventoryStockWhereUniqueInput | InventoryStockWhereUniqueInput[];
    disconnect?:
      | InventoryStockWhereUniqueInput
      | InventoryStockWhereUniqueInput[];
    delete?: InventoryStockWhereUniqueInput | InventoryStockWhereUniqueInput[];
    connect?: InventoryStockWhereUniqueInput | InventoryStockWhereUniqueInput[];
    update?:
      | InventoryStockUpdateWithWhereUniqueWithoutLocalizacaoInput
      | InventoryStockUpdateWithWhereUniqueWithoutLocalizacaoInput[];
    updateMany?:
      | InventoryStockUpdateManyWithWhereWithoutLocalizacaoInput
      | InventoryStockUpdateManyWithWhereWithoutLocalizacaoInput[];
    deleteMany?:
      | InventoryStockScalarWhereInput
      | InventoryStockScalarWhereInput[];
  };

  export type InventoryLocationCreateNestedOneWithoutEstoquesInput = {
    create?: XOR<
      InventoryLocationCreateWithoutEstoquesInput,
      InventoryLocationUncheckedCreateWithoutEstoquesInput
    >;
    connectOrCreate?: InventoryLocationCreateOrConnectWithoutEstoquesInput;
    connect?: InventoryLocationWhereUniqueInput;
  };

  export type InventoryMovementCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          InventoryMovementCreateWithoutEstoqueInput,
          InventoryMovementUncheckedCreateWithoutEstoqueInput
        >
      | InventoryMovementCreateWithoutEstoqueInput[]
      | InventoryMovementUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | InventoryMovementCreateOrConnectWithoutEstoqueInput
      | InventoryMovementCreateOrConnectWithoutEstoqueInput[];
    createMany?: InventoryMovementCreateManyEstoqueInputEnvelope;
    connect?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
  };

  export type InventoryLotCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          InventoryLotCreateWithoutEstoqueInput,
          InventoryLotUncheckedCreateWithoutEstoqueInput
        >
      | InventoryLotCreateWithoutEstoqueInput[]
      | InventoryLotUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | InventoryLotCreateOrConnectWithoutEstoqueInput
      | InventoryLotCreateOrConnectWithoutEstoqueInput[];
    createMany?: InventoryLotCreateManyEstoqueInputEnvelope;
    connect?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
  };

  export type InventoryMovementUncheckedCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          InventoryMovementCreateWithoutEstoqueInput,
          InventoryMovementUncheckedCreateWithoutEstoqueInput
        >
      | InventoryMovementCreateWithoutEstoqueInput[]
      | InventoryMovementUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | InventoryMovementCreateOrConnectWithoutEstoqueInput
      | InventoryMovementCreateOrConnectWithoutEstoqueInput[];
    createMany?: InventoryMovementCreateManyEstoqueInputEnvelope;
    connect?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
  };

  export type InventoryLotUncheckedCreateNestedManyWithoutEstoqueInput = {
    create?:
      | XOR<
          InventoryLotCreateWithoutEstoqueInput,
          InventoryLotUncheckedCreateWithoutEstoqueInput
        >
      | InventoryLotCreateWithoutEstoqueInput[]
      | InventoryLotUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | InventoryLotCreateOrConnectWithoutEstoqueInput
      | InventoryLotCreateOrConnectWithoutEstoqueInput[];
    createMany?: InventoryLotCreateManyEstoqueInputEnvelope;
    connect?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
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

  export type InventoryLocationUpdateOneRequiredWithoutEstoquesNestedInput = {
    create?: XOR<
      InventoryLocationCreateWithoutEstoquesInput,
      InventoryLocationUncheckedCreateWithoutEstoquesInput
    >;
    connectOrCreate?: InventoryLocationCreateOrConnectWithoutEstoquesInput;
    upsert?: InventoryLocationUpsertWithoutEstoquesInput;
    connect?: InventoryLocationWhereUniqueInput;
    update?: XOR<
      XOR<
        InventoryLocationUpdateToOneWithWhereWithoutEstoquesInput,
        InventoryLocationUpdateWithoutEstoquesInput
      >,
      InventoryLocationUncheckedUpdateWithoutEstoquesInput
    >;
  };

  export type InventoryMovementUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          InventoryMovementCreateWithoutEstoqueInput,
          InventoryMovementUncheckedCreateWithoutEstoqueInput
        >
      | InventoryMovementCreateWithoutEstoqueInput[]
      | InventoryMovementUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | InventoryMovementCreateOrConnectWithoutEstoqueInput
      | InventoryMovementCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | InventoryMovementUpsertWithWhereUniqueWithoutEstoqueInput
      | InventoryMovementUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: InventoryMovementCreateManyEstoqueInputEnvelope;
    set?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
    disconnect?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
    delete?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
    connect?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
    update?:
      | InventoryMovementUpdateWithWhereUniqueWithoutEstoqueInput
      | InventoryMovementUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | InventoryMovementUpdateManyWithWhereWithoutEstoqueInput
      | InventoryMovementUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?:
      | InventoryMovementScalarWhereInput
      | InventoryMovementScalarWhereInput[];
  };

  export type InventoryLotUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          InventoryLotCreateWithoutEstoqueInput,
          InventoryLotUncheckedCreateWithoutEstoqueInput
        >
      | InventoryLotCreateWithoutEstoqueInput[]
      | InventoryLotUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | InventoryLotCreateOrConnectWithoutEstoqueInput
      | InventoryLotCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | InventoryLotUpsertWithWhereUniqueWithoutEstoqueInput
      | InventoryLotUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: InventoryLotCreateManyEstoqueInputEnvelope;
    set?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
    disconnect?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
    delete?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
    connect?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
    update?:
      | InventoryLotUpdateWithWhereUniqueWithoutEstoqueInput
      | InventoryLotUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | InventoryLotUpdateManyWithWhereWithoutEstoqueInput
      | InventoryLotUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?: InventoryLotScalarWhereInput | InventoryLotScalarWhereInput[];
  };

  export type InventoryMovementUncheckedUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          InventoryMovementCreateWithoutEstoqueInput,
          InventoryMovementUncheckedCreateWithoutEstoqueInput
        >
      | InventoryMovementCreateWithoutEstoqueInput[]
      | InventoryMovementUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | InventoryMovementCreateOrConnectWithoutEstoqueInput
      | InventoryMovementCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | InventoryMovementUpsertWithWhereUniqueWithoutEstoqueInput
      | InventoryMovementUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: InventoryMovementCreateManyEstoqueInputEnvelope;
    set?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
    disconnect?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
    delete?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
    connect?:
      | InventoryMovementWhereUniqueInput
      | InventoryMovementWhereUniqueInput[];
    update?:
      | InventoryMovementUpdateWithWhereUniqueWithoutEstoqueInput
      | InventoryMovementUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | InventoryMovementUpdateManyWithWhereWithoutEstoqueInput
      | InventoryMovementUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?:
      | InventoryMovementScalarWhereInput
      | InventoryMovementScalarWhereInput[];
  };

  export type InventoryLotUncheckedUpdateManyWithoutEstoqueNestedInput = {
    create?:
      | XOR<
          InventoryLotCreateWithoutEstoqueInput,
          InventoryLotUncheckedCreateWithoutEstoqueInput
        >
      | InventoryLotCreateWithoutEstoqueInput[]
      | InventoryLotUncheckedCreateWithoutEstoqueInput[];
    connectOrCreate?:
      | InventoryLotCreateOrConnectWithoutEstoqueInput
      | InventoryLotCreateOrConnectWithoutEstoqueInput[];
    upsert?:
      | InventoryLotUpsertWithWhereUniqueWithoutEstoqueInput
      | InventoryLotUpsertWithWhereUniqueWithoutEstoqueInput[];
    createMany?: InventoryLotCreateManyEstoqueInputEnvelope;
    set?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
    disconnect?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
    delete?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
    connect?: InventoryLotWhereUniqueInput | InventoryLotWhereUniqueInput[];
    update?:
      | InventoryLotUpdateWithWhereUniqueWithoutEstoqueInput
      | InventoryLotUpdateWithWhereUniqueWithoutEstoqueInput[];
    updateMany?:
      | InventoryLotUpdateManyWithWhereWithoutEstoqueInput
      | InventoryLotUpdateManyWithWhereWithoutEstoqueInput[];
    deleteMany?: InventoryLotScalarWhereInput | InventoryLotScalarWhereInput[];
  };

  export type InventoryStockCreateNestedOneWithoutMovimentacoesInput = {
    create?: XOR<
      InventoryStockCreateWithoutMovimentacoesInput,
      InventoryStockUncheckedCreateWithoutMovimentacoesInput
    >;
    connectOrCreate?: InventoryStockCreateOrConnectWithoutMovimentacoesInput;
    connect?: InventoryStockWhereUniqueInput;
  };

  export type EnumInventoryMovementTypeFieldUpdateOperationsInput = {
    set?: $Enums.InventoryMovementType;
  };

  export type InventoryStockUpdateOneRequiredWithoutMovimentacoesNestedInput = {
    create?: XOR<
      InventoryStockCreateWithoutMovimentacoesInput,
      InventoryStockUncheckedCreateWithoutMovimentacoesInput
    >;
    connectOrCreate?: InventoryStockCreateOrConnectWithoutMovimentacoesInput;
    upsert?: InventoryStockUpsertWithoutMovimentacoesInput;
    connect?: InventoryStockWhereUniqueInput;
    update?: XOR<
      XOR<
        InventoryStockUpdateToOneWithWhereWithoutMovimentacoesInput,
        InventoryStockUpdateWithoutMovimentacoesInput
      >,
      InventoryStockUncheckedUpdateWithoutMovimentacoesInput
    >;
  };

  export type InventoryStockCreateNestedOneWithoutLotesInput = {
    create?: XOR<
      InventoryStockCreateWithoutLotesInput,
      InventoryStockUncheckedCreateWithoutLotesInput
    >;
    connectOrCreate?: InventoryStockCreateOrConnectWithoutLotesInput;
    connect?: InventoryStockWhereUniqueInput;
  };

  export type EnumInventoryLotStatusFieldUpdateOperationsInput = {
    set?: $Enums.InventoryLotStatus;
  };

  export type InventoryStockUpdateOneRequiredWithoutLotesNestedInput = {
    create?: XOR<
      InventoryStockCreateWithoutLotesInput,
      InventoryStockUncheckedCreateWithoutLotesInput
    >;
    connectOrCreate?: InventoryStockCreateOrConnectWithoutLotesInput;
    upsert?: InventoryStockUpsertWithoutLotesInput;
    connect?: InventoryStockWhereUniqueInput;
    update?: XOR<
      XOR<
        InventoryStockUpdateToOneWithWhereWithoutLotesInput,
        InventoryStockUpdateWithoutLotesInput
      >,
      InventoryStockUncheckedUpdateWithoutLotesInput
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

  export type NestedEnumInventoryMovementTypeFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.InventoryMovementType
      | EnumInventoryMovementTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.InventoryMovementType[];
    notIn?: $Enums.InventoryMovementType[];
    not?:
      | NestedEnumInventoryMovementTypeFilter<$PrismaModel>
      | $Enums.InventoryMovementType;
  };

  export type NestedEnumInventoryMovementTypeWithAggregatesFilter<
    $PrismaModel = never,
  > = {
    equals?:
      | $Enums.InventoryMovementType
      | EnumInventoryMovementTypeFieldRefInput<$PrismaModel>;
    in?: $Enums.InventoryMovementType[];
    notIn?: $Enums.InventoryMovementType[];
    not?:
      | NestedEnumInventoryMovementTypeWithAggregatesFilter<$PrismaModel>
      | $Enums.InventoryMovementType;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedEnumInventoryMovementTypeFilter<$PrismaModel>;
    _max?: NestedEnumInventoryMovementTypeFilter<$PrismaModel>;
  };

  export type NestedEnumInventoryLotStatusFilter<$PrismaModel = never> = {
    equals?:
      | $Enums.InventoryLotStatus
      | EnumInventoryLotStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.InventoryLotStatus[];
    notIn?: $Enums.InventoryLotStatus[];
    not?:
      | NestedEnumInventoryLotStatusFilter<$PrismaModel>
      | $Enums.InventoryLotStatus;
  };

  export type NestedEnumInventoryLotStatusWithAggregatesFilter<
    $PrismaModel = never,
  > = {
    equals?:
      | $Enums.InventoryLotStatus
      | EnumInventoryLotStatusFieldRefInput<$PrismaModel>;
    in?: $Enums.InventoryLotStatus[];
    notIn?: $Enums.InventoryLotStatus[];
    not?:
      | NestedEnumInventoryLotStatusWithAggregatesFilter<$PrismaModel>
      | $Enums.InventoryLotStatus;
    _count?: NestedIntFilter<$PrismaModel>;
    _min?: NestedEnumInventoryLotStatusFilter<$PrismaModel>;
    _max?: NestedEnumInventoryLotStatusFilter<$PrismaModel>;
  };

  export type InventoryStockCreateWithoutLocalizacaoInput = {
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
    movimentacoes?: InventoryMovementCreateNestedManyWithoutEstoqueInput;
    lotes?: InventoryLotCreateNestedManyWithoutEstoqueInput;
  };

  export type InventoryStockUncheckedCreateWithoutLocalizacaoInput = {
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
    movimentacoes?: InventoryMovementUncheckedCreateNestedManyWithoutEstoqueInput;
    lotes?: InventoryLotUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type InventoryStockCreateOrConnectWithoutLocalizacaoInput = {
    where: InventoryStockWhereUniqueInput;
    create: XOR<
      InventoryStockCreateWithoutLocalizacaoInput,
      InventoryStockUncheckedCreateWithoutLocalizacaoInput
    >;
  };

  export type InventoryStockCreateManyLocalizacaoInputEnvelope = {
    data:
      | InventoryStockCreateManyLocalizacaoInput
      | InventoryStockCreateManyLocalizacaoInput[];
    skipDuplicates?: boolean;
  };

  export type InventoryStockUpsertWithWhereUniqueWithoutLocalizacaoInput = {
    where: InventoryStockWhereUniqueInput;
    update: XOR<
      InventoryStockUpdateWithoutLocalizacaoInput,
      InventoryStockUncheckedUpdateWithoutLocalizacaoInput
    >;
    create: XOR<
      InventoryStockCreateWithoutLocalizacaoInput,
      InventoryStockUncheckedCreateWithoutLocalizacaoInput
    >;
  };

  export type InventoryStockUpdateWithWhereUniqueWithoutLocalizacaoInput = {
    where: InventoryStockWhereUniqueInput;
    data: XOR<
      InventoryStockUpdateWithoutLocalizacaoInput,
      InventoryStockUncheckedUpdateWithoutLocalizacaoInput
    >;
  };

  export type InventoryStockUpdateManyWithWhereWithoutLocalizacaoInput = {
    where: InventoryStockScalarWhereInput;
    data: XOR<
      InventoryStockUpdateManyMutationInput,
      InventoryStockUncheckedUpdateManyWithoutLocalizacaoInput
    >;
  };

  export type InventoryStockScalarWhereInput = {
    AND?: InventoryStockScalarWhereInput | InventoryStockScalarWhereInput[];
    OR?: InventoryStockScalarWhereInput[];
    NOT?: InventoryStockScalarWhereInput | InventoryStockScalarWhereInput[];
    id?: StringFilter<'InventoryStock'> | string;
    insumoId?: StringFilter<'InventoryStock'> | string;
    localizacaoId?: StringFilter<'InventoryStock'> | string;
    quantidadeAtual?:
      | DecimalFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeReservada?:
      | DecimalFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMinimo?:
      | DecimalFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    estoqueMaximo?:
      | DecimalNullableFilter<'InventoryStock'>
      | Decimal
      | DecimalJsLike
      | number
      | string
      | null;
    lojaId?: StringFilter<'InventoryStock'> | string;
    createdAt?: DateTimeFilter<'InventoryStock'> | Date | string;
    updatedAt?: DateTimeFilter<'InventoryStock'> | Date | string;
    dataUltimaMov?:
      | DateTimeNullableFilter<'InventoryStock'>
      | Date
      | string
      | null;
  };

  export type InventoryLocationCreateWithoutEstoquesInput = {
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

  export type InventoryLocationUncheckedCreateWithoutEstoquesInput = {
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

  export type InventoryLocationCreateOrConnectWithoutEstoquesInput = {
    where: InventoryLocationWhereUniqueInput;
    create: XOR<
      InventoryLocationCreateWithoutEstoquesInput,
      InventoryLocationUncheckedCreateWithoutEstoquesInput
    >;
  };

  export type InventoryMovementCreateWithoutEstoqueInput = {
    id?: string;
    tipo: $Enums.InventoryMovementType;
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

  export type InventoryMovementUncheckedCreateWithoutEstoqueInput = {
    id?: string;
    tipo: $Enums.InventoryMovementType;
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

  export type InventoryMovementCreateOrConnectWithoutEstoqueInput = {
    where: InventoryMovementWhereUniqueInput;
    create: XOR<
      InventoryMovementCreateWithoutEstoqueInput,
      InventoryMovementUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type InventoryMovementCreateManyEstoqueInputEnvelope = {
    data:
      | InventoryMovementCreateManyEstoqueInput
      | InventoryMovementCreateManyEstoqueInput[];
    skipDuplicates?: boolean;
  };

  export type InventoryLotCreateWithoutEstoqueInput = {
    id?: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.InventoryLotStatus;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type InventoryLotUncheckedCreateWithoutEstoqueInput = {
    id?: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.InventoryLotStatus;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type InventoryLotCreateOrConnectWithoutEstoqueInput = {
    where: InventoryLotWhereUniqueInput;
    create: XOR<
      InventoryLotCreateWithoutEstoqueInput,
      InventoryLotUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type InventoryLotCreateManyEstoqueInputEnvelope = {
    data:
      | InventoryLotCreateManyEstoqueInput
      | InventoryLotCreateManyEstoqueInput[];
    skipDuplicates?: boolean;
  };

  export type InventoryLocationUpsertWithoutEstoquesInput = {
    update: XOR<
      InventoryLocationUpdateWithoutEstoquesInput,
      InventoryLocationUncheckedUpdateWithoutEstoquesInput
    >;
    create: XOR<
      InventoryLocationCreateWithoutEstoquesInput,
      InventoryLocationUncheckedCreateWithoutEstoquesInput
    >;
    where?: InventoryLocationWhereInput;
  };

  export type InventoryLocationUpdateToOneWithWhereWithoutEstoquesInput = {
    where?: InventoryLocationWhereInput;
    data: XOR<
      InventoryLocationUpdateWithoutEstoquesInput,
      InventoryLocationUncheckedUpdateWithoutEstoquesInput
    >;
  };

  export type InventoryLocationUpdateWithoutEstoquesInput = {
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

  export type InventoryLocationUncheckedUpdateWithoutEstoquesInput = {
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

  export type InventoryMovementUpsertWithWhereUniqueWithoutEstoqueInput = {
    where: InventoryMovementWhereUniqueInput;
    update: XOR<
      InventoryMovementUpdateWithoutEstoqueInput,
      InventoryMovementUncheckedUpdateWithoutEstoqueInput
    >;
    create: XOR<
      InventoryMovementCreateWithoutEstoqueInput,
      InventoryMovementUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type InventoryMovementUpdateWithWhereUniqueWithoutEstoqueInput = {
    where: InventoryMovementWhereUniqueInput;
    data: XOR<
      InventoryMovementUpdateWithoutEstoqueInput,
      InventoryMovementUncheckedUpdateWithoutEstoqueInput
    >;
  };

  export type InventoryMovementUpdateManyWithWhereWithoutEstoqueInput = {
    where: InventoryMovementScalarWhereInput;
    data: XOR<
      InventoryMovementUpdateManyMutationInput,
      InventoryMovementUncheckedUpdateManyWithoutEstoqueInput
    >;
  };

  export type InventoryMovementScalarWhereInput = {
    AND?:
      | InventoryMovementScalarWhereInput
      | InventoryMovementScalarWhereInput[];
    OR?: InventoryMovementScalarWhereInput[];
    NOT?:
      | InventoryMovementScalarWhereInput
      | InventoryMovementScalarWhereInput[];
    id?: StringFilter<'InventoryMovement'> | string;
    estoqueId?: StringFilter<'InventoryMovement'> | string;
    tipo?:
      | EnumInventoryMovementTypeFilter<'InventoryMovement'>
      | $Enums.InventoryMovementType;
    quantidade?:
      | DecimalFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadeAnterior?:
      | DecimalFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    quantidadePosterior?:
      | DecimalFilter<'InventoryMovement'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    documentoRef?: StringNullableFilter<'InventoryMovement'> | string | null;
    orcamentoId?: StringNullableFilter<'InventoryMovement'> | string | null;
    usuarioId?: StringFilter<'InventoryMovement'> | string;
    lojaId?: StringFilter<'InventoryMovement'> | string;
    dataMovimentacao?: DateTimeFilter<'InventoryMovement'> | Date | string;
    observacoes?: StringNullableFilter<'InventoryMovement'> | string | null;
  };

  export type InventoryLotUpsertWithWhereUniqueWithoutEstoqueInput = {
    where: InventoryLotWhereUniqueInput;
    update: XOR<
      InventoryLotUpdateWithoutEstoqueInput,
      InventoryLotUncheckedUpdateWithoutEstoqueInput
    >;
    create: XOR<
      InventoryLotCreateWithoutEstoqueInput,
      InventoryLotUncheckedCreateWithoutEstoqueInput
    >;
  };

  export type InventoryLotUpdateWithWhereUniqueWithoutEstoqueInput = {
    where: InventoryLotWhereUniqueInput;
    data: XOR<
      InventoryLotUpdateWithoutEstoqueInput,
      InventoryLotUncheckedUpdateWithoutEstoqueInput
    >;
  };

  export type InventoryLotUpdateManyWithWhereWithoutEstoqueInput = {
    where: InventoryLotScalarWhereInput;
    data: XOR<
      InventoryLotUpdateManyMutationInput,
      InventoryLotUncheckedUpdateManyWithoutEstoqueInput
    >;
  };

  export type InventoryLotScalarWhereInput = {
    AND?: InventoryLotScalarWhereInput | InventoryLotScalarWhereInput[];
    OR?: InventoryLotScalarWhereInput[];
    NOT?: InventoryLotScalarWhereInput | InventoryLotScalarWhereInput[];
    id?: StringFilter<'InventoryLot'> | string;
    estoqueId?: StringFilter<'InventoryLot'> | string;
    numeroLote?: StringFilter<'InventoryLot'> | string;
    dataFabricacao?:
      | DateTimeNullableFilter<'InventoryLot'>
      | Date
      | string
      | null;
    dataValidade?:
      | DateTimeNullableFilter<'InventoryLot'>
      | Date
      | string
      | null;
    quantidadeLote?:
      | DecimalFilter<'InventoryLot'>
      | Decimal
      | DecimalJsLike
      | number
      | string;
    status?:
      | EnumInventoryLotStatusFilter<'InventoryLot'>
      | $Enums.InventoryLotStatus;
    lojaId?: StringFilter<'InventoryLot'> | string;
    createdAt?: DateTimeFilter<'InventoryLot'> | Date | string;
    updatedAt?: DateTimeFilter<'InventoryLot'> | Date | string;
  };

  export type InventoryStockCreateWithoutMovimentacoesInput = {
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
    localizacao: InventoryLocationCreateNestedOneWithoutEstoquesInput;
    lotes?: InventoryLotCreateNestedManyWithoutEstoqueInput;
  };

  export type InventoryStockUncheckedCreateWithoutMovimentacoesInput = {
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
    lotes?: InventoryLotUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type InventoryStockCreateOrConnectWithoutMovimentacoesInput = {
    where: InventoryStockWhereUniqueInput;
    create: XOR<
      InventoryStockCreateWithoutMovimentacoesInput,
      InventoryStockUncheckedCreateWithoutMovimentacoesInput
    >;
  };

  export type InventoryStockUpsertWithoutMovimentacoesInput = {
    update: XOR<
      InventoryStockUpdateWithoutMovimentacoesInput,
      InventoryStockUncheckedUpdateWithoutMovimentacoesInput
    >;
    create: XOR<
      InventoryStockCreateWithoutMovimentacoesInput,
      InventoryStockUncheckedCreateWithoutMovimentacoesInput
    >;
    where?: InventoryStockWhereInput;
  };

  export type InventoryStockUpdateToOneWithWhereWithoutMovimentacoesInput = {
    where?: InventoryStockWhereInput;
    data: XOR<
      InventoryStockUpdateWithoutMovimentacoesInput,
      InventoryStockUncheckedUpdateWithoutMovimentacoesInput
    >;
  };

  export type InventoryStockUpdateWithoutMovimentacoesInput = {
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
    localizacao?: InventoryLocationUpdateOneRequiredWithoutEstoquesNestedInput;
    lotes?: InventoryLotUpdateManyWithoutEstoqueNestedInput;
  };

  export type InventoryStockUncheckedUpdateWithoutMovimentacoesInput = {
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
    lotes?: InventoryLotUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type InventoryStockCreateWithoutLotesInput = {
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
    localizacao: InventoryLocationCreateNestedOneWithoutEstoquesInput;
    movimentacoes?: InventoryMovementCreateNestedManyWithoutEstoqueInput;
  };

  export type InventoryStockUncheckedCreateWithoutLotesInput = {
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
    movimentacoes?: InventoryMovementUncheckedCreateNestedManyWithoutEstoqueInput;
  };

  export type InventoryStockCreateOrConnectWithoutLotesInput = {
    where: InventoryStockWhereUniqueInput;
    create: XOR<
      InventoryStockCreateWithoutLotesInput,
      InventoryStockUncheckedCreateWithoutLotesInput
    >;
  };

  export type InventoryStockUpsertWithoutLotesInput = {
    update: XOR<
      InventoryStockUpdateWithoutLotesInput,
      InventoryStockUncheckedUpdateWithoutLotesInput
    >;
    create: XOR<
      InventoryStockCreateWithoutLotesInput,
      InventoryStockUncheckedCreateWithoutLotesInput
    >;
    where?: InventoryStockWhereInput;
  };

  export type InventoryStockUpdateToOneWithWhereWithoutLotesInput = {
    where?: InventoryStockWhereInput;
    data: XOR<
      InventoryStockUpdateWithoutLotesInput,
      InventoryStockUncheckedUpdateWithoutLotesInput
    >;
  };

  export type InventoryStockUpdateWithoutLotesInput = {
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
    localizacao?: InventoryLocationUpdateOneRequiredWithoutEstoquesNestedInput;
    movimentacoes?: InventoryMovementUpdateManyWithoutEstoqueNestedInput;
  };

  export type InventoryStockUncheckedUpdateWithoutLotesInput = {
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
    movimentacoes?: InventoryMovementUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type InventoryStockCreateManyLocalizacaoInput = {
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

  export type InventoryStockUpdateWithoutLocalizacaoInput = {
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
    movimentacoes?: InventoryMovementUpdateManyWithoutEstoqueNestedInput;
    lotes?: InventoryLotUpdateManyWithoutEstoqueNestedInput;
  };

  export type InventoryStockUncheckedUpdateWithoutLocalizacaoInput = {
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
    movimentacoes?: InventoryMovementUncheckedUpdateManyWithoutEstoqueNestedInput;
    lotes?: InventoryLotUncheckedUpdateManyWithoutEstoqueNestedInput;
  };

  export type InventoryStockUncheckedUpdateManyWithoutLocalizacaoInput = {
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

  export type InventoryMovementCreateManyEstoqueInput = {
    id?: string;
    tipo: $Enums.InventoryMovementType;
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

  export type InventoryLotCreateManyEstoqueInput = {
    id?: string;
    numeroLote: string;
    dataFabricacao?: Date | string | null;
    dataValidade?: Date | string | null;
    quantidadeLote: Decimal | DecimalJsLike | number | string;
    status?: $Enums.InventoryLotStatus;
    lojaId: string;
    createdAt?: Date | string;
    updatedAt?: Date | string;
  };

  export type InventoryMovementUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumInventoryMovementTypeFieldUpdateOperationsInput
      | $Enums.InventoryMovementType;
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

  export type InventoryMovementUncheckedUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumInventoryMovementTypeFieldUpdateOperationsInput
      | $Enums.InventoryMovementType;
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

  export type InventoryMovementUncheckedUpdateManyWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string;
    tipo?:
      | EnumInventoryMovementTypeFieldUpdateOperationsInput
      | $Enums.InventoryMovementType;
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

  export type InventoryLotUpdateWithoutEstoqueInput = {
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
    status?:
      | EnumInventoryLotStatusFieldUpdateOperationsInput
      | $Enums.InventoryLotStatus;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type InventoryLotUncheckedUpdateWithoutEstoqueInput = {
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
    status?:
      | EnumInventoryLotStatusFieldUpdateOperationsInput
      | $Enums.InventoryLotStatus;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
  };

  export type InventoryLotUncheckedUpdateManyWithoutEstoqueInput = {
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
    status?:
      | EnumInventoryLotStatusFieldUpdateOperationsInput
      | $Enums.InventoryLotStatus;
    lojaId?: StringFieldUpdateOperationsInput | string;
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string;
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string;
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
