
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model EstoqueLocalizacao
 * 
 */
export type EstoqueLocalizacao = $Result.DefaultSelection<Prisma.$EstoqueLocalizacaoPayload>
/**
 * Model EstoqueItem
 * 
 */
export type EstoqueItem = $Result.DefaultSelection<Prisma.$EstoqueItemPayload>
/**
 * Model EstoqueMovimentacao
 * 
 */
export type EstoqueMovimentacao = $Result.DefaultSelection<Prisma.$EstoqueMovimentacaoPayload>
/**
 * Model EstoqueLote
 * 
 */
export type EstoqueLote = $Result.DefaultSelection<Prisma.$EstoqueLotePayload>

/**
 * Enums
 */
export namespace $Enums {
  export const TipoMovimentacao: {
  ENTRADA: 'ENTRADA',
  SAIDA: 'SAIDA',
  AJUSTE: 'AJUSTE',
  INVENTARIO: 'INVENTARIO',
  TRANSFERENCIA: 'TRANSFERENCIA'
};

export type TipoMovimentacao = (typeof TipoMovimentacao)[keyof typeof TipoMovimentacao]


export const StatusLote: {
  ATIVO: 'ATIVO',
  VENCIDO: 'VENCIDO',
  CONSUMIDO: 'CONSUMIDO',
  BLOQUEADO: 'BLOQUEADO'
};

export type StatusLote = (typeof StatusLote)[keyof typeof StatusLote]

}

export type TipoMovimentacao = $Enums.TipoMovimentacao

export const TipoMovimentacao: typeof $Enums.TipoMovimentacao

export type StatusLote = $Enums.StatusLote

export const StatusLote: typeof $Enums.StatusLote

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
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

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

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

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
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

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
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

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
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


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
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.estoqueLocalizacao`: Exposes CRUD operations for the **EstoqueLocalizacao** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EstoqueLocalizacaos
    * const estoqueLocalizacaos = await prisma.estoqueLocalizacao.findMany()
    * ```
    */
  get estoqueLocalizacao(): Prisma.EstoqueLocalizacaoDelegate<ExtArgs, ClientOptions>;

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
  get estoqueMovimentacao(): Prisma.EstoqueMovimentacaoDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.estoqueLote`: Exposes CRUD operations for the **EstoqueLote** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more EstoqueLotes
    * const estoqueLotes = await prisma.estoqueLote.findMany()
    * ```
    */
  get estoqueLote(): Prisma.EstoqueLoteDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.11.1
   * Query Engine version: f40f79ec31188888a2e33acda0ecc8fd10a853a9
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

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
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

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
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
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
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    EstoqueLocalizacao: 'EstoqueLocalizacao',
    EstoqueItem: 'EstoqueItem',
    EstoqueMovimentacao: 'EstoqueMovimentacao',
    EstoqueLote: 'EstoqueLote'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    estoqueDb?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "estoqueLocalizacao" | "estoqueItem" | "estoqueMovimentacao" | "estoqueLote"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      EstoqueLocalizacao: {
        payload: Prisma.$EstoqueLocalizacaoPayload<ExtArgs>
        fields: Prisma.EstoqueLocalizacaoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EstoqueLocalizacaoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EstoqueLocalizacaoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>
          }
          findFirst: {
            args: Prisma.EstoqueLocalizacaoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EstoqueLocalizacaoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>
          }
          findMany: {
            args: Prisma.EstoqueLocalizacaoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>[]
          }
          create: {
            args: Prisma.EstoqueLocalizacaoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>
          }
          createMany: {
            args: Prisma.EstoqueLocalizacaoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EstoqueLocalizacaoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>
          }
          update: {
            args: Prisma.EstoqueLocalizacaoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>
          }
          deleteMany: {
            args: Prisma.EstoqueLocalizacaoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EstoqueLocalizacaoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EstoqueLocalizacaoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLocalizacaoPayload>
          }
          aggregate: {
            args: Prisma.EstoqueLocalizacaoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEstoqueLocalizacao>
          }
          groupBy: {
            args: Prisma.EstoqueLocalizacaoGroupByArgs<ExtArgs>
            result: $Utils.Optional<EstoqueLocalizacaoGroupByOutputType>[]
          }
          count: {
            args: Prisma.EstoqueLocalizacaoCountArgs<ExtArgs>
            result: $Utils.Optional<EstoqueLocalizacaoCountAggregateOutputType> | number
          }
        }
      }
      EstoqueItem: {
        payload: Prisma.$EstoqueItemPayload<ExtArgs>
        fields: Prisma.EstoqueItemFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EstoqueItemFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EstoqueItemFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>
          }
          findFirst: {
            args: Prisma.EstoqueItemFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EstoqueItemFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>
          }
          findMany: {
            args: Prisma.EstoqueItemFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>[]
          }
          create: {
            args: Prisma.EstoqueItemCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>
          }
          createMany: {
            args: Prisma.EstoqueItemCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EstoqueItemDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>
          }
          update: {
            args: Prisma.EstoqueItemUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>
          }
          deleteMany: {
            args: Prisma.EstoqueItemDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EstoqueItemUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EstoqueItemUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueItemPayload>
          }
          aggregate: {
            args: Prisma.EstoqueItemAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEstoqueItem>
          }
          groupBy: {
            args: Prisma.EstoqueItemGroupByArgs<ExtArgs>
            result: $Utils.Optional<EstoqueItemGroupByOutputType>[]
          }
          count: {
            args: Prisma.EstoqueItemCountArgs<ExtArgs>
            result: $Utils.Optional<EstoqueItemCountAggregateOutputType> | number
          }
        }
      }
      EstoqueMovimentacao: {
        payload: Prisma.$EstoqueMovimentacaoPayload<ExtArgs>
        fields: Prisma.EstoqueMovimentacaoFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EstoqueMovimentacaoFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EstoqueMovimentacaoFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>
          }
          findFirst: {
            args: Prisma.EstoqueMovimentacaoFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EstoqueMovimentacaoFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>
          }
          findMany: {
            args: Prisma.EstoqueMovimentacaoFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>[]
          }
          create: {
            args: Prisma.EstoqueMovimentacaoCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>
          }
          createMany: {
            args: Prisma.EstoqueMovimentacaoCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EstoqueMovimentacaoDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>
          }
          update: {
            args: Prisma.EstoqueMovimentacaoUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>
          }
          deleteMany: {
            args: Prisma.EstoqueMovimentacaoDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EstoqueMovimentacaoUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EstoqueMovimentacaoUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueMovimentacaoPayload>
          }
          aggregate: {
            args: Prisma.EstoqueMovimentacaoAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEstoqueMovimentacao>
          }
          groupBy: {
            args: Prisma.EstoqueMovimentacaoGroupByArgs<ExtArgs>
            result: $Utils.Optional<EstoqueMovimentacaoGroupByOutputType>[]
          }
          count: {
            args: Prisma.EstoqueMovimentacaoCountArgs<ExtArgs>
            result: $Utils.Optional<EstoqueMovimentacaoCountAggregateOutputType> | number
          }
        }
      }
      EstoqueLote: {
        payload: Prisma.$EstoqueLotePayload<ExtArgs>
        fields: Prisma.EstoqueLoteFieldRefs
        operations: {
          findUnique: {
            args: Prisma.EstoqueLoteFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.EstoqueLoteFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>
          }
          findFirst: {
            args: Prisma.EstoqueLoteFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.EstoqueLoteFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>
          }
          findMany: {
            args: Prisma.EstoqueLoteFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>[]
          }
          create: {
            args: Prisma.EstoqueLoteCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>
          }
          createMany: {
            args: Prisma.EstoqueLoteCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          delete: {
            args: Prisma.EstoqueLoteDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>
          }
          update: {
            args: Prisma.EstoqueLoteUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>
          }
          deleteMany: {
            args: Prisma.EstoqueLoteDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.EstoqueLoteUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          upsert: {
            args: Prisma.EstoqueLoteUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$EstoqueLotePayload>
          }
          aggregate: {
            args: Prisma.EstoqueLoteAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateEstoqueLote>
          }
          groupBy: {
            args: Prisma.EstoqueLoteGroupByArgs<ExtArgs>
            result: $Utils.Optional<EstoqueLoteGroupByOutputType>[]
          }
          count: {
            args: Prisma.EstoqueLoteCountArgs<ExtArgs>
            result: $Utils.Optional<EstoqueLoteCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
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
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
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
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    estoqueLocalizacao?: EstoqueLocalizacaoOmit
    estoqueItem?: EstoqueItemOmit
    estoqueMovimentacao?: EstoqueMovimentacaoOmit
    estoqueLote?: EstoqueLoteOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
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
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type EstoqueLocalizacaoCountOutputType
   */

  export type EstoqueLocalizacaoCountOutputType = {
    estoques: number
  }

  export type EstoqueLocalizacaoCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    estoques?: boolean | EstoqueLocalizacaoCountOutputTypeCountEstoquesArgs
  }

  // Custom InputTypes
  /**
   * EstoqueLocalizacaoCountOutputType without action
   */
  export type EstoqueLocalizacaoCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacaoCountOutputType
     */
    select?: EstoqueLocalizacaoCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EstoqueLocalizacaoCountOutputType without action
   */
  export type EstoqueLocalizacaoCountOutputTypeCountEstoquesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EstoqueItemWhereInput
  }


  /**
   * Count Type EstoqueItemCountOutputType
   */

  export type EstoqueItemCountOutputType = {
    movimentacoes: number
    lotes: number
  }

  export type EstoqueItemCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    movimentacoes?: boolean | EstoqueItemCountOutputTypeCountMovimentacoesArgs
    lotes?: boolean | EstoqueItemCountOutputTypeCountLotesArgs
  }

  // Custom InputTypes
  /**
   * EstoqueItemCountOutputType without action
   */
  export type EstoqueItemCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItemCountOutputType
     */
    select?: EstoqueItemCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * EstoqueItemCountOutputType without action
   */
  export type EstoqueItemCountOutputTypeCountMovimentacoesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EstoqueMovimentacaoWhereInput
  }

  /**
   * EstoqueItemCountOutputType without action
   */
  export type EstoqueItemCountOutputTypeCountLotesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EstoqueLoteWhereInput
  }


  /**
   * Models
   */

  /**
   * Model EstoqueLocalizacao
   */

  export type AggregateEstoqueLocalizacao = {
    _count: EstoqueLocalizacaoCountAggregateOutputType | null
    _avg: EstoqueLocalizacaoAvgAggregateOutputType | null
    _sum: EstoqueLocalizacaoSumAggregateOutputType | null
    _min: EstoqueLocalizacaoMinAggregateOutputType | null
    _max: EstoqueLocalizacaoMaxAggregateOutputType | null
  }

  export type EstoqueLocalizacaoAvgAggregateOutputType = {
    capacidade: Decimal | null
  }

  export type EstoqueLocalizacaoSumAggregateOutputType = {
    capacidade: Decimal | null
  }

  export type EstoqueLocalizacaoMinAggregateOutputType = {
    id: string | null
    codigo: string | null
    deposito: string | null
    corredor: string | null
    prateleira: string | null
    nivel: string | null
    posicao: string | null
    descricao: string | null
    capacidade: Decimal | null
    ativo: boolean | null
    lojaId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EstoqueLocalizacaoMaxAggregateOutputType = {
    id: string | null
    codigo: string | null
    deposito: string | null
    corredor: string | null
    prateleira: string | null
    nivel: string | null
    posicao: string | null
    descricao: string | null
    capacidade: Decimal | null
    ativo: boolean | null
    lojaId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EstoqueLocalizacaoCountAggregateOutputType = {
    id: number
    codigo: number
    deposito: number
    corredor: number
    prateleira: number
    nivel: number
    posicao: number
    descricao: number
    capacidade: number
    ativo: number
    lojaId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EstoqueLocalizacaoAvgAggregateInputType = {
    capacidade?: true
  }

  export type EstoqueLocalizacaoSumAggregateInputType = {
    capacidade?: true
  }

  export type EstoqueLocalizacaoMinAggregateInputType = {
    id?: true
    codigo?: true
    deposito?: true
    corredor?: true
    prateleira?: true
    nivel?: true
    posicao?: true
    descricao?: true
    capacidade?: true
    ativo?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EstoqueLocalizacaoMaxAggregateInputType = {
    id?: true
    codigo?: true
    deposito?: true
    corredor?: true
    prateleira?: true
    nivel?: true
    posicao?: true
    descricao?: true
    capacidade?: true
    ativo?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EstoqueLocalizacaoCountAggregateInputType = {
    id?: true
    codigo?: true
    deposito?: true
    corredor?: true
    prateleira?: true
    nivel?: true
    posicao?: true
    descricao?: true
    capacidade?: true
    ativo?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EstoqueLocalizacaoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EstoqueLocalizacao to aggregate.
     */
    where?: EstoqueLocalizacaoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueLocalizacaos to fetch.
     */
    orderBy?: EstoqueLocalizacaoOrderByWithRelationInput | EstoqueLocalizacaoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EstoqueLocalizacaoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueLocalizacaos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueLocalizacaos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EstoqueLocalizacaos
    **/
    _count?: true | EstoqueLocalizacaoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EstoqueLocalizacaoAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EstoqueLocalizacaoSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EstoqueLocalizacaoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EstoqueLocalizacaoMaxAggregateInputType
  }

  export type GetEstoqueLocalizacaoAggregateType<T extends EstoqueLocalizacaoAggregateArgs> = {
        [P in keyof T & keyof AggregateEstoqueLocalizacao]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstoqueLocalizacao[P]>
      : GetScalarType<T[P], AggregateEstoqueLocalizacao[P]>
  }




  export type EstoqueLocalizacaoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EstoqueLocalizacaoWhereInput
    orderBy?: EstoqueLocalizacaoOrderByWithAggregationInput | EstoqueLocalizacaoOrderByWithAggregationInput[]
    by: EstoqueLocalizacaoScalarFieldEnum[] | EstoqueLocalizacaoScalarFieldEnum
    having?: EstoqueLocalizacaoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EstoqueLocalizacaoCountAggregateInputType | true
    _avg?: EstoqueLocalizacaoAvgAggregateInputType
    _sum?: EstoqueLocalizacaoSumAggregateInputType
    _min?: EstoqueLocalizacaoMinAggregateInputType
    _max?: EstoqueLocalizacaoMaxAggregateInputType
  }

  export type EstoqueLocalizacaoGroupByOutputType = {
    id: string
    codigo: string
    deposito: string
    corredor: string | null
    prateleira: string | null
    nivel: string | null
    posicao: string | null
    descricao: string | null
    capacidade: Decimal | null
    ativo: boolean
    lojaId: string
    createdAt: Date
    updatedAt: Date
    _count: EstoqueLocalizacaoCountAggregateOutputType | null
    _avg: EstoqueLocalizacaoAvgAggregateOutputType | null
    _sum: EstoqueLocalizacaoSumAggregateOutputType | null
    _min: EstoqueLocalizacaoMinAggregateOutputType | null
    _max: EstoqueLocalizacaoMaxAggregateOutputType | null
  }

  type GetEstoqueLocalizacaoGroupByPayload<T extends EstoqueLocalizacaoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EstoqueLocalizacaoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EstoqueLocalizacaoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EstoqueLocalizacaoGroupByOutputType[P]>
            : GetScalarType<T[P], EstoqueLocalizacaoGroupByOutputType[P]>
        }
      >
    >


  export type EstoqueLocalizacaoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    codigo?: boolean
    deposito?: boolean
    corredor?: boolean
    prateleira?: boolean
    nivel?: boolean
    posicao?: boolean
    descricao?: boolean
    capacidade?: boolean
    ativo?: boolean
    lojaId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    estoques?: boolean | EstoqueLocalizacao$estoquesArgs<ExtArgs>
    _count?: boolean | EstoqueLocalizacaoCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["estoqueLocalizacao"]>



  export type EstoqueLocalizacaoSelectScalar = {
    id?: boolean
    codigo?: boolean
    deposito?: boolean
    corredor?: boolean
    prateleira?: boolean
    nivel?: boolean
    posicao?: boolean
    descricao?: boolean
    capacidade?: boolean
    ativo?: boolean
    lojaId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EstoqueLocalizacaoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "codigo" | "deposito" | "corredor" | "prateleira" | "nivel" | "posicao" | "descricao" | "capacidade" | "ativo" | "lojaId" | "createdAt" | "updatedAt", ExtArgs["result"]["estoqueLocalizacao"]>
  export type EstoqueLocalizacaoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    estoques?: boolean | EstoqueLocalizacao$estoquesArgs<ExtArgs>
    _count?: boolean | EstoqueLocalizacaoCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $EstoqueLocalizacaoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EstoqueLocalizacao"
    objects: {
      estoques: Prisma.$EstoqueItemPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      codigo: string
      deposito: string
      corredor: string | null
      prateleira: string | null
      nivel: string | null
      posicao: string | null
      descricao: string | null
      capacidade: Prisma.Decimal | null
      ativo: boolean
      lojaId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["estoqueLocalizacao"]>
    composites: {}
  }

  type EstoqueLocalizacaoGetPayload<S extends boolean | null | undefined | EstoqueLocalizacaoDefaultArgs> = $Result.GetResult<Prisma.$EstoqueLocalizacaoPayload, S>

  type EstoqueLocalizacaoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EstoqueLocalizacaoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EstoqueLocalizacaoCountAggregateInputType | true
    }

  export interface EstoqueLocalizacaoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EstoqueLocalizacao'], meta: { name: 'EstoqueLocalizacao' } }
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
    findUnique<T extends EstoqueLocalizacaoFindUniqueArgs>(args: SelectSubset<T, EstoqueLocalizacaoFindUniqueArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findUniqueOrThrow<T extends EstoqueLocalizacaoFindUniqueOrThrowArgs>(args: SelectSubset<T, EstoqueLocalizacaoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findFirst<T extends EstoqueLocalizacaoFindFirstArgs>(args?: SelectSubset<T, EstoqueLocalizacaoFindFirstArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findFirstOrThrow<T extends EstoqueLocalizacaoFindFirstOrThrowArgs>(args?: SelectSubset<T, EstoqueLocalizacaoFindFirstOrThrowArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findMany<T extends EstoqueLocalizacaoFindManyArgs>(args?: SelectSubset<T, EstoqueLocalizacaoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

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
    create<T extends EstoqueLocalizacaoCreateArgs>(args: SelectSubset<T, EstoqueLocalizacaoCreateArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    createMany<T extends EstoqueLocalizacaoCreateManyArgs>(args?: SelectSubset<T, EstoqueLocalizacaoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    delete<T extends EstoqueLocalizacaoDeleteArgs>(args: SelectSubset<T, EstoqueLocalizacaoDeleteArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    update<T extends EstoqueLocalizacaoUpdateArgs>(args: SelectSubset<T, EstoqueLocalizacaoUpdateArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    deleteMany<T extends EstoqueLocalizacaoDeleteManyArgs>(args?: SelectSubset<T, EstoqueLocalizacaoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    updateMany<T extends EstoqueLocalizacaoUpdateManyArgs>(args: SelectSubset<T, EstoqueLocalizacaoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    upsert<T extends EstoqueLocalizacaoUpsertArgs>(args: SelectSubset<T, EstoqueLocalizacaoUpsertArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


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
          : GetScalarType<T['select'], EstoqueLocalizacaoCountAggregateOutputType>
        : number
    >

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
    aggregate<T extends EstoqueLocalizacaoAggregateArgs>(args: Subset<T, EstoqueLocalizacaoAggregateArgs>): Prisma.PrismaPromise<GetEstoqueLocalizacaoAggregateType<T>>

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
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
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
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EstoqueLocalizacaoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEstoqueLocalizacaoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
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
  export interface Prisma__EstoqueLocalizacaoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    estoques<T extends EstoqueLocalizacao$estoquesArgs<ExtArgs> = {}>(args?: Subset<T, EstoqueLocalizacao$estoquesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EstoqueLocalizacao model
   */
  interface EstoqueLocalizacaoFieldRefs {
    readonly id: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly codigo: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly deposito: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly corredor: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly prateleira: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly nivel: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly posicao: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly descricao: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly capacidade: FieldRef<"EstoqueLocalizacao", 'Decimal'>
    readonly ativo: FieldRef<"EstoqueLocalizacao", 'Boolean'>
    readonly lojaId: FieldRef<"EstoqueLocalizacao", 'String'>
    readonly createdAt: FieldRef<"EstoqueLocalizacao", 'DateTime'>
    readonly updatedAt: FieldRef<"EstoqueLocalizacao", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EstoqueLocalizacao findUnique
   */
  export type EstoqueLocalizacaoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLocalizacao to fetch.
     */
    where: EstoqueLocalizacaoWhereUniqueInput
  }

  /**
   * EstoqueLocalizacao findUniqueOrThrow
   */
  export type EstoqueLocalizacaoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLocalizacao to fetch.
     */
    where: EstoqueLocalizacaoWhereUniqueInput
  }

  /**
   * EstoqueLocalizacao findFirst
   */
  export type EstoqueLocalizacaoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLocalizacao to fetch.
     */
    where?: EstoqueLocalizacaoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueLocalizacaos to fetch.
     */
    orderBy?: EstoqueLocalizacaoOrderByWithRelationInput | EstoqueLocalizacaoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EstoqueLocalizacaos.
     */
    cursor?: EstoqueLocalizacaoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueLocalizacaos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueLocalizacaos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EstoqueLocalizacaos.
     */
    distinct?: EstoqueLocalizacaoScalarFieldEnum | EstoqueLocalizacaoScalarFieldEnum[]
  }

  /**
   * EstoqueLocalizacao findFirstOrThrow
   */
  export type EstoqueLocalizacaoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLocalizacao to fetch.
     */
    where?: EstoqueLocalizacaoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueLocalizacaos to fetch.
     */
    orderBy?: EstoqueLocalizacaoOrderByWithRelationInput | EstoqueLocalizacaoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EstoqueLocalizacaos.
     */
    cursor?: EstoqueLocalizacaoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueLocalizacaos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueLocalizacaos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EstoqueLocalizacaos.
     */
    distinct?: EstoqueLocalizacaoScalarFieldEnum | EstoqueLocalizacaoScalarFieldEnum[]
  }

  /**
   * EstoqueLocalizacao findMany
   */
  export type EstoqueLocalizacaoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLocalizacaos to fetch.
     */
    where?: EstoqueLocalizacaoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueLocalizacaos to fetch.
     */
    orderBy?: EstoqueLocalizacaoOrderByWithRelationInput | EstoqueLocalizacaoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EstoqueLocalizacaos.
     */
    cursor?: EstoqueLocalizacaoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueLocalizacaos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueLocalizacaos.
     */
    skip?: number
    distinct?: EstoqueLocalizacaoScalarFieldEnum | EstoqueLocalizacaoScalarFieldEnum[]
  }

  /**
   * EstoqueLocalizacao create
   */
  export type EstoqueLocalizacaoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * The data needed to create a EstoqueLocalizacao.
     */
    data: XOR<EstoqueLocalizacaoCreateInput, EstoqueLocalizacaoUncheckedCreateInput>
  }

  /**
   * EstoqueLocalizacao createMany
   */
  export type EstoqueLocalizacaoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EstoqueLocalizacaos.
     */
    data: EstoqueLocalizacaoCreateManyInput | EstoqueLocalizacaoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EstoqueLocalizacao update
   */
  export type EstoqueLocalizacaoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * The data needed to update a EstoqueLocalizacao.
     */
    data: XOR<EstoqueLocalizacaoUpdateInput, EstoqueLocalizacaoUncheckedUpdateInput>
    /**
     * Choose, which EstoqueLocalizacao to update.
     */
    where: EstoqueLocalizacaoWhereUniqueInput
  }

  /**
   * EstoqueLocalizacao updateMany
   */
  export type EstoqueLocalizacaoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EstoqueLocalizacaos.
     */
    data: XOR<EstoqueLocalizacaoUpdateManyMutationInput, EstoqueLocalizacaoUncheckedUpdateManyInput>
    /**
     * Filter which EstoqueLocalizacaos to update
     */
    where?: EstoqueLocalizacaoWhereInput
    /**
     * Limit how many EstoqueLocalizacaos to update.
     */
    limit?: number
  }

  /**
   * EstoqueLocalizacao upsert
   */
  export type EstoqueLocalizacaoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * The filter to search for the EstoqueLocalizacao to update in case it exists.
     */
    where: EstoqueLocalizacaoWhereUniqueInput
    /**
     * In case the EstoqueLocalizacao found by the `where` argument doesn't exist, create a new EstoqueLocalizacao with this data.
     */
    create: XOR<EstoqueLocalizacaoCreateInput, EstoqueLocalizacaoUncheckedCreateInput>
    /**
     * In case the EstoqueLocalizacao was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EstoqueLocalizacaoUpdateInput, EstoqueLocalizacaoUncheckedUpdateInput>
  }

  /**
   * EstoqueLocalizacao delete
   */
  export type EstoqueLocalizacaoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
    /**
     * Filter which EstoqueLocalizacao to delete.
     */
    where: EstoqueLocalizacaoWhereUniqueInput
  }

  /**
   * EstoqueLocalizacao deleteMany
   */
  export type EstoqueLocalizacaoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EstoqueLocalizacaos to delete
     */
    where?: EstoqueLocalizacaoWhereInput
    /**
     * Limit how many EstoqueLocalizacaos to delete.
     */
    limit?: number
  }

  /**
   * EstoqueLocalizacao.estoques
   */
  export type EstoqueLocalizacao$estoquesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    where?: EstoqueItemWhereInput
    orderBy?: EstoqueItemOrderByWithRelationInput | EstoqueItemOrderByWithRelationInput[]
    cursor?: EstoqueItemWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EstoqueItemScalarFieldEnum | EstoqueItemScalarFieldEnum[]
  }

  /**
   * EstoqueLocalizacao without action
   */
  export type EstoqueLocalizacaoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLocalizacao
     */
    select?: EstoqueLocalizacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLocalizacao
     */
    omit?: EstoqueLocalizacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLocalizacaoInclude<ExtArgs> | null
  }


  /**
   * Model EstoqueItem
   */

  export type AggregateEstoqueItem = {
    _count: EstoqueItemCountAggregateOutputType | null
    _avg: EstoqueItemAvgAggregateOutputType | null
    _sum: EstoqueItemSumAggregateOutputType | null
    _min: EstoqueItemMinAggregateOutputType | null
    _max: EstoqueItemMaxAggregateOutputType | null
  }

  export type EstoqueItemAvgAggregateOutputType = {
    quantidadeAtual: Decimal | null
    quantidadeReservada: Decimal | null
    estoqueMinimo: Decimal | null
    estoqueMaximo: Decimal | null
  }

  export type EstoqueItemSumAggregateOutputType = {
    quantidadeAtual: Decimal | null
    quantidadeReservada: Decimal | null
    estoqueMinimo: Decimal | null
    estoqueMaximo: Decimal | null
  }

  export type EstoqueItemMinAggregateOutputType = {
    id: string | null
    insumoId: string | null
    localizacaoId: string | null
    quantidadeAtual: Decimal | null
    quantidadeReservada: Decimal | null
    estoqueMinimo: Decimal | null
    estoqueMaximo: Decimal | null
    lojaId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    dataUltimaMov: Date | null
  }

  export type EstoqueItemMaxAggregateOutputType = {
    id: string | null
    insumoId: string | null
    localizacaoId: string | null
    quantidadeAtual: Decimal | null
    quantidadeReservada: Decimal | null
    estoqueMinimo: Decimal | null
    estoqueMaximo: Decimal | null
    lojaId: string | null
    createdAt: Date | null
    updatedAt: Date | null
    dataUltimaMov: Date | null
  }

  export type EstoqueItemCountAggregateOutputType = {
    id: number
    insumoId: number
    localizacaoId: number
    quantidadeAtual: number
    quantidadeReservada: number
    estoqueMinimo: number
    estoqueMaximo: number
    lojaId: number
    createdAt: number
    updatedAt: number
    dataUltimaMov: number
    _all: number
  }


  export type EstoqueItemAvgAggregateInputType = {
    quantidadeAtual?: true
    quantidadeReservada?: true
    estoqueMinimo?: true
    estoqueMaximo?: true
  }

  export type EstoqueItemSumAggregateInputType = {
    quantidadeAtual?: true
    quantidadeReservada?: true
    estoqueMinimo?: true
    estoqueMaximo?: true
  }

  export type EstoqueItemMinAggregateInputType = {
    id?: true
    insumoId?: true
    localizacaoId?: true
    quantidadeAtual?: true
    quantidadeReservada?: true
    estoqueMinimo?: true
    estoqueMaximo?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
    dataUltimaMov?: true
  }

  export type EstoqueItemMaxAggregateInputType = {
    id?: true
    insumoId?: true
    localizacaoId?: true
    quantidadeAtual?: true
    quantidadeReservada?: true
    estoqueMinimo?: true
    estoqueMaximo?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
    dataUltimaMov?: true
  }

  export type EstoqueItemCountAggregateInputType = {
    id?: true
    insumoId?: true
    localizacaoId?: true
    quantidadeAtual?: true
    quantidadeReservada?: true
    estoqueMinimo?: true
    estoqueMaximo?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
    dataUltimaMov?: true
    _all?: true
  }

  export type EstoqueItemAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EstoqueItem to aggregate.
     */
    where?: EstoqueItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueItems to fetch.
     */
    orderBy?: EstoqueItemOrderByWithRelationInput | EstoqueItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EstoqueItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EstoqueItems
    **/
    _count?: true | EstoqueItemCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EstoqueItemAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EstoqueItemSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EstoqueItemMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EstoqueItemMaxAggregateInputType
  }

  export type GetEstoqueItemAggregateType<T extends EstoqueItemAggregateArgs> = {
        [P in keyof T & keyof AggregateEstoqueItem]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstoqueItem[P]>
      : GetScalarType<T[P], AggregateEstoqueItem[P]>
  }




  export type EstoqueItemGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EstoqueItemWhereInput
    orderBy?: EstoqueItemOrderByWithAggregationInput | EstoqueItemOrderByWithAggregationInput[]
    by: EstoqueItemScalarFieldEnum[] | EstoqueItemScalarFieldEnum
    having?: EstoqueItemScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EstoqueItemCountAggregateInputType | true
    _avg?: EstoqueItemAvgAggregateInputType
    _sum?: EstoqueItemSumAggregateInputType
    _min?: EstoqueItemMinAggregateInputType
    _max?: EstoqueItemMaxAggregateInputType
  }

  export type EstoqueItemGroupByOutputType = {
    id: string
    insumoId: string
    localizacaoId: string
    quantidadeAtual: Decimal
    quantidadeReservada: Decimal
    estoqueMinimo: Decimal
    estoqueMaximo: Decimal | null
    lojaId: string
    createdAt: Date
    updatedAt: Date
    dataUltimaMov: Date | null
    _count: EstoqueItemCountAggregateOutputType | null
    _avg: EstoqueItemAvgAggregateOutputType | null
    _sum: EstoqueItemSumAggregateOutputType | null
    _min: EstoqueItemMinAggregateOutputType | null
    _max: EstoqueItemMaxAggregateOutputType | null
  }

  type GetEstoqueItemGroupByPayload<T extends EstoqueItemGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EstoqueItemGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EstoqueItemGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EstoqueItemGroupByOutputType[P]>
            : GetScalarType<T[P], EstoqueItemGroupByOutputType[P]>
        }
      >
    >


  export type EstoqueItemSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    insumoId?: boolean
    localizacaoId?: boolean
    quantidadeAtual?: boolean
    quantidadeReservada?: boolean
    estoqueMinimo?: boolean
    estoqueMaximo?: boolean
    lojaId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    dataUltimaMov?: boolean
    localizacao?: boolean | EstoqueLocalizacaoDefaultArgs<ExtArgs>
    movimentacoes?: boolean | EstoqueItem$movimentacoesArgs<ExtArgs>
    lotes?: boolean | EstoqueItem$lotesArgs<ExtArgs>
    _count?: boolean | EstoqueItemCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["estoqueItem"]>



  export type EstoqueItemSelectScalar = {
    id?: boolean
    insumoId?: boolean
    localizacaoId?: boolean
    quantidadeAtual?: boolean
    quantidadeReservada?: boolean
    estoqueMinimo?: boolean
    estoqueMaximo?: boolean
    lojaId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    dataUltimaMov?: boolean
  }

  export type EstoqueItemOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "insumoId" | "localizacaoId" | "quantidadeAtual" | "quantidadeReservada" | "estoqueMinimo" | "estoqueMaximo" | "lojaId" | "createdAt" | "updatedAt" | "dataUltimaMov", ExtArgs["result"]["estoqueItem"]>
  export type EstoqueItemInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    localizacao?: boolean | EstoqueLocalizacaoDefaultArgs<ExtArgs>
    movimentacoes?: boolean | EstoqueItem$movimentacoesArgs<ExtArgs>
    lotes?: boolean | EstoqueItem$lotesArgs<ExtArgs>
    _count?: boolean | EstoqueItemCountOutputTypeDefaultArgs<ExtArgs>
  }

  export type $EstoqueItemPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EstoqueItem"
    objects: {
      localizacao: Prisma.$EstoqueLocalizacaoPayload<ExtArgs>
      movimentacoes: Prisma.$EstoqueMovimentacaoPayload<ExtArgs>[]
      lotes: Prisma.$EstoqueLotePayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      insumoId: string
      localizacaoId: string
      quantidadeAtual: Prisma.Decimal
      quantidadeReservada: Prisma.Decimal
      estoqueMinimo: Prisma.Decimal
      estoqueMaximo: Prisma.Decimal | null
      lojaId: string
      createdAt: Date
      updatedAt: Date
      dataUltimaMov: Date | null
    }, ExtArgs["result"]["estoqueItem"]>
    composites: {}
  }

  type EstoqueItemGetPayload<S extends boolean | null | undefined | EstoqueItemDefaultArgs> = $Result.GetResult<Prisma.$EstoqueItemPayload, S>

  type EstoqueItemCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EstoqueItemFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EstoqueItemCountAggregateInputType | true
    }

  export interface EstoqueItemDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EstoqueItem'], meta: { name: 'EstoqueItem' } }
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
    findUnique<T extends EstoqueItemFindUniqueArgs>(args: SelectSubset<T, EstoqueItemFindUniqueArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findUniqueOrThrow<T extends EstoqueItemFindUniqueOrThrowArgs>(args: SelectSubset<T, EstoqueItemFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findFirst<T extends EstoqueItemFindFirstArgs>(args?: SelectSubset<T, EstoqueItemFindFirstArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findFirstOrThrow<T extends EstoqueItemFindFirstOrThrowArgs>(args?: SelectSubset<T, EstoqueItemFindFirstOrThrowArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findMany<T extends EstoqueItemFindManyArgs>(args?: SelectSubset<T, EstoqueItemFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

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
    create<T extends EstoqueItemCreateArgs>(args: SelectSubset<T, EstoqueItemCreateArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    createMany<T extends EstoqueItemCreateManyArgs>(args?: SelectSubset<T, EstoqueItemCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    delete<T extends EstoqueItemDeleteArgs>(args: SelectSubset<T, EstoqueItemDeleteArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    update<T extends EstoqueItemUpdateArgs>(args: SelectSubset<T, EstoqueItemUpdateArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    deleteMany<T extends EstoqueItemDeleteManyArgs>(args?: SelectSubset<T, EstoqueItemDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    updateMany<T extends EstoqueItemUpdateManyArgs>(args: SelectSubset<T, EstoqueItemUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    upsert<T extends EstoqueItemUpsertArgs>(args: SelectSubset<T, EstoqueItemUpsertArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


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
    >

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
    aggregate<T extends EstoqueItemAggregateArgs>(args: Subset<T, EstoqueItemAggregateArgs>): Prisma.PrismaPromise<GetEstoqueItemAggregateType<T>>

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
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
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
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EstoqueItemGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEstoqueItemGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
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
  export interface Prisma__EstoqueItemClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    localizacao<T extends EstoqueLocalizacaoDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EstoqueLocalizacaoDefaultArgs<ExtArgs>>): Prisma__EstoqueLocalizacaoClient<$Result.GetResult<Prisma.$EstoqueLocalizacaoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    movimentacoes<T extends EstoqueItem$movimentacoesArgs<ExtArgs> = {}>(args?: Subset<T, EstoqueItem$movimentacoesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    lotes<T extends EstoqueItem$lotesArgs<ExtArgs> = {}>(args?: Subset<T, EstoqueItem$lotesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EstoqueItem model
   */
  interface EstoqueItemFieldRefs {
    readonly id: FieldRef<"EstoqueItem", 'String'>
    readonly insumoId: FieldRef<"EstoqueItem", 'String'>
    readonly localizacaoId: FieldRef<"EstoqueItem", 'String'>
    readonly quantidadeAtual: FieldRef<"EstoqueItem", 'Decimal'>
    readonly quantidadeReservada: FieldRef<"EstoqueItem", 'Decimal'>
    readonly estoqueMinimo: FieldRef<"EstoqueItem", 'Decimal'>
    readonly estoqueMaximo: FieldRef<"EstoqueItem", 'Decimal'>
    readonly lojaId: FieldRef<"EstoqueItem", 'String'>
    readonly createdAt: FieldRef<"EstoqueItem", 'DateTime'>
    readonly updatedAt: FieldRef<"EstoqueItem", 'DateTime'>
    readonly dataUltimaMov: FieldRef<"EstoqueItem", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EstoqueItem findUnique
   */
  export type EstoqueItemFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueItem to fetch.
     */
    where: EstoqueItemWhereUniqueInput
  }

  /**
   * EstoqueItem findUniqueOrThrow
   */
  export type EstoqueItemFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueItem to fetch.
     */
    where: EstoqueItemWhereUniqueInput
  }

  /**
   * EstoqueItem findFirst
   */
  export type EstoqueItemFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueItem to fetch.
     */
    where?: EstoqueItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueItems to fetch.
     */
    orderBy?: EstoqueItemOrderByWithRelationInput | EstoqueItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EstoqueItems.
     */
    cursor?: EstoqueItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EstoqueItems.
     */
    distinct?: EstoqueItemScalarFieldEnum | EstoqueItemScalarFieldEnum[]
  }

  /**
   * EstoqueItem findFirstOrThrow
   */
  export type EstoqueItemFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueItem to fetch.
     */
    where?: EstoqueItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueItems to fetch.
     */
    orderBy?: EstoqueItemOrderByWithRelationInput | EstoqueItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EstoqueItems.
     */
    cursor?: EstoqueItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueItems.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EstoqueItems.
     */
    distinct?: EstoqueItemScalarFieldEnum | EstoqueItemScalarFieldEnum[]
  }

  /**
   * EstoqueItem findMany
   */
  export type EstoqueItemFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueItems to fetch.
     */
    where?: EstoqueItemWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueItems to fetch.
     */
    orderBy?: EstoqueItemOrderByWithRelationInput | EstoqueItemOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EstoqueItems.
     */
    cursor?: EstoqueItemWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueItems from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueItems.
     */
    skip?: number
    distinct?: EstoqueItemScalarFieldEnum | EstoqueItemScalarFieldEnum[]
  }

  /**
   * EstoqueItem create
   */
  export type EstoqueItemCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * The data needed to create a EstoqueItem.
     */
    data: XOR<EstoqueItemCreateInput, EstoqueItemUncheckedCreateInput>
  }

  /**
   * EstoqueItem createMany
   */
  export type EstoqueItemCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EstoqueItems.
     */
    data: EstoqueItemCreateManyInput | EstoqueItemCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EstoqueItem update
   */
  export type EstoqueItemUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * The data needed to update a EstoqueItem.
     */
    data: XOR<EstoqueItemUpdateInput, EstoqueItemUncheckedUpdateInput>
    /**
     * Choose, which EstoqueItem to update.
     */
    where: EstoqueItemWhereUniqueInput
  }

  /**
   * EstoqueItem updateMany
   */
  export type EstoqueItemUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EstoqueItems.
     */
    data: XOR<EstoqueItemUpdateManyMutationInput, EstoqueItemUncheckedUpdateManyInput>
    /**
     * Filter which EstoqueItems to update
     */
    where?: EstoqueItemWhereInput
    /**
     * Limit how many EstoqueItems to update.
     */
    limit?: number
  }

  /**
   * EstoqueItem upsert
   */
  export type EstoqueItemUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * The filter to search for the EstoqueItem to update in case it exists.
     */
    where: EstoqueItemWhereUniqueInput
    /**
     * In case the EstoqueItem found by the `where` argument doesn't exist, create a new EstoqueItem with this data.
     */
    create: XOR<EstoqueItemCreateInput, EstoqueItemUncheckedCreateInput>
    /**
     * In case the EstoqueItem was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EstoqueItemUpdateInput, EstoqueItemUncheckedUpdateInput>
  }

  /**
   * EstoqueItem delete
   */
  export type EstoqueItemDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
    /**
     * Filter which EstoqueItem to delete.
     */
    where: EstoqueItemWhereUniqueInput
  }

  /**
   * EstoqueItem deleteMany
   */
  export type EstoqueItemDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EstoqueItems to delete
     */
    where?: EstoqueItemWhereInput
    /**
     * Limit how many EstoqueItems to delete.
     */
    limit?: number
  }

  /**
   * EstoqueItem.movimentacoes
   */
  export type EstoqueItem$movimentacoesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    where?: EstoqueMovimentacaoWhereInput
    orderBy?: EstoqueMovimentacaoOrderByWithRelationInput | EstoqueMovimentacaoOrderByWithRelationInput[]
    cursor?: EstoqueMovimentacaoWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EstoqueMovimentacaoScalarFieldEnum | EstoqueMovimentacaoScalarFieldEnum[]
  }

  /**
   * EstoqueItem.lotes
   */
  export type EstoqueItem$lotesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    where?: EstoqueLoteWhereInput
    orderBy?: EstoqueLoteOrderByWithRelationInput | EstoqueLoteOrderByWithRelationInput[]
    cursor?: EstoqueLoteWhereUniqueInput
    take?: number
    skip?: number
    distinct?: EstoqueLoteScalarFieldEnum | EstoqueLoteScalarFieldEnum[]
  }

  /**
   * EstoqueItem without action
   */
  export type EstoqueItemDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueItem
     */
    select?: EstoqueItemSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueItem
     */
    omit?: EstoqueItemOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueItemInclude<ExtArgs> | null
  }


  /**
   * Model EstoqueMovimentacao
   */

  export type AggregateEstoqueMovimentacao = {
    _count: EstoqueMovimentacaoCountAggregateOutputType | null
    _avg: EstoqueMovimentacaoAvgAggregateOutputType | null
    _sum: EstoqueMovimentacaoSumAggregateOutputType | null
    _min: EstoqueMovimentacaoMinAggregateOutputType | null
    _max: EstoqueMovimentacaoMaxAggregateOutputType | null
  }

  export type EstoqueMovimentacaoAvgAggregateOutputType = {
    quantidade: Decimal | null
    quantidadeAnterior: Decimal | null
    quantidadePosterior: Decimal | null
  }

  export type EstoqueMovimentacaoSumAggregateOutputType = {
    quantidade: Decimal | null
    quantidadeAnterior: Decimal | null
    quantidadePosterior: Decimal | null
  }

  export type EstoqueMovimentacaoMinAggregateOutputType = {
    id: string | null
    estoqueId: string | null
    tipo: $Enums.TipoMovimentacao | null
    quantidade: Decimal | null
    quantidadeAnterior: Decimal | null
    quantidadePosterior: Decimal | null
    documentoRef: string | null
    orcamentoId: string | null
    usuarioId: string | null
    lojaId: string | null
    dataMovimentacao: Date | null
    observacoes: string | null
  }

  export type EstoqueMovimentacaoMaxAggregateOutputType = {
    id: string | null
    estoqueId: string | null
    tipo: $Enums.TipoMovimentacao | null
    quantidade: Decimal | null
    quantidadeAnterior: Decimal | null
    quantidadePosterior: Decimal | null
    documentoRef: string | null
    orcamentoId: string | null
    usuarioId: string | null
    lojaId: string | null
    dataMovimentacao: Date | null
    observacoes: string | null
  }

  export type EstoqueMovimentacaoCountAggregateOutputType = {
    id: number
    estoqueId: number
    tipo: number
    quantidade: number
    quantidadeAnterior: number
    quantidadePosterior: number
    documentoRef: number
    orcamentoId: number
    usuarioId: number
    lojaId: number
    dataMovimentacao: number
    observacoes: number
    _all: number
  }


  export type EstoqueMovimentacaoAvgAggregateInputType = {
    quantidade?: true
    quantidadeAnterior?: true
    quantidadePosterior?: true
  }

  export type EstoqueMovimentacaoSumAggregateInputType = {
    quantidade?: true
    quantidadeAnterior?: true
    quantidadePosterior?: true
  }

  export type EstoqueMovimentacaoMinAggregateInputType = {
    id?: true
    estoqueId?: true
    tipo?: true
    quantidade?: true
    quantidadeAnterior?: true
    quantidadePosterior?: true
    documentoRef?: true
    orcamentoId?: true
    usuarioId?: true
    lojaId?: true
    dataMovimentacao?: true
    observacoes?: true
  }

  export type EstoqueMovimentacaoMaxAggregateInputType = {
    id?: true
    estoqueId?: true
    tipo?: true
    quantidade?: true
    quantidadeAnterior?: true
    quantidadePosterior?: true
    documentoRef?: true
    orcamentoId?: true
    usuarioId?: true
    lojaId?: true
    dataMovimentacao?: true
    observacoes?: true
  }

  export type EstoqueMovimentacaoCountAggregateInputType = {
    id?: true
    estoqueId?: true
    tipo?: true
    quantidade?: true
    quantidadeAnterior?: true
    quantidadePosterior?: true
    documentoRef?: true
    orcamentoId?: true
    usuarioId?: true
    lojaId?: true
    dataMovimentacao?: true
    observacoes?: true
    _all?: true
  }

  export type EstoqueMovimentacaoAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EstoqueMovimentacao to aggregate.
     */
    where?: EstoqueMovimentacaoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueMovimentacaos to fetch.
     */
    orderBy?: EstoqueMovimentacaoOrderByWithRelationInput | EstoqueMovimentacaoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EstoqueMovimentacaoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueMovimentacaos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueMovimentacaos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EstoqueMovimentacaos
    **/
    _count?: true | EstoqueMovimentacaoCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EstoqueMovimentacaoAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EstoqueMovimentacaoSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EstoqueMovimentacaoMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EstoqueMovimentacaoMaxAggregateInputType
  }

  export type GetEstoqueMovimentacaoAggregateType<T extends EstoqueMovimentacaoAggregateArgs> = {
        [P in keyof T & keyof AggregateEstoqueMovimentacao]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstoqueMovimentacao[P]>
      : GetScalarType<T[P], AggregateEstoqueMovimentacao[P]>
  }




  export type EstoqueMovimentacaoGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EstoqueMovimentacaoWhereInput
    orderBy?: EstoqueMovimentacaoOrderByWithAggregationInput | EstoqueMovimentacaoOrderByWithAggregationInput[]
    by: EstoqueMovimentacaoScalarFieldEnum[] | EstoqueMovimentacaoScalarFieldEnum
    having?: EstoqueMovimentacaoScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EstoqueMovimentacaoCountAggregateInputType | true
    _avg?: EstoqueMovimentacaoAvgAggregateInputType
    _sum?: EstoqueMovimentacaoSumAggregateInputType
    _min?: EstoqueMovimentacaoMinAggregateInputType
    _max?: EstoqueMovimentacaoMaxAggregateInputType
  }

  export type EstoqueMovimentacaoGroupByOutputType = {
    id: string
    estoqueId: string
    tipo: $Enums.TipoMovimentacao
    quantidade: Decimal
    quantidadeAnterior: Decimal
    quantidadePosterior: Decimal
    documentoRef: string | null
    orcamentoId: string | null
    usuarioId: string
    lojaId: string
    dataMovimentacao: Date
    observacoes: string | null
    _count: EstoqueMovimentacaoCountAggregateOutputType | null
    _avg: EstoqueMovimentacaoAvgAggregateOutputType | null
    _sum: EstoqueMovimentacaoSumAggregateOutputType | null
    _min: EstoqueMovimentacaoMinAggregateOutputType | null
    _max: EstoqueMovimentacaoMaxAggregateOutputType | null
  }

  type GetEstoqueMovimentacaoGroupByPayload<T extends EstoqueMovimentacaoGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EstoqueMovimentacaoGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EstoqueMovimentacaoGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EstoqueMovimentacaoGroupByOutputType[P]>
            : GetScalarType<T[P], EstoqueMovimentacaoGroupByOutputType[P]>
        }
      >
    >


  export type EstoqueMovimentacaoSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    estoqueId?: boolean
    tipo?: boolean
    quantidade?: boolean
    quantidadeAnterior?: boolean
    quantidadePosterior?: boolean
    documentoRef?: boolean
    orcamentoId?: boolean
    usuarioId?: boolean
    lojaId?: boolean
    dataMovimentacao?: boolean
    observacoes?: boolean
    estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["estoqueMovimentacao"]>



  export type EstoqueMovimentacaoSelectScalar = {
    id?: boolean
    estoqueId?: boolean
    tipo?: boolean
    quantidade?: boolean
    quantidadeAnterior?: boolean
    quantidadePosterior?: boolean
    documentoRef?: boolean
    orcamentoId?: boolean
    usuarioId?: boolean
    lojaId?: boolean
    dataMovimentacao?: boolean
    observacoes?: boolean
  }

  export type EstoqueMovimentacaoOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "estoqueId" | "tipo" | "quantidade" | "quantidadeAnterior" | "quantidadePosterior" | "documentoRef" | "orcamentoId" | "usuarioId" | "lojaId" | "dataMovimentacao" | "observacoes", ExtArgs["result"]["estoqueMovimentacao"]>
  export type EstoqueMovimentacaoInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>
  }

  export type $EstoqueMovimentacaoPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EstoqueMovimentacao"
    objects: {
      estoque: Prisma.$EstoqueItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      estoqueId: string
      tipo: $Enums.TipoMovimentacao
      quantidade: Prisma.Decimal
      quantidadeAnterior: Prisma.Decimal
      quantidadePosterior: Prisma.Decimal
      documentoRef: string | null
      orcamentoId: string | null
      usuarioId: string
      lojaId: string
      dataMovimentacao: Date
      observacoes: string | null
    }, ExtArgs["result"]["estoqueMovimentacao"]>
    composites: {}
  }

  type EstoqueMovimentacaoGetPayload<S extends boolean | null | undefined | EstoqueMovimentacaoDefaultArgs> = $Result.GetResult<Prisma.$EstoqueMovimentacaoPayload, S>

  type EstoqueMovimentacaoCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EstoqueMovimentacaoFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EstoqueMovimentacaoCountAggregateInputType | true
    }

  export interface EstoqueMovimentacaoDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EstoqueMovimentacao'], meta: { name: 'EstoqueMovimentacao' } }
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
    findUnique<T extends EstoqueMovimentacaoFindUniqueArgs>(args: SelectSubset<T, EstoqueMovimentacaoFindUniqueArgs<ExtArgs>>): Prisma__EstoqueMovimentacaoClient<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findUniqueOrThrow<T extends EstoqueMovimentacaoFindUniqueOrThrowArgs>(args: SelectSubset<T, EstoqueMovimentacaoFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EstoqueMovimentacaoClient<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findFirst<T extends EstoqueMovimentacaoFindFirstArgs>(args?: SelectSubset<T, EstoqueMovimentacaoFindFirstArgs<ExtArgs>>): Prisma__EstoqueMovimentacaoClient<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findFirstOrThrow<T extends EstoqueMovimentacaoFindFirstOrThrowArgs>(args?: SelectSubset<T, EstoqueMovimentacaoFindFirstOrThrowArgs<ExtArgs>>): Prisma__EstoqueMovimentacaoClient<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findMany<T extends EstoqueMovimentacaoFindManyArgs>(args?: SelectSubset<T, EstoqueMovimentacaoFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

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
    create<T extends EstoqueMovimentacaoCreateArgs>(args: SelectSubset<T, EstoqueMovimentacaoCreateArgs<ExtArgs>>): Prisma__EstoqueMovimentacaoClient<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    createMany<T extends EstoqueMovimentacaoCreateManyArgs>(args?: SelectSubset<T, EstoqueMovimentacaoCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    delete<T extends EstoqueMovimentacaoDeleteArgs>(args: SelectSubset<T, EstoqueMovimentacaoDeleteArgs<ExtArgs>>): Prisma__EstoqueMovimentacaoClient<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    update<T extends EstoqueMovimentacaoUpdateArgs>(args: SelectSubset<T, EstoqueMovimentacaoUpdateArgs<ExtArgs>>): Prisma__EstoqueMovimentacaoClient<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    deleteMany<T extends EstoqueMovimentacaoDeleteManyArgs>(args?: SelectSubset<T, EstoqueMovimentacaoDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    updateMany<T extends EstoqueMovimentacaoUpdateManyArgs>(args: SelectSubset<T, EstoqueMovimentacaoUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    upsert<T extends EstoqueMovimentacaoUpsertArgs>(args: SelectSubset<T, EstoqueMovimentacaoUpsertArgs<ExtArgs>>): Prisma__EstoqueMovimentacaoClient<$Result.GetResult<Prisma.$EstoqueMovimentacaoPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


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
          : GetScalarType<T['select'], EstoqueMovimentacaoCountAggregateOutputType>
        : number
    >

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
    aggregate<T extends EstoqueMovimentacaoAggregateArgs>(args: Subset<T, EstoqueMovimentacaoAggregateArgs>): Prisma.PrismaPromise<GetEstoqueMovimentacaoAggregateType<T>>

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
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
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
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EstoqueMovimentacaoGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEstoqueMovimentacaoGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
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
  export interface Prisma__EstoqueMovimentacaoClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    estoque<T extends EstoqueItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EstoqueItemDefaultArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EstoqueMovimentacao model
   */
  interface EstoqueMovimentacaoFieldRefs {
    readonly id: FieldRef<"EstoqueMovimentacao", 'String'>
    readonly estoqueId: FieldRef<"EstoqueMovimentacao", 'String'>
    readonly tipo: FieldRef<"EstoqueMovimentacao", 'TipoMovimentacao'>
    readonly quantidade: FieldRef<"EstoqueMovimentacao", 'Decimal'>
    readonly quantidadeAnterior: FieldRef<"EstoqueMovimentacao", 'Decimal'>
    readonly quantidadePosterior: FieldRef<"EstoqueMovimentacao", 'Decimal'>
    readonly documentoRef: FieldRef<"EstoqueMovimentacao", 'String'>
    readonly orcamentoId: FieldRef<"EstoqueMovimentacao", 'String'>
    readonly usuarioId: FieldRef<"EstoqueMovimentacao", 'String'>
    readonly lojaId: FieldRef<"EstoqueMovimentacao", 'String'>
    readonly dataMovimentacao: FieldRef<"EstoqueMovimentacao", 'DateTime'>
    readonly observacoes: FieldRef<"EstoqueMovimentacao", 'String'>
  }
    

  // Custom InputTypes
  /**
   * EstoqueMovimentacao findUnique
   */
  export type EstoqueMovimentacaoFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueMovimentacao to fetch.
     */
    where: EstoqueMovimentacaoWhereUniqueInput
  }

  /**
   * EstoqueMovimentacao findUniqueOrThrow
   */
  export type EstoqueMovimentacaoFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueMovimentacao to fetch.
     */
    where: EstoqueMovimentacaoWhereUniqueInput
  }

  /**
   * EstoqueMovimentacao findFirst
   */
  export type EstoqueMovimentacaoFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueMovimentacao to fetch.
     */
    where?: EstoqueMovimentacaoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueMovimentacaos to fetch.
     */
    orderBy?: EstoqueMovimentacaoOrderByWithRelationInput | EstoqueMovimentacaoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EstoqueMovimentacaos.
     */
    cursor?: EstoqueMovimentacaoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueMovimentacaos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueMovimentacaos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EstoqueMovimentacaos.
     */
    distinct?: EstoqueMovimentacaoScalarFieldEnum | EstoqueMovimentacaoScalarFieldEnum[]
  }

  /**
   * EstoqueMovimentacao findFirstOrThrow
   */
  export type EstoqueMovimentacaoFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueMovimentacao to fetch.
     */
    where?: EstoqueMovimentacaoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueMovimentacaos to fetch.
     */
    orderBy?: EstoqueMovimentacaoOrderByWithRelationInput | EstoqueMovimentacaoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EstoqueMovimentacaos.
     */
    cursor?: EstoqueMovimentacaoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueMovimentacaos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueMovimentacaos.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EstoqueMovimentacaos.
     */
    distinct?: EstoqueMovimentacaoScalarFieldEnum | EstoqueMovimentacaoScalarFieldEnum[]
  }

  /**
   * EstoqueMovimentacao findMany
   */
  export type EstoqueMovimentacaoFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueMovimentacaos to fetch.
     */
    where?: EstoqueMovimentacaoWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueMovimentacaos to fetch.
     */
    orderBy?: EstoqueMovimentacaoOrderByWithRelationInput | EstoqueMovimentacaoOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EstoqueMovimentacaos.
     */
    cursor?: EstoqueMovimentacaoWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueMovimentacaos from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueMovimentacaos.
     */
    skip?: number
    distinct?: EstoqueMovimentacaoScalarFieldEnum | EstoqueMovimentacaoScalarFieldEnum[]
  }

  /**
   * EstoqueMovimentacao create
   */
  export type EstoqueMovimentacaoCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * The data needed to create a EstoqueMovimentacao.
     */
    data: XOR<EstoqueMovimentacaoCreateInput, EstoqueMovimentacaoUncheckedCreateInput>
  }

  /**
   * EstoqueMovimentacao createMany
   */
  export type EstoqueMovimentacaoCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EstoqueMovimentacaos.
     */
    data: EstoqueMovimentacaoCreateManyInput | EstoqueMovimentacaoCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EstoqueMovimentacao update
   */
  export type EstoqueMovimentacaoUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * The data needed to update a EstoqueMovimentacao.
     */
    data: XOR<EstoqueMovimentacaoUpdateInput, EstoqueMovimentacaoUncheckedUpdateInput>
    /**
     * Choose, which EstoqueMovimentacao to update.
     */
    where: EstoqueMovimentacaoWhereUniqueInput
  }

  /**
   * EstoqueMovimentacao updateMany
   */
  export type EstoqueMovimentacaoUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EstoqueMovimentacaos.
     */
    data: XOR<EstoqueMovimentacaoUpdateManyMutationInput, EstoqueMovimentacaoUncheckedUpdateManyInput>
    /**
     * Filter which EstoqueMovimentacaos to update
     */
    where?: EstoqueMovimentacaoWhereInput
    /**
     * Limit how many EstoqueMovimentacaos to update.
     */
    limit?: number
  }

  /**
   * EstoqueMovimentacao upsert
   */
  export type EstoqueMovimentacaoUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * The filter to search for the EstoqueMovimentacao to update in case it exists.
     */
    where: EstoqueMovimentacaoWhereUniqueInput
    /**
     * In case the EstoqueMovimentacao found by the `where` argument doesn't exist, create a new EstoqueMovimentacao with this data.
     */
    create: XOR<EstoqueMovimentacaoCreateInput, EstoqueMovimentacaoUncheckedCreateInput>
    /**
     * In case the EstoqueMovimentacao was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EstoqueMovimentacaoUpdateInput, EstoqueMovimentacaoUncheckedUpdateInput>
  }

  /**
   * EstoqueMovimentacao delete
   */
  export type EstoqueMovimentacaoDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
    /**
     * Filter which EstoqueMovimentacao to delete.
     */
    where: EstoqueMovimentacaoWhereUniqueInput
  }

  /**
   * EstoqueMovimentacao deleteMany
   */
  export type EstoqueMovimentacaoDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EstoqueMovimentacaos to delete
     */
    where?: EstoqueMovimentacaoWhereInput
    /**
     * Limit how many EstoqueMovimentacaos to delete.
     */
    limit?: number
  }

  /**
   * EstoqueMovimentacao without action
   */
  export type EstoqueMovimentacaoDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueMovimentacao
     */
    select?: EstoqueMovimentacaoSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueMovimentacao
     */
    omit?: EstoqueMovimentacaoOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueMovimentacaoInclude<ExtArgs> | null
  }


  /**
   * Model EstoqueLote
   */

  export type AggregateEstoqueLote = {
    _count: EstoqueLoteCountAggregateOutputType | null
    _avg: EstoqueLoteAvgAggregateOutputType | null
    _sum: EstoqueLoteSumAggregateOutputType | null
    _min: EstoqueLoteMinAggregateOutputType | null
    _max: EstoqueLoteMaxAggregateOutputType | null
  }

  export type EstoqueLoteAvgAggregateOutputType = {
    quantidadeLote: Decimal | null
  }

  export type EstoqueLoteSumAggregateOutputType = {
    quantidadeLote: Decimal | null
  }

  export type EstoqueLoteMinAggregateOutputType = {
    id: string | null
    estoqueId: string | null
    numeroLote: string | null
    dataFabricacao: Date | null
    dataValidade: Date | null
    quantidadeLote: Decimal | null
    status: $Enums.StatusLote | null
    lojaId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EstoqueLoteMaxAggregateOutputType = {
    id: string | null
    estoqueId: string | null
    numeroLote: string | null
    dataFabricacao: Date | null
    dataValidade: Date | null
    quantidadeLote: Decimal | null
    status: $Enums.StatusLote | null
    lojaId: string | null
    createdAt: Date | null
    updatedAt: Date | null
  }

  export type EstoqueLoteCountAggregateOutputType = {
    id: number
    estoqueId: number
    numeroLote: number
    dataFabricacao: number
    dataValidade: number
    quantidadeLote: number
    status: number
    lojaId: number
    createdAt: number
    updatedAt: number
    _all: number
  }


  export type EstoqueLoteAvgAggregateInputType = {
    quantidadeLote?: true
  }

  export type EstoqueLoteSumAggregateInputType = {
    quantidadeLote?: true
  }

  export type EstoqueLoteMinAggregateInputType = {
    id?: true
    estoqueId?: true
    numeroLote?: true
    dataFabricacao?: true
    dataValidade?: true
    quantidadeLote?: true
    status?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EstoqueLoteMaxAggregateInputType = {
    id?: true
    estoqueId?: true
    numeroLote?: true
    dataFabricacao?: true
    dataValidade?: true
    quantidadeLote?: true
    status?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
  }

  export type EstoqueLoteCountAggregateInputType = {
    id?: true
    estoqueId?: true
    numeroLote?: true
    dataFabricacao?: true
    dataValidade?: true
    quantidadeLote?: true
    status?: true
    lojaId?: true
    createdAt?: true
    updatedAt?: true
    _all?: true
  }

  export type EstoqueLoteAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EstoqueLote to aggregate.
     */
    where?: EstoqueLoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueLotes to fetch.
     */
    orderBy?: EstoqueLoteOrderByWithRelationInput | EstoqueLoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: EstoqueLoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueLotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueLotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned EstoqueLotes
    **/
    _count?: true | EstoqueLoteCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: EstoqueLoteAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: EstoqueLoteSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: EstoqueLoteMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: EstoqueLoteMaxAggregateInputType
  }

  export type GetEstoqueLoteAggregateType<T extends EstoqueLoteAggregateArgs> = {
        [P in keyof T & keyof AggregateEstoqueLote]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateEstoqueLote[P]>
      : GetScalarType<T[P], AggregateEstoqueLote[P]>
  }




  export type EstoqueLoteGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: EstoqueLoteWhereInput
    orderBy?: EstoqueLoteOrderByWithAggregationInput | EstoqueLoteOrderByWithAggregationInput[]
    by: EstoqueLoteScalarFieldEnum[] | EstoqueLoteScalarFieldEnum
    having?: EstoqueLoteScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: EstoqueLoteCountAggregateInputType | true
    _avg?: EstoqueLoteAvgAggregateInputType
    _sum?: EstoqueLoteSumAggregateInputType
    _min?: EstoqueLoteMinAggregateInputType
    _max?: EstoqueLoteMaxAggregateInputType
  }

  export type EstoqueLoteGroupByOutputType = {
    id: string
    estoqueId: string
    numeroLote: string
    dataFabricacao: Date | null
    dataValidade: Date | null
    quantidadeLote: Decimal
    status: $Enums.StatusLote
    lojaId: string
    createdAt: Date
    updatedAt: Date
    _count: EstoqueLoteCountAggregateOutputType | null
    _avg: EstoqueLoteAvgAggregateOutputType | null
    _sum: EstoqueLoteSumAggregateOutputType | null
    _min: EstoqueLoteMinAggregateOutputType | null
    _max: EstoqueLoteMaxAggregateOutputType | null
  }

  type GetEstoqueLoteGroupByPayload<T extends EstoqueLoteGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<EstoqueLoteGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof EstoqueLoteGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], EstoqueLoteGroupByOutputType[P]>
            : GetScalarType<T[P], EstoqueLoteGroupByOutputType[P]>
        }
      >
    >


  export type EstoqueLoteSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    estoqueId?: boolean
    numeroLote?: boolean
    dataFabricacao?: boolean
    dataValidade?: boolean
    quantidadeLote?: boolean
    status?: boolean
    lojaId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
    estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["estoqueLote"]>



  export type EstoqueLoteSelectScalar = {
    id?: boolean
    estoqueId?: boolean
    numeroLote?: boolean
    dataFabricacao?: boolean
    dataValidade?: boolean
    quantidadeLote?: boolean
    status?: boolean
    lojaId?: boolean
    createdAt?: boolean
    updatedAt?: boolean
  }

  export type EstoqueLoteOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "estoqueId" | "numeroLote" | "dataFabricacao" | "dataValidade" | "quantidadeLote" | "status" | "lojaId" | "createdAt" | "updatedAt", ExtArgs["result"]["estoqueLote"]>
  export type EstoqueLoteInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    estoque?: boolean | EstoqueItemDefaultArgs<ExtArgs>
  }

  export type $EstoqueLotePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "EstoqueLote"
    objects: {
      estoque: Prisma.$EstoqueItemPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: string
      estoqueId: string
      numeroLote: string
      dataFabricacao: Date | null
      dataValidade: Date | null
      quantidadeLote: Prisma.Decimal
      status: $Enums.StatusLote
      lojaId: string
      createdAt: Date
      updatedAt: Date
    }, ExtArgs["result"]["estoqueLote"]>
    composites: {}
  }

  type EstoqueLoteGetPayload<S extends boolean | null | undefined | EstoqueLoteDefaultArgs> = $Result.GetResult<Prisma.$EstoqueLotePayload, S>

  type EstoqueLoteCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<EstoqueLoteFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: EstoqueLoteCountAggregateInputType | true
    }

  export interface EstoqueLoteDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['EstoqueLote'], meta: { name: 'EstoqueLote' } }
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
    findUnique<T extends EstoqueLoteFindUniqueArgs>(args: SelectSubset<T, EstoqueLoteFindUniqueArgs<ExtArgs>>): Prisma__EstoqueLoteClient<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findUniqueOrThrow<T extends EstoqueLoteFindUniqueOrThrowArgs>(args: SelectSubset<T, EstoqueLoteFindUniqueOrThrowArgs<ExtArgs>>): Prisma__EstoqueLoteClient<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findFirst<T extends EstoqueLoteFindFirstArgs>(args?: SelectSubset<T, EstoqueLoteFindFirstArgs<ExtArgs>>): Prisma__EstoqueLoteClient<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

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
    findFirstOrThrow<T extends EstoqueLoteFindFirstOrThrowArgs>(args?: SelectSubset<T, EstoqueLoteFindFirstOrThrowArgs<ExtArgs>>): Prisma__EstoqueLoteClient<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    findMany<T extends EstoqueLoteFindManyArgs>(args?: SelectSubset<T, EstoqueLoteFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

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
    create<T extends EstoqueLoteCreateArgs>(args: SelectSubset<T, EstoqueLoteCreateArgs<ExtArgs>>): Prisma__EstoqueLoteClient<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    createMany<T extends EstoqueLoteCreateManyArgs>(args?: SelectSubset<T, EstoqueLoteCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    delete<T extends EstoqueLoteDeleteArgs>(args: SelectSubset<T, EstoqueLoteDeleteArgs<ExtArgs>>): Prisma__EstoqueLoteClient<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    update<T extends EstoqueLoteUpdateArgs>(args: SelectSubset<T, EstoqueLoteUpdateArgs<ExtArgs>>): Prisma__EstoqueLoteClient<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

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
    deleteMany<T extends EstoqueLoteDeleteManyArgs>(args?: SelectSubset<T, EstoqueLoteDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    updateMany<T extends EstoqueLoteUpdateManyArgs>(args: SelectSubset<T, EstoqueLoteUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

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
    upsert<T extends EstoqueLoteUpsertArgs>(args: SelectSubset<T, EstoqueLoteUpsertArgs<ExtArgs>>): Prisma__EstoqueLoteClient<$Result.GetResult<Prisma.$EstoqueLotePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


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
    >

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
    aggregate<T extends EstoqueLoteAggregateArgs>(args: Subset<T, EstoqueLoteAggregateArgs>): Prisma.PrismaPromise<GetEstoqueLoteAggregateType<T>>

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
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
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
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, EstoqueLoteGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetEstoqueLoteGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
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
  export interface Prisma__EstoqueLoteClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    estoque<T extends EstoqueItemDefaultArgs<ExtArgs> = {}>(args?: Subset<T, EstoqueItemDefaultArgs<ExtArgs>>): Prisma__EstoqueItemClient<$Result.GetResult<Prisma.$EstoqueItemPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the EstoqueLote model
   */
  interface EstoqueLoteFieldRefs {
    readonly id: FieldRef<"EstoqueLote", 'String'>
    readonly estoqueId: FieldRef<"EstoqueLote", 'String'>
    readonly numeroLote: FieldRef<"EstoqueLote", 'String'>
    readonly dataFabricacao: FieldRef<"EstoqueLote", 'DateTime'>
    readonly dataValidade: FieldRef<"EstoqueLote", 'DateTime'>
    readonly quantidadeLote: FieldRef<"EstoqueLote", 'Decimal'>
    readonly status: FieldRef<"EstoqueLote", 'StatusLote'>
    readonly lojaId: FieldRef<"EstoqueLote", 'String'>
    readonly createdAt: FieldRef<"EstoqueLote", 'DateTime'>
    readonly updatedAt: FieldRef<"EstoqueLote", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * EstoqueLote findUnique
   */
  export type EstoqueLoteFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLote to fetch.
     */
    where: EstoqueLoteWhereUniqueInput
  }

  /**
   * EstoqueLote findUniqueOrThrow
   */
  export type EstoqueLoteFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLote to fetch.
     */
    where: EstoqueLoteWhereUniqueInput
  }

  /**
   * EstoqueLote findFirst
   */
  export type EstoqueLoteFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLote to fetch.
     */
    where?: EstoqueLoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueLotes to fetch.
     */
    orderBy?: EstoqueLoteOrderByWithRelationInput | EstoqueLoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EstoqueLotes.
     */
    cursor?: EstoqueLoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueLotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueLotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EstoqueLotes.
     */
    distinct?: EstoqueLoteScalarFieldEnum | EstoqueLoteScalarFieldEnum[]
  }

  /**
   * EstoqueLote findFirstOrThrow
   */
  export type EstoqueLoteFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLote to fetch.
     */
    where?: EstoqueLoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueLotes to fetch.
     */
    orderBy?: EstoqueLoteOrderByWithRelationInput | EstoqueLoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for EstoqueLotes.
     */
    cursor?: EstoqueLoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueLotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueLotes.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of EstoqueLotes.
     */
    distinct?: EstoqueLoteScalarFieldEnum | EstoqueLoteScalarFieldEnum[]
  }

  /**
   * EstoqueLote findMany
   */
  export type EstoqueLoteFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * Filter, which EstoqueLotes to fetch.
     */
    where?: EstoqueLoteWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of EstoqueLotes to fetch.
     */
    orderBy?: EstoqueLoteOrderByWithRelationInput | EstoqueLoteOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing EstoqueLotes.
     */
    cursor?: EstoqueLoteWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` EstoqueLotes from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` EstoqueLotes.
     */
    skip?: number
    distinct?: EstoqueLoteScalarFieldEnum | EstoqueLoteScalarFieldEnum[]
  }

  /**
   * EstoqueLote create
   */
  export type EstoqueLoteCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * The data needed to create a EstoqueLote.
     */
    data: XOR<EstoqueLoteCreateInput, EstoqueLoteUncheckedCreateInput>
  }

  /**
   * EstoqueLote createMany
   */
  export type EstoqueLoteCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many EstoqueLotes.
     */
    data: EstoqueLoteCreateManyInput | EstoqueLoteCreateManyInput[]
    skipDuplicates?: boolean
  }

  /**
   * EstoqueLote update
   */
  export type EstoqueLoteUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * The data needed to update a EstoqueLote.
     */
    data: XOR<EstoqueLoteUpdateInput, EstoqueLoteUncheckedUpdateInput>
    /**
     * Choose, which EstoqueLote to update.
     */
    where: EstoqueLoteWhereUniqueInput
  }

  /**
   * EstoqueLote updateMany
   */
  export type EstoqueLoteUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update EstoqueLotes.
     */
    data: XOR<EstoqueLoteUpdateManyMutationInput, EstoqueLoteUncheckedUpdateManyInput>
    /**
     * Filter which EstoqueLotes to update
     */
    where?: EstoqueLoteWhereInput
    /**
     * Limit how many EstoqueLotes to update.
     */
    limit?: number
  }

  /**
   * EstoqueLote upsert
   */
  export type EstoqueLoteUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * The filter to search for the EstoqueLote to update in case it exists.
     */
    where: EstoqueLoteWhereUniqueInput
    /**
     * In case the EstoqueLote found by the `where` argument doesn't exist, create a new EstoqueLote with this data.
     */
    create: XOR<EstoqueLoteCreateInput, EstoqueLoteUncheckedCreateInput>
    /**
     * In case the EstoqueLote was found with the provided `where` argument, update it with this data.
     */
    update: XOR<EstoqueLoteUpdateInput, EstoqueLoteUncheckedUpdateInput>
  }

  /**
   * EstoqueLote delete
   */
  export type EstoqueLoteDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
    /**
     * Filter which EstoqueLote to delete.
     */
    where: EstoqueLoteWhereUniqueInput
  }

  /**
   * EstoqueLote deleteMany
   */
  export type EstoqueLoteDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which EstoqueLotes to delete
     */
    where?: EstoqueLoteWhereInput
    /**
     * Limit how many EstoqueLotes to delete.
     */
    limit?: number
  }

  /**
   * EstoqueLote without action
   */
  export type EstoqueLoteDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the EstoqueLote
     */
    select?: EstoqueLoteSelect<ExtArgs> | null
    /**
     * Omit specific fields from the EstoqueLote
     */
    omit?: EstoqueLoteOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: EstoqueLoteInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    ReadUncommitted: 'ReadUncommitted',
    ReadCommitted: 'ReadCommitted',
    RepeatableRead: 'RepeatableRead',
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const EstoqueLocalizacaoScalarFieldEnum: {
    id: 'id',
    codigo: 'codigo',
    deposito: 'deposito',
    corredor: 'corredor',
    prateleira: 'prateleira',
    nivel: 'nivel',
    posicao: 'posicao',
    descricao: 'descricao',
    capacidade: 'capacidade',
    ativo: 'ativo',
    lojaId: 'lojaId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EstoqueLocalizacaoScalarFieldEnum = (typeof EstoqueLocalizacaoScalarFieldEnum)[keyof typeof EstoqueLocalizacaoScalarFieldEnum]


  export const EstoqueItemScalarFieldEnum: {
    id: 'id',
    insumoId: 'insumoId',
    localizacaoId: 'localizacaoId',
    quantidadeAtual: 'quantidadeAtual',
    quantidadeReservada: 'quantidadeReservada',
    estoqueMinimo: 'estoqueMinimo',
    estoqueMaximo: 'estoqueMaximo',
    lojaId: 'lojaId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
    dataUltimaMov: 'dataUltimaMov'
  };

  export type EstoqueItemScalarFieldEnum = (typeof EstoqueItemScalarFieldEnum)[keyof typeof EstoqueItemScalarFieldEnum]


  export const EstoqueMovimentacaoScalarFieldEnum: {
    id: 'id',
    estoqueId: 'estoqueId',
    tipo: 'tipo',
    quantidade: 'quantidade',
    quantidadeAnterior: 'quantidadeAnterior',
    quantidadePosterior: 'quantidadePosterior',
    documentoRef: 'documentoRef',
    orcamentoId: 'orcamentoId',
    usuarioId: 'usuarioId',
    lojaId: 'lojaId',
    dataMovimentacao: 'dataMovimentacao',
    observacoes: 'observacoes'
  };

  export type EstoqueMovimentacaoScalarFieldEnum = (typeof EstoqueMovimentacaoScalarFieldEnum)[keyof typeof EstoqueMovimentacaoScalarFieldEnum]


  export const EstoqueLoteScalarFieldEnum: {
    id: 'id',
    estoqueId: 'estoqueId',
    numeroLote: 'numeroLote',
    dataFabricacao: 'dataFabricacao',
    dataValidade: 'dataValidade',
    quantidadeLote: 'quantidadeLote',
    status: 'status',
    lojaId: 'lojaId',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt'
  };

  export type EstoqueLoteScalarFieldEnum = (typeof EstoqueLoteScalarFieldEnum)[keyof typeof EstoqueLoteScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  export const EstoqueLocalizacaoOrderByRelevanceFieldEnum: {
    id: 'id',
    codigo: 'codigo',
    deposito: 'deposito',
    corredor: 'corredor',
    prateleira: 'prateleira',
    nivel: 'nivel',
    posicao: 'posicao',
    descricao: 'descricao',
    lojaId: 'lojaId'
  };

  export type EstoqueLocalizacaoOrderByRelevanceFieldEnum = (typeof EstoqueLocalizacaoOrderByRelevanceFieldEnum)[keyof typeof EstoqueLocalizacaoOrderByRelevanceFieldEnum]


  export const EstoqueItemOrderByRelevanceFieldEnum: {
    id: 'id',
    insumoId: 'insumoId',
    localizacaoId: 'localizacaoId',
    lojaId: 'lojaId'
  };

  export type EstoqueItemOrderByRelevanceFieldEnum = (typeof EstoqueItemOrderByRelevanceFieldEnum)[keyof typeof EstoqueItemOrderByRelevanceFieldEnum]


  export const EstoqueMovimentacaoOrderByRelevanceFieldEnum: {
    id: 'id',
    estoqueId: 'estoqueId',
    documentoRef: 'documentoRef',
    orcamentoId: 'orcamentoId',
    usuarioId: 'usuarioId',
    lojaId: 'lojaId',
    observacoes: 'observacoes'
  };

  export type EstoqueMovimentacaoOrderByRelevanceFieldEnum = (typeof EstoqueMovimentacaoOrderByRelevanceFieldEnum)[keyof typeof EstoqueMovimentacaoOrderByRelevanceFieldEnum]


  export const EstoqueLoteOrderByRelevanceFieldEnum: {
    id: 'id',
    estoqueId: 'estoqueId',
    numeroLote: 'numeroLote',
    lojaId: 'lojaId'
  };

  export type EstoqueLoteOrderByRelevanceFieldEnum = (typeof EstoqueLoteOrderByRelevanceFieldEnum)[keyof typeof EstoqueLoteOrderByRelevanceFieldEnum]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'Decimal'
   */
  export type DecimalFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Decimal'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'TipoMovimentacao'
   */
  export type EnumTipoMovimentacaoFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'TipoMovimentacao'>
    


  /**
   * Reference to a field of type 'StatusLote'
   */
  export type EnumStatusLoteFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'StatusLote'>
    


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    
  /**
   * Deep Input Types
   */


  export type EstoqueLocalizacaoWhereInput = {
    AND?: EstoqueLocalizacaoWhereInput | EstoqueLocalizacaoWhereInput[]
    OR?: EstoqueLocalizacaoWhereInput[]
    NOT?: EstoqueLocalizacaoWhereInput | EstoqueLocalizacaoWhereInput[]
    id?: StringFilter<"EstoqueLocalizacao"> | string
    codigo?: StringFilter<"EstoqueLocalizacao"> | string
    deposito?: StringFilter<"EstoqueLocalizacao"> | string
    corredor?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    prateleira?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    nivel?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    posicao?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    descricao?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    capacidade?: DecimalNullableFilter<"EstoqueLocalizacao"> | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolFilter<"EstoqueLocalizacao"> | boolean
    lojaId?: StringFilter<"EstoqueLocalizacao"> | string
    createdAt?: DateTimeFilter<"EstoqueLocalizacao"> | Date | string
    updatedAt?: DateTimeFilter<"EstoqueLocalizacao"> | Date | string
    estoques?: EstoqueItemListRelationFilter
  }

  export type EstoqueLocalizacaoOrderByWithRelationInput = {
    id?: SortOrder
    codigo?: SortOrder
    deposito?: SortOrder
    corredor?: SortOrderInput | SortOrder
    prateleira?: SortOrderInput | SortOrder
    nivel?: SortOrderInput | SortOrder
    posicao?: SortOrderInput | SortOrder
    descricao?: SortOrderInput | SortOrder
    capacidade?: SortOrderInput | SortOrder
    ativo?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    estoques?: EstoqueItemOrderByRelationAggregateInput
    _relevance?: EstoqueLocalizacaoOrderByRelevanceInput
  }

  export type EstoqueLocalizacaoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    codigo?: string
    AND?: EstoqueLocalizacaoWhereInput | EstoqueLocalizacaoWhereInput[]
    OR?: EstoqueLocalizacaoWhereInput[]
    NOT?: EstoqueLocalizacaoWhereInput | EstoqueLocalizacaoWhereInput[]
    deposito?: StringFilter<"EstoqueLocalizacao"> | string
    corredor?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    prateleira?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    nivel?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    posicao?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    descricao?: StringNullableFilter<"EstoqueLocalizacao"> | string | null
    capacidade?: DecimalNullableFilter<"EstoqueLocalizacao"> | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolFilter<"EstoqueLocalizacao"> | boolean
    lojaId?: StringFilter<"EstoqueLocalizacao"> | string
    createdAt?: DateTimeFilter<"EstoqueLocalizacao"> | Date | string
    updatedAt?: DateTimeFilter<"EstoqueLocalizacao"> | Date | string
    estoques?: EstoqueItemListRelationFilter
  }, "id" | "codigo">

  export type EstoqueLocalizacaoOrderByWithAggregationInput = {
    id?: SortOrder
    codigo?: SortOrder
    deposito?: SortOrder
    corredor?: SortOrderInput | SortOrder
    prateleira?: SortOrderInput | SortOrder
    nivel?: SortOrderInput | SortOrder
    posicao?: SortOrderInput | SortOrder
    descricao?: SortOrderInput | SortOrder
    capacidade?: SortOrderInput | SortOrder
    ativo?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EstoqueLocalizacaoCountOrderByAggregateInput
    _avg?: EstoqueLocalizacaoAvgOrderByAggregateInput
    _max?: EstoqueLocalizacaoMaxOrderByAggregateInput
    _min?: EstoqueLocalizacaoMinOrderByAggregateInput
    _sum?: EstoqueLocalizacaoSumOrderByAggregateInput
  }

  export type EstoqueLocalizacaoScalarWhereWithAggregatesInput = {
    AND?: EstoqueLocalizacaoScalarWhereWithAggregatesInput | EstoqueLocalizacaoScalarWhereWithAggregatesInput[]
    OR?: EstoqueLocalizacaoScalarWhereWithAggregatesInput[]
    NOT?: EstoqueLocalizacaoScalarWhereWithAggregatesInput | EstoqueLocalizacaoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EstoqueLocalizacao"> | string
    codigo?: StringWithAggregatesFilter<"EstoqueLocalizacao"> | string
    deposito?: StringWithAggregatesFilter<"EstoqueLocalizacao"> | string
    corredor?: StringNullableWithAggregatesFilter<"EstoqueLocalizacao"> | string | null
    prateleira?: StringNullableWithAggregatesFilter<"EstoqueLocalizacao"> | string | null
    nivel?: StringNullableWithAggregatesFilter<"EstoqueLocalizacao"> | string | null
    posicao?: StringNullableWithAggregatesFilter<"EstoqueLocalizacao"> | string | null
    descricao?: StringNullableWithAggregatesFilter<"EstoqueLocalizacao"> | string | null
    capacidade?: DecimalNullableWithAggregatesFilter<"EstoqueLocalizacao"> | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolWithAggregatesFilter<"EstoqueLocalizacao"> | boolean
    lojaId?: StringWithAggregatesFilter<"EstoqueLocalizacao"> | string
    createdAt?: DateTimeWithAggregatesFilter<"EstoqueLocalizacao"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"EstoqueLocalizacao"> | Date | string
  }

  export type EstoqueItemWhereInput = {
    AND?: EstoqueItemWhereInput | EstoqueItemWhereInput[]
    OR?: EstoqueItemWhereInput[]
    NOT?: EstoqueItemWhereInput | EstoqueItemWhereInput[]
    id?: StringFilter<"EstoqueItem"> | string
    insumoId?: StringFilter<"EstoqueItem"> | string
    localizacaoId?: StringFilter<"EstoqueItem"> | string
    quantidadeAtual?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: DecimalNullableFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFilter<"EstoqueItem"> | string
    createdAt?: DateTimeFilter<"EstoqueItem"> | Date | string
    updatedAt?: DateTimeFilter<"EstoqueItem"> | Date | string
    dataUltimaMov?: DateTimeNullableFilter<"EstoqueItem"> | Date | string | null
    localizacao?: XOR<EstoqueLocalizacaoScalarRelationFilter, EstoqueLocalizacaoWhereInput>
    movimentacoes?: EstoqueMovimentacaoListRelationFilter
    lotes?: EstoqueLoteListRelationFilter
  }

  export type EstoqueItemOrderByWithRelationInput = {
    id?: SortOrder
    insumoId?: SortOrder
    localizacaoId?: SortOrder
    quantidadeAtual?: SortOrder
    quantidadeReservada?: SortOrder
    estoqueMinimo?: SortOrder
    estoqueMaximo?: SortOrderInput | SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dataUltimaMov?: SortOrderInput | SortOrder
    localizacao?: EstoqueLocalizacaoOrderByWithRelationInput
    movimentacoes?: EstoqueMovimentacaoOrderByRelationAggregateInput
    lotes?: EstoqueLoteOrderByRelationAggregateInput
    _relevance?: EstoqueItemOrderByRelevanceInput
  }

  export type EstoqueItemWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    insumoId_localizacaoId_lojaId?: EstoqueItemInsumoIdLocalizacaoIdLojaIdCompoundUniqueInput
    AND?: EstoqueItemWhereInput | EstoqueItemWhereInput[]
    OR?: EstoqueItemWhereInput[]
    NOT?: EstoqueItemWhereInput | EstoqueItemWhereInput[]
    insumoId?: StringFilter<"EstoqueItem"> | string
    localizacaoId?: StringFilter<"EstoqueItem"> | string
    quantidadeAtual?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: DecimalNullableFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFilter<"EstoqueItem"> | string
    createdAt?: DateTimeFilter<"EstoqueItem"> | Date | string
    updatedAt?: DateTimeFilter<"EstoqueItem"> | Date | string
    dataUltimaMov?: DateTimeNullableFilter<"EstoqueItem"> | Date | string | null
    localizacao?: XOR<EstoqueLocalizacaoScalarRelationFilter, EstoqueLocalizacaoWhereInput>
    movimentacoes?: EstoqueMovimentacaoListRelationFilter
    lotes?: EstoqueLoteListRelationFilter
  }, "id" | "insumoId_localizacaoId_lojaId">

  export type EstoqueItemOrderByWithAggregationInput = {
    id?: SortOrder
    insumoId?: SortOrder
    localizacaoId?: SortOrder
    quantidadeAtual?: SortOrder
    quantidadeReservada?: SortOrder
    estoqueMinimo?: SortOrder
    estoqueMaximo?: SortOrderInput | SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dataUltimaMov?: SortOrderInput | SortOrder
    _count?: EstoqueItemCountOrderByAggregateInput
    _avg?: EstoqueItemAvgOrderByAggregateInput
    _max?: EstoqueItemMaxOrderByAggregateInput
    _min?: EstoqueItemMinOrderByAggregateInput
    _sum?: EstoqueItemSumOrderByAggregateInput
  }

  export type EstoqueItemScalarWhereWithAggregatesInput = {
    AND?: EstoqueItemScalarWhereWithAggregatesInput | EstoqueItemScalarWhereWithAggregatesInput[]
    OR?: EstoqueItemScalarWhereWithAggregatesInput[]
    NOT?: EstoqueItemScalarWhereWithAggregatesInput | EstoqueItemScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EstoqueItem"> | string
    insumoId?: StringWithAggregatesFilter<"EstoqueItem"> | string
    localizacaoId?: StringWithAggregatesFilter<"EstoqueItem"> | string
    quantidadeAtual?: DecimalWithAggregatesFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalWithAggregatesFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalWithAggregatesFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: DecimalNullableWithAggregatesFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringWithAggregatesFilter<"EstoqueItem"> | string
    createdAt?: DateTimeWithAggregatesFilter<"EstoqueItem"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"EstoqueItem"> | Date | string
    dataUltimaMov?: DateTimeNullableWithAggregatesFilter<"EstoqueItem"> | Date | string | null
  }

  export type EstoqueMovimentacaoWhereInput = {
    AND?: EstoqueMovimentacaoWhereInput | EstoqueMovimentacaoWhereInput[]
    OR?: EstoqueMovimentacaoWhereInput[]
    NOT?: EstoqueMovimentacaoWhereInput | EstoqueMovimentacaoWhereInput[]
    id?: StringFilter<"EstoqueMovimentacao"> | string
    estoqueId?: StringFilter<"EstoqueMovimentacao"> | string
    tipo?: EnumTipoMovimentacaoFilter<"EstoqueMovimentacao"> | $Enums.TipoMovimentacao
    quantidade?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    documentoRef?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
    orcamentoId?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
    usuarioId?: StringFilter<"EstoqueMovimentacao"> | string
    lojaId?: StringFilter<"EstoqueMovimentacao"> | string
    dataMovimentacao?: DateTimeFilter<"EstoqueMovimentacao"> | Date | string
    observacoes?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
    estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>
  }

  export type EstoqueMovimentacaoOrderByWithRelationInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    tipo?: SortOrder
    quantidade?: SortOrder
    quantidadeAnterior?: SortOrder
    quantidadePosterior?: SortOrder
    documentoRef?: SortOrderInput | SortOrder
    orcamentoId?: SortOrderInput | SortOrder
    usuarioId?: SortOrder
    lojaId?: SortOrder
    dataMovimentacao?: SortOrder
    observacoes?: SortOrderInput | SortOrder
    estoque?: EstoqueItemOrderByWithRelationInput
    _relevance?: EstoqueMovimentacaoOrderByRelevanceInput
  }

  export type EstoqueMovimentacaoWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EstoqueMovimentacaoWhereInput | EstoqueMovimentacaoWhereInput[]
    OR?: EstoqueMovimentacaoWhereInput[]
    NOT?: EstoqueMovimentacaoWhereInput | EstoqueMovimentacaoWhereInput[]
    estoqueId?: StringFilter<"EstoqueMovimentacao"> | string
    tipo?: EnumTipoMovimentacaoFilter<"EstoqueMovimentacao"> | $Enums.TipoMovimentacao
    quantidade?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    documentoRef?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
    orcamentoId?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
    usuarioId?: StringFilter<"EstoqueMovimentacao"> | string
    lojaId?: StringFilter<"EstoqueMovimentacao"> | string
    dataMovimentacao?: DateTimeFilter<"EstoqueMovimentacao"> | Date | string
    observacoes?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
    estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>
  }, "id">

  export type EstoqueMovimentacaoOrderByWithAggregationInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    tipo?: SortOrder
    quantidade?: SortOrder
    quantidadeAnterior?: SortOrder
    quantidadePosterior?: SortOrder
    documentoRef?: SortOrderInput | SortOrder
    orcamentoId?: SortOrderInput | SortOrder
    usuarioId?: SortOrder
    lojaId?: SortOrder
    dataMovimentacao?: SortOrder
    observacoes?: SortOrderInput | SortOrder
    _count?: EstoqueMovimentacaoCountOrderByAggregateInput
    _avg?: EstoqueMovimentacaoAvgOrderByAggregateInput
    _max?: EstoqueMovimentacaoMaxOrderByAggregateInput
    _min?: EstoqueMovimentacaoMinOrderByAggregateInput
    _sum?: EstoqueMovimentacaoSumOrderByAggregateInput
  }

  export type EstoqueMovimentacaoScalarWhereWithAggregatesInput = {
    AND?: EstoqueMovimentacaoScalarWhereWithAggregatesInput | EstoqueMovimentacaoScalarWhereWithAggregatesInput[]
    OR?: EstoqueMovimentacaoScalarWhereWithAggregatesInput[]
    NOT?: EstoqueMovimentacaoScalarWhereWithAggregatesInput | EstoqueMovimentacaoScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EstoqueMovimentacao"> | string
    estoqueId?: StringWithAggregatesFilter<"EstoqueMovimentacao"> | string
    tipo?: EnumTipoMovimentacaoWithAggregatesFilter<"EstoqueMovimentacao"> | $Enums.TipoMovimentacao
    quantidade?: DecimalWithAggregatesFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalWithAggregatesFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalWithAggregatesFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    documentoRef?: StringNullableWithAggregatesFilter<"EstoqueMovimentacao"> | string | null
    orcamentoId?: StringNullableWithAggregatesFilter<"EstoqueMovimentacao"> | string | null
    usuarioId?: StringWithAggregatesFilter<"EstoqueMovimentacao"> | string
    lojaId?: StringWithAggregatesFilter<"EstoqueMovimentacao"> | string
    dataMovimentacao?: DateTimeWithAggregatesFilter<"EstoqueMovimentacao"> | Date | string
    observacoes?: StringNullableWithAggregatesFilter<"EstoqueMovimentacao"> | string | null
  }

  export type EstoqueLoteWhereInput = {
    AND?: EstoqueLoteWhereInput | EstoqueLoteWhereInput[]
    OR?: EstoqueLoteWhereInput[]
    NOT?: EstoqueLoteWhereInput | EstoqueLoteWhereInput[]
    id?: StringFilter<"EstoqueLote"> | string
    estoqueId?: StringFilter<"EstoqueLote"> | string
    numeroLote?: StringFilter<"EstoqueLote"> | string
    dataFabricacao?: DateTimeNullableFilter<"EstoqueLote"> | Date | string | null
    dataValidade?: DateTimeNullableFilter<"EstoqueLote"> | Date | string | null
    quantidadeLote?: DecimalFilter<"EstoqueLote"> | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFilter<"EstoqueLote"> | $Enums.StatusLote
    lojaId?: StringFilter<"EstoqueLote"> | string
    createdAt?: DateTimeFilter<"EstoqueLote"> | Date | string
    updatedAt?: DateTimeFilter<"EstoqueLote"> | Date | string
    estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>
  }

  export type EstoqueLoteOrderByWithRelationInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    numeroLote?: SortOrder
    dataFabricacao?: SortOrderInput | SortOrder
    dataValidade?: SortOrderInput | SortOrder
    quantidadeLote?: SortOrder
    status?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    estoque?: EstoqueItemOrderByWithRelationInput
    _relevance?: EstoqueLoteOrderByRelevanceInput
  }

  export type EstoqueLoteWhereUniqueInput = Prisma.AtLeast<{
    id?: string
    AND?: EstoqueLoteWhereInput | EstoqueLoteWhereInput[]
    OR?: EstoqueLoteWhereInput[]
    NOT?: EstoqueLoteWhereInput | EstoqueLoteWhereInput[]
    estoqueId?: StringFilter<"EstoqueLote"> | string
    numeroLote?: StringFilter<"EstoqueLote"> | string
    dataFabricacao?: DateTimeNullableFilter<"EstoqueLote"> | Date | string | null
    dataValidade?: DateTimeNullableFilter<"EstoqueLote"> | Date | string | null
    quantidadeLote?: DecimalFilter<"EstoqueLote"> | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFilter<"EstoqueLote"> | $Enums.StatusLote
    lojaId?: StringFilter<"EstoqueLote"> | string
    createdAt?: DateTimeFilter<"EstoqueLote"> | Date | string
    updatedAt?: DateTimeFilter<"EstoqueLote"> | Date | string
    estoque?: XOR<EstoqueItemScalarRelationFilter, EstoqueItemWhereInput>
  }, "id">

  export type EstoqueLoteOrderByWithAggregationInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    numeroLote?: SortOrder
    dataFabricacao?: SortOrderInput | SortOrder
    dataValidade?: SortOrderInput | SortOrder
    quantidadeLote?: SortOrder
    status?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    _count?: EstoqueLoteCountOrderByAggregateInput
    _avg?: EstoqueLoteAvgOrderByAggregateInput
    _max?: EstoqueLoteMaxOrderByAggregateInput
    _min?: EstoqueLoteMinOrderByAggregateInput
    _sum?: EstoqueLoteSumOrderByAggregateInput
  }

  export type EstoqueLoteScalarWhereWithAggregatesInput = {
    AND?: EstoqueLoteScalarWhereWithAggregatesInput | EstoqueLoteScalarWhereWithAggregatesInput[]
    OR?: EstoqueLoteScalarWhereWithAggregatesInput[]
    NOT?: EstoqueLoteScalarWhereWithAggregatesInput | EstoqueLoteScalarWhereWithAggregatesInput[]
    id?: StringWithAggregatesFilter<"EstoqueLote"> | string
    estoqueId?: StringWithAggregatesFilter<"EstoqueLote"> | string
    numeroLote?: StringWithAggregatesFilter<"EstoqueLote"> | string
    dataFabricacao?: DateTimeNullableWithAggregatesFilter<"EstoqueLote"> | Date | string | null
    dataValidade?: DateTimeNullableWithAggregatesFilter<"EstoqueLote"> | Date | string | null
    quantidadeLote?: DecimalWithAggregatesFilter<"EstoqueLote"> | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteWithAggregatesFilter<"EstoqueLote"> | $Enums.StatusLote
    lojaId?: StringWithAggregatesFilter<"EstoqueLote"> | string
    createdAt?: DateTimeWithAggregatesFilter<"EstoqueLote"> | Date | string
    updatedAt?: DateTimeWithAggregatesFilter<"EstoqueLote"> | Date | string
  }

  export type EstoqueLocalizacaoCreateInput = {
    id?: string
    codigo: string
    deposito: string
    corredor?: string | null
    prateleira?: string | null
    nivel?: string | null
    posicao?: string | null
    descricao?: string | null
    capacidade?: Decimal | DecimalJsLike | number | string | null
    ativo?: boolean
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    estoques?: EstoqueItemCreateNestedManyWithoutLocalizacaoInput
  }

  export type EstoqueLocalizacaoUncheckedCreateInput = {
    id?: string
    codigo: string
    deposito: string
    corredor?: string | null
    prateleira?: string | null
    nivel?: string | null
    posicao?: string | null
    descricao?: string | null
    capacidade?: Decimal | DecimalJsLike | number | string | null
    ativo?: boolean
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    estoques?: EstoqueItemUncheckedCreateNestedManyWithoutLocalizacaoInput
  }

  export type EstoqueLocalizacaoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    codigo?: StringFieldUpdateOperationsInput | string
    deposito?: StringFieldUpdateOperationsInput | string
    corredor?: NullableStringFieldUpdateOperationsInput | string | null
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null
    nivel?: NullableStringFieldUpdateOperationsInput | string | null
    posicao?: NullableStringFieldUpdateOperationsInput | string | null
    descricao?: NullableStringFieldUpdateOperationsInput | string | null
    capacidade?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolFieldUpdateOperationsInput | boolean
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    estoques?: EstoqueItemUpdateManyWithoutLocalizacaoNestedInput
  }

  export type EstoqueLocalizacaoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    codigo?: StringFieldUpdateOperationsInput | string
    deposito?: StringFieldUpdateOperationsInput | string
    corredor?: NullableStringFieldUpdateOperationsInput | string | null
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null
    nivel?: NullableStringFieldUpdateOperationsInput | string | null
    posicao?: NullableStringFieldUpdateOperationsInput | string | null
    descricao?: NullableStringFieldUpdateOperationsInput | string | null
    capacidade?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolFieldUpdateOperationsInput | boolean
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    estoques?: EstoqueItemUncheckedUpdateManyWithoutLocalizacaoNestedInput
  }

  export type EstoqueLocalizacaoCreateManyInput = {
    id?: string
    codigo: string
    deposito: string
    corredor?: string | null
    prateleira?: string | null
    nivel?: string | null
    posicao?: string | null
    descricao?: string | null
    capacidade?: Decimal | DecimalJsLike | number | string | null
    ativo?: boolean
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstoqueLocalizacaoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    codigo?: StringFieldUpdateOperationsInput | string
    deposito?: StringFieldUpdateOperationsInput | string
    corredor?: NullableStringFieldUpdateOperationsInput | string | null
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null
    nivel?: NullableStringFieldUpdateOperationsInput | string | null
    posicao?: NullableStringFieldUpdateOperationsInput | string | null
    descricao?: NullableStringFieldUpdateOperationsInput | string | null
    capacidade?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolFieldUpdateOperationsInput | boolean
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstoqueLocalizacaoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    codigo?: StringFieldUpdateOperationsInput | string
    deposito?: StringFieldUpdateOperationsInput | string
    corredor?: NullableStringFieldUpdateOperationsInput | string | null
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null
    nivel?: NullableStringFieldUpdateOperationsInput | string | null
    posicao?: NullableStringFieldUpdateOperationsInput | string | null
    descricao?: NullableStringFieldUpdateOperationsInput | string | null
    capacidade?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolFieldUpdateOperationsInput | boolean
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstoqueItemCreateInput = {
    id?: string
    insumoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
    localizacao: EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput
    movimentacoes?: EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput
    lotes?: EstoqueLoteCreateNestedManyWithoutEstoqueInput
  }

  export type EstoqueItemUncheckedCreateInput = {
    id?: string
    insumoId: string
    localizacaoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
    movimentacoes?: EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput
    lotes?: EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput
  }

  export type EstoqueItemUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localizacao?: EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput
    movimentacoes?: EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput
    lotes?: EstoqueLoteUpdateManyWithoutEstoqueNestedInput
  }

  export type EstoqueItemUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    localizacaoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    movimentacoes?: EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput
    lotes?: EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput
  }

  export type EstoqueItemCreateManyInput = {
    id?: string
    insumoId: string
    localizacaoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
  }

  export type EstoqueItemUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type EstoqueItemUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    localizacaoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type EstoqueMovimentacaoCreateInput = {
    id?: string
    tipo: $Enums.TipoMovimentacao
    quantidade: Decimal | DecimalJsLike | number | string
    quantidadeAnterior: Decimal | DecimalJsLike | number | string
    quantidadePosterior: Decimal | DecimalJsLike | number | string
    documentoRef?: string | null
    orcamentoId?: string | null
    usuarioId: string
    lojaId: string
    dataMovimentacao?: Date | string
    observacoes?: string | null
    estoque: EstoqueItemCreateNestedOneWithoutMovimentacoesInput
  }

  export type EstoqueMovimentacaoUncheckedCreateInput = {
    id?: string
    estoqueId: string
    tipo: $Enums.TipoMovimentacao
    quantidade: Decimal | DecimalJsLike | number | string
    quantidadeAnterior: Decimal | DecimalJsLike | number | string
    quantidadePosterior: Decimal | DecimalJsLike | number | string
    documentoRef?: string | null
    orcamentoId?: string | null
    usuarioId: string
    lojaId: string
    dataMovimentacao?: Date | string
    observacoes?: string | null
  }

  export type EstoqueMovimentacaoUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    tipo?: EnumTipoMovimentacaoFieldUpdateOperationsInput | $Enums.TipoMovimentacao
    quantidade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null
    usuarioId?: StringFieldUpdateOperationsInput | string
    lojaId?: StringFieldUpdateOperationsInput | string
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null
    estoque?: EstoqueItemUpdateOneRequiredWithoutMovimentacoesNestedInput
  }

  export type EstoqueMovimentacaoUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    estoqueId?: StringFieldUpdateOperationsInput | string
    tipo?: EnumTipoMovimentacaoFieldUpdateOperationsInput | $Enums.TipoMovimentacao
    quantidade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null
    usuarioId?: StringFieldUpdateOperationsInput | string
    lojaId?: StringFieldUpdateOperationsInput | string
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EstoqueMovimentacaoCreateManyInput = {
    id?: string
    estoqueId: string
    tipo: $Enums.TipoMovimentacao
    quantidade: Decimal | DecimalJsLike | number | string
    quantidadeAnterior: Decimal | DecimalJsLike | number | string
    quantidadePosterior: Decimal | DecimalJsLike | number | string
    documentoRef?: string | null
    orcamentoId?: string | null
    usuarioId: string
    lojaId: string
    dataMovimentacao?: Date | string
    observacoes?: string | null
  }

  export type EstoqueMovimentacaoUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    tipo?: EnumTipoMovimentacaoFieldUpdateOperationsInput | $Enums.TipoMovimentacao
    quantidade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null
    usuarioId?: StringFieldUpdateOperationsInput | string
    lojaId?: StringFieldUpdateOperationsInput | string
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EstoqueMovimentacaoUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    estoqueId?: StringFieldUpdateOperationsInput | string
    tipo?: EnumTipoMovimentacaoFieldUpdateOperationsInput | $Enums.TipoMovimentacao
    quantidade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null
    usuarioId?: StringFieldUpdateOperationsInput | string
    lojaId?: StringFieldUpdateOperationsInput | string
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EstoqueLoteCreateInput = {
    id?: string
    numeroLote: string
    dataFabricacao?: Date | string | null
    dataValidade?: Date | string | null
    quantidadeLote: Decimal | DecimalJsLike | number | string
    status?: $Enums.StatusLote
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    estoque: EstoqueItemCreateNestedOneWithoutLotesInput
  }

  export type EstoqueLoteUncheckedCreateInput = {
    id?: string
    estoqueId: string
    numeroLote: string
    dataFabricacao?: Date | string | null
    dataValidade?: Date | string | null
    quantidadeLote: Decimal | DecimalJsLike | number | string
    status?: $Enums.StatusLote
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstoqueLoteUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    numeroLote?: StringFieldUpdateOperationsInput | string
    dataFabricacao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dataValidade?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quantidadeLote?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    estoque?: EstoqueItemUpdateOneRequiredWithoutLotesNestedInput
  }

  export type EstoqueLoteUncheckedUpdateInput = {
    id?: StringFieldUpdateOperationsInput | string
    estoqueId?: StringFieldUpdateOperationsInput | string
    numeroLote?: StringFieldUpdateOperationsInput | string
    dataFabricacao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dataValidade?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quantidadeLote?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstoqueLoteCreateManyInput = {
    id?: string
    estoqueId: string
    numeroLote: string
    dataFabricacao?: Date | string | null
    dataValidade?: Date | string | null
    quantidadeLote: Decimal | DecimalJsLike | number | string
    status?: $Enums.StatusLote
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstoqueLoteUpdateManyMutationInput = {
    id?: StringFieldUpdateOperationsInput | string
    numeroLote?: StringFieldUpdateOperationsInput | string
    dataFabricacao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dataValidade?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quantidadeLote?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstoqueLoteUncheckedUpdateManyInput = {
    id?: StringFieldUpdateOperationsInput | string
    estoqueId?: StringFieldUpdateOperationsInput | string
    numeroLote?: StringFieldUpdateOperationsInput | string
    dataFabricacao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dataValidade?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quantidadeLote?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type DecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type EstoqueItemListRelationFilter = {
    every?: EstoqueItemWhereInput
    some?: EstoqueItemWhereInput
    none?: EstoqueItemWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type EstoqueItemOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EstoqueLocalizacaoOrderByRelevanceInput = {
    fields: EstoqueLocalizacaoOrderByRelevanceFieldEnum | EstoqueLocalizacaoOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type EstoqueLocalizacaoCountOrderByAggregateInput = {
    id?: SortOrder
    codigo?: SortOrder
    deposito?: SortOrder
    corredor?: SortOrder
    prateleira?: SortOrder
    nivel?: SortOrder
    posicao?: SortOrder
    descricao?: SortOrder
    capacidade?: SortOrder
    ativo?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstoqueLocalizacaoAvgOrderByAggregateInput = {
    capacidade?: SortOrder
  }

  export type EstoqueLocalizacaoMaxOrderByAggregateInput = {
    id?: SortOrder
    codigo?: SortOrder
    deposito?: SortOrder
    corredor?: SortOrder
    prateleira?: SortOrder
    nivel?: SortOrder
    posicao?: SortOrder
    descricao?: SortOrder
    capacidade?: SortOrder
    ativo?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstoqueLocalizacaoMinOrderByAggregateInput = {
    id?: SortOrder
    codigo?: SortOrder
    deposito?: SortOrder
    corredor?: SortOrder
    prateleira?: SortOrder
    nivel?: SortOrder
    posicao?: SortOrder
    descricao?: SortOrder
    capacidade?: SortOrder
    ativo?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstoqueLocalizacaoSumOrderByAggregateInput = {
    capacidade?: SortOrder
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type DecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type DecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type EstoqueLocalizacaoScalarRelationFilter = {
    is?: EstoqueLocalizacaoWhereInput
    isNot?: EstoqueLocalizacaoWhereInput
  }

  export type EstoqueMovimentacaoListRelationFilter = {
    every?: EstoqueMovimentacaoWhereInput
    some?: EstoqueMovimentacaoWhereInput
    none?: EstoqueMovimentacaoWhereInput
  }

  export type EstoqueLoteListRelationFilter = {
    every?: EstoqueLoteWhereInput
    some?: EstoqueLoteWhereInput
    none?: EstoqueLoteWhereInput
  }

  export type EstoqueMovimentacaoOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EstoqueLoteOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type EstoqueItemOrderByRelevanceInput = {
    fields: EstoqueItemOrderByRelevanceFieldEnum | EstoqueItemOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type EstoqueItemInsumoIdLocalizacaoIdLojaIdCompoundUniqueInput = {
    insumoId: string
    localizacaoId: string
    lojaId: string
  }

  export type EstoqueItemCountOrderByAggregateInput = {
    id?: SortOrder
    insumoId?: SortOrder
    localizacaoId?: SortOrder
    quantidadeAtual?: SortOrder
    quantidadeReservada?: SortOrder
    estoqueMinimo?: SortOrder
    estoqueMaximo?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dataUltimaMov?: SortOrder
  }

  export type EstoqueItemAvgOrderByAggregateInput = {
    quantidadeAtual?: SortOrder
    quantidadeReservada?: SortOrder
    estoqueMinimo?: SortOrder
    estoqueMaximo?: SortOrder
  }

  export type EstoqueItemMaxOrderByAggregateInput = {
    id?: SortOrder
    insumoId?: SortOrder
    localizacaoId?: SortOrder
    quantidadeAtual?: SortOrder
    quantidadeReservada?: SortOrder
    estoqueMinimo?: SortOrder
    estoqueMaximo?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dataUltimaMov?: SortOrder
  }

  export type EstoqueItemMinOrderByAggregateInput = {
    id?: SortOrder
    insumoId?: SortOrder
    localizacaoId?: SortOrder
    quantidadeAtual?: SortOrder
    quantidadeReservada?: SortOrder
    estoqueMinimo?: SortOrder
    estoqueMaximo?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
    dataUltimaMov?: SortOrder
  }

  export type EstoqueItemSumOrderByAggregateInput = {
    quantidadeAtual?: SortOrder
    quantidadeReservada?: SortOrder
    estoqueMinimo?: SortOrder
    estoqueMaximo?: SortOrder
  }

  export type DecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumTipoMovimentacaoFilter<$PrismaModel = never> = {
    equals?: $Enums.TipoMovimentacao | EnumTipoMovimentacaoFieldRefInput<$PrismaModel>
    in?: $Enums.TipoMovimentacao[]
    notIn?: $Enums.TipoMovimentacao[]
    not?: NestedEnumTipoMovimentacaoFilter<$PrismaModel> | $Enums.TipoMovimentacao
  }

  export type EstoqueItemScalarRelationFilter = {
    is?: EstoqueItemWhereInput
    isNot?: EstoqueItemWhereInput
  }

  export type EstoqueMovimentacaoOrderByRelevanceInput = {
    fields: EstoqueMovimentacaoOrderByRelevanceFieldEnum | EstoqueMovimentacaoOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type EstoqueMovimentacaoCountOrderByAggregateInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    tipo?: SortOrder
    quantidade?: SortOrder
    quantidadeAnterior?: SortOrder
    quantidadePosterior?: SortOrder
    documentoRef?: SortOrder
    orcamentoId?: SortOrder
    usuarioId?: SortOrder
    lojaId?: SortOrder
    dataMovimentacao?: SortOrder
    observacoes?: SortOrder
  }

  export type EstoqueMovimentacaoAvgOrderByAggregateInput = {
    quantidade?: SortOrder
    quantidadeAnterior?: SortOrder
    quantidadePosterior?: SortOrder
  }

  export type EstoqueMovimentacaoMaxOrderByAggregateInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    tipo?: SortOrder
    quantidade?: SortOrder
    quantidadeAnterior?: SortOrder
    quantidadePosterior?: SortOrder
    documentoRef?: SortOrder
    orcamentoId?: SortOrder
    usuarioId?: SortOrder
    lojaId?: SortOrder
    dataMovimentacao?: SortOrder
    observacoes?: SortOrder
  }

  export type EstoqueMovimentacaoMinOrderByAggregateInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    tipo?: SortOrder
    quantidade?: SortOrder
    quantidadeAnterior?: SortOrder
    quantidadePosterior?: SortOrder
    documentoRef?: SortOrder
    orcamentoId?: SortOrder
    usuarioId?: SortOrder
    lojaId?: SortOrder
    dataMovimentacao?: SortOrder
    observacoes?: SortOrder
  }

  export type EstoqueMovimentacaoSumOrderByAggregateInput = {
    quantidade?: SortOrder
    quantidadeAnterior?: SortOrder
    quantidadePosterior?: SortOrder
  }

  export type EnumTipoMovimentacaoWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TipoMovimentacao | EnumTipoMovimentacaoFieldRefInput<$PrismaModel>
    in?: $Enums.TipoMovimentacao[]
    notIn?: $Enums.TipoMovimentacao[]
    not?: NestedEnumTipoMovimentacaoWithAggregatesFilter<$PrismaModel> | $Enums.TipoMovimentacao
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTipoMovimentacaoFilter<$PrismaModel>
    _max?: NestedEnumTipoMovimentacaoFilter<$PrismaModel>
  }

  export type EnumStatusLoteFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusLote | EnumStatusLoteFieldRefInput<$PrismaModel>
    in?: $Enums.StatusLote[]
    notIn?: $Enums.StatusLote[]
    not?: NestedEnumStatusLoteFilter<$PrismaModel> | $Enums.StatusLote
  }

  export type EstoqueLoteOrderByRelevanceInput = {
    fields: EstoqueLoteOrderByRelevanceFieldEnum | EstoqueLoteOrderByRelevanceFieldEnum[]
    sort: SortOrder
    search: string
  }

  export type EstoqueLoteCountOrderByAggregateInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    numeroLote?: SortOrder
    dataFabricacao?: SortOrder
    dataValidade?: SortOrder
    quantidadeLote?: SortOrder
    status?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstoqueLoteAvgOrderByAggregateInput = {
    quantidadeLote?: SortOrder
  }

  export type EstoqueLoteMaxOrderByAggregateInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    numeroLote?: SortOrder
    dataFabricacao?: SortOrder
    dataValidade?: SortOrder
    quantidadeLote?: SortOrder
    status?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstoqueLoteMinOrderByAggregateInput = {
    id?: SortOrder
    estoqueId?: SortOrder
    numeroLote?: SortOrder
    dataFabricacao?: SortOrder
    dataValidade?: SortOrder
    quantidadeLote?: SortOrder
    status?: SortOrder
    lojaId?: SortOrder
    createdAt?: SortOrder
    updatedAt?: SortOrder
  }

  export type EstoqueLoteSumOrderByAggregateInput = {
    quantidadeLote?: SortOrder
  }

  export type EnumStatusLoteWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusLote | EnumStatusLoteFieldRefInput<$PrismaModel>
    in?: $Enums.StatusLote[]
    notIn?: $Enums.StatusLote[]
    not?: NestedEnumStatusLoteWithAggregatesFilter<$PrismaModel> | $Enums.StatusLote
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStatusLoteFilter<$PrismaModel>
    _max?: NestedEnumStatusLoteFilter<$PrismaModel>
  }

  export type EstoqueItemCreateNestedManyWithoutLocalizacaoInput = {
    create?: XOR<EstoqueItemCreateWithoutLocalizacaoInput, EstoqueItemUncheckedCreateWithoutLocalizacaoInput> | EstoqueItemCreateWithoutLocalizacaoInput[] | EstoqueItemUncheckedCreateWithoutLocalizacaoInput[]
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutLocalizacaoInput | EstoqueItemCreateOrConnectWithoutLocalizacaoInput[]
    createMany?: EstoqueItemCreateManyLocalizacaoInputEnvelope
    connect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
  }

  export type EstoqueItemUncheckedCreateNestedManyWithoutLocalizacaoInput = {
    create?: XOR<EstoqueItemCreateWithoutLocalizacaoInput, EstoqueItemUncheckedCreateWithoutLocalizacaoInput> | EstoqueItemCreateWithoutLocalizacaoInput[] | EstoqueItemUncheckedCreateWithoutLocalizacaoInput[]
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutLocalizacaoInput | EstoqueItemCreateOrConnectWithoutLocalizacaoInput[]
    createMany?: EstoqueItemCreateManyLocalizacaoInputEnvelope
    connect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type NullableDecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string | null
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type EstoqueItemUpdateManyWithoutLocalizacaoNestedInput = {
    create?: XOR<EstoqueItemCreateWithoutLocalizacaoInput, EstoqueItemUncheckedCreateWithoutLocalizacaoInput> | EstoqueItemCreateWithoutLocalizacaoInput[] | EstoqueItemUncheckedCreateWithoutLocalizacaoInput[]
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutLocalizacaoInput | EstoqueItemCreateOrConnectWithoutLocalizacaoInput[]
    upsert?: EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput | EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput[]
    createMany?: EstoqueItemCreateManyLocalizacaoInputEnvelope
    set?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
    disconnect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
    delete?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
    connect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
    update?: EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput | EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput[]
    updateMany?: EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput | EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput[]
    deleteMany?: EstoqueItemScalarWhereInput | EstoqueItemScalarWhereInput[]
  }

  export type EstoqueItemUncheckedUpdateManyWithoutLocalizacaoNestedInput = {
    create?: XOR<EstoqueItemCreateWithoutLocalizacaoInput, EstoqueItemUncheckedCreateWithoutLocalizacaoInput> | EstoqueItemCreateWithoutLocalizacaoInput[] | EstoqueItemUncheckedCreateWithoutLocalizacaoInput[]
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutLocalizacaoInput | EstoqueItemCreateOrConnectWithoutLocalizacaoInput[]
    upsert?: EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput | EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput[]
    createMany?: EstoqueItemCreateManyLocalizacaoInputEnvelope
    set?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
    disconnect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
    delete?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
    connect?: EstoqueItemWhereUniqueInput | EstoqueItemWhereUniqueInput[]
    update?: EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput | EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput[]
    updateMany?: EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput | EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput[]
    deleteMany?: EstoqueItemScalarWhereInput | EstoqueItemScalarWhereInput[]
  }

  export type EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput = {
    create?: XOR<EstoqueLocalizacaoCreateWithoutEstoquesInput, EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput>
    connectOrCreate?: EstoqueLocalizacaoCreateOrConnectWithoutEstoquesInput
    connect?: EstoqueLocalizacaoWhereUniqueInput
  }

  export type EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput = {
    create?: XOR<EstoqueMovimentacaoCreateWithoutEstoqueInput, EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput> | EstoqueMovimentacaoCreateWithoutEstoqueInput[] | EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput[]
    connectOrCreate?: EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput[]
    createMany?: EstoqueMovimentacaoCreateManyEstoqueInputEnvelope
    connect?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
  }

  export type EstoqueLoteCreateNestedManyWithoutEstoqueInput = {
    create?: XOR<EstoqueLoteCreateWithoutEstoqueInput, EstoqueLoteUncheckedCreateWithoutEstoqueInput> | EstoqueLoteCreateWithoutEstoqueInput[] | EstoqueLoteUncheckedCreateWithoutEstoqueInput[]
    connectOrCreate?: EstoqueLoteCreateOrConnectWithoutEstoqueInput | EstoqueLoteCreateOrConnectWithoutEstoqueInput[]
    createMany?: EstoqueLoteCreateManyEstoqueInputEnvelope
    connect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
  }

  export type EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput = {
    create?: XOR<EstoqueMovimentacaoCreateWithoutEstoqueInput, EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput> | EstoqueMovimentacaoCreateWithoutEstoqueInput[] | EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput[]
    connectOrCreate?: EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput[]
    createMany?: EstoqueMovimentacaoCreateManyEstoqueInputEnvelope
    connect?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
  }

  export type EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput = {
    create?: XOR<EstoqueLoteCreateWithoutEstoqueInput, EstoqueLoteUncheckedCreateWithoutEstoqueInput> | EstoqueLoteCreateWithoutEstoqueInput[] | EstoqueLoteUncheckedCreateWithoutEstoqueInput[]
    connectOrCreate?: EstoqueLoteCreateOrConnectWithoutEstoqueInput | EstoqueLoteCreateOrConnectWithoutEstoqueInput[]
    createMany?: EstoqueLoteCreateManyEstoqueInputEnvelope
    connect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
  }

  export type DecimalFieldUpdateOperationsInput = {
    set?: Decimal | DecimalJsLike | number | string
    increment?: Decimal | DecimalJsLike | number | string
    decrement?: Decimal | DecimalJsLike | number | string
    multiply?: Decimal | DecimalJsLike | number | string
    divide?: Decimal | DecimalJsLike | number | string
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput = {
    create?: XOR<EstoqueLocalizacaoCreateWithoutEstoquesInput, EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput>
    connectOrCreate?: EstoqueLocalizacaoCreateOrConnectWithoutEstoquesInput
    upsert?: EstoqueLocalizacaoUpsertWithoutEstoquesInput
    connect?: EstoqueLocalizacaoWhereUniqueInput
    update?: XOR<XOR<EstoqueLocalizacaoUpdateToOneWithWhereWithoutEstoquesInput, EstoqueLocalizacaoUpdateWithoutEstoquesInput>, EstoqueLocalizacaoUncheckedUpdateWithoutEstoquesInput>
  }

  export type EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput = {
    create?: XOR<EstoqueMovimentacaoCreateWithoutEstoqueInput, EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput> | EstoqueMovimentacaoCreateWithoutEstoqueInput[] | EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput[]
    connectOrCreate?: EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput[]
    upsert?: EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput | EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput[]
    createMany?: EstoqueMovimentacaoCreateManyEstoqueInputEnvelope
    set?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
    disconnect?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
    delete?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
    connect?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
    update?: EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput | EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput[]
    updateMany?: EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput | EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput[]
    deleteMany?: EstoqueMovimentacaoScalarWhereInput | EstoqueMovimentacaoScalarWhereInput[]
  }

  export type EstoqueLoteUpdateManyWithoutEstoqueNestedInput = {
    create?: XOR<EstoqueLoteCreateWithoutEstoqueInput, EstoqueLoteUncheckedCreateWithoutEstoqueInput> | EstoqueLoteCreateWithoutEstoqueInput[] | EstoqueLoteUncheckedCreateWithoutEstoqueInput[]
    connectOrCreate?: EstoqueLoteCreateOrConnectWithoutEstoqueInput | EstoqueLoteCreateOrConnectWithoutEstoqueInput[]
    upsert?: EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput | EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput[]
    createMany?: EstoqueLoteCreateManyEstoqueInputEnvelope
    set?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
    disconnect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
    delete?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
    connect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
    update?: EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput | EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput[]
    updateMany?: EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput | EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput[]
    deleteMany?: EstoqueLoteScalarWhereInput | EstoqueLoteScalarWhereInput[]
  }

  export type EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput = {
    create?: XOR<EstoqueMovimentacaoCreateWithoutEstoqueInput, EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput> | EstoqueMovimentacaoCreateWithoutEstoqueInput[] | EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput[]
    connectOrCreate?: EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput | EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput[]
    upsert?: EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput | EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput[]
    createMany?: EstoqueMovimentacaoCreateManyEstoqueInputEnvelope
    set?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
    disconnect?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
    delete?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
    connect?: EstoqueMovimentacaoWhereUniqueInput | EstoqueMovimentacaoWhereUniqueInput[]
    update?: EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput | EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput[]
    updateMany?: EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput | EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput[]
    deleteMany?: EstoqueMovimentacaoScalarWhereInput | EstoqueMovimentacaoScalarWhereInput[]
  }

  export type EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput = {
    create?: XOR<EstoqueLoteCreateWithoutEstoqueInput, EstoqueLoteUncheckedCreateWithoutEstoqueInput> | EstoqueLoteCreateWithoutEstoqueInput[] | EstoqueLoteUncheckedCreateWithoutEstoqueInput[]
    connectOrCreate?: EstoqueLoteCreateOrConnectWithoutEstoqueInput | EstoqueLoteCreateOrConnectWithoutEstoqueInput[]
    upsert?: EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput | EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput[]
    createMany?: EstoqueLoteCreateManyEstoqueInputEnvelope
    set?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
    disconnect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
    delete?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
    connect?: EstoqueLoteWhereUniqueInput | EstoqueLoteWhereUniqueInput[]
    update?: EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput | EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput[]
    updateMany?: EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput | EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput[]
    deleteMany?: EstoqueLoteScalarWhereInput | EstoqueLoteScalarWhereInput[]
  }

  export type EstoqueItemCreateNestedOneWithoutMovimentacoesInput = {
    create?: XOR<EstoqueItemCreateWithoutMovimentacoesInput, EstoqueItemUncheckedCreateWithoutMovimentacoesInput>
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutMovimentacoesInput
    connect?: EstoqueItemWhereUniqueInput
  }

  export type EnumTipoMovimentacaoFieldUpdateOperationsInput = {
    set?: $Enums.TipoMovimentacao
  }

  export type EstoqueItemUpdateOneRequiredWithoutMovimentacoesNestedInput = {
    create?: XOR<EstoqueItemCreateWithoutMovimentacoesInput, EstoqueItemUncheckedCreateWithoutMovimentacoesInput>
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutMovimentacoesInput
    upsert?: EstoqueItemUpsertWithoutMovimentacoesInput
    connect?: EstoqueItemWhereUniqueInput
    update?: XOR<XOR<EstoqueItemUpdateToOneWithWhereWithoutMovimentacoesInput, EstoqueItemUpdateWithoutMovimentacoesInput>, EstoqueItemUncheckedUpdateWithoutMovimentacoesInput>
  }

  export type EstoqueItemCreateNestedOneWithoutLotesInput = {
    create?: XOR<EstoqueItemCreateWithoutLotesInput, EstoqueItemUncheckedCreateWithoutLotesInput>
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutLotesInput
    connect?: EstoqueItemWhereUniqueInput
  }

  export type EnumStatusLoteFieldUpdateOperationsInput = {
    set?: $Enums.StatusLote
  }

  export type EstoqueItemUpdateOneRequiredWithoutLotesNestedInput = {
    create?: XOR<EstoqueItemCreateWithoutLotesInput, EstoqueItemUncheckedCreateWithoutLotesInput>
    connectOrCreate?: EstoqueItemCreateOrConnectWithoutLotesInput
    upsert?: EstoqueItemUpsertWithoutLotesInput
    connect?: EstoqueItemWhereUniqueInput
    update?: XOR<XOR<EstoqueItemUpdateToOneWithWhereWithoutLotesInput, EstoqueItemUpdateWithoutLotesInput>, EstoqueItemUncheckedUpdateWithoutLotesInput>
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedDecimalNullableFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    search?: string
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type NestedDecimalNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel> | null
    in?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[] | null
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalNullableWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedDecimalNullableFilter<$PrismaModel>
    _sum?: NestedDecimalNullableFilter<$PrismaModel>
    _min?: NestedDecimalNullableFilter<$PrismaModel>
    _max?: NestedDecimalNullableFilter<$PrismaModel>
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedDecimalFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedDecimalWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    in?: Decimal[] | DecimalJsLike[] | number[] | string[]
    notIn?: Decimal[] | DecimalJsLike[] | number[] | string[]
    lt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    lte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gt?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    gte?: Decimal | DecimalJsLike | number | string | DecimalFieldRefInput<$PrismaModel>
    not?: NestedDecimalWithAggregatesFilter<$PrismaModel> | Decimal | DecimalJsLike | number | string
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedDecimalFilter<$PrismaModel>
    _sum?: NestedDecimalFilter<$PrismaModel>
    _min?: NestedDecimalFilter<$PrismaModel>
    _max?: NestedDecimalFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumTipoMovimentacaoFilter<$PrismaModel = never> = {
    equals?: $Enums.TipoMovimentacao | EnumTipoMovimentacaoFieldRefInput<$PrismaModel>
    in?: $Enums.TipoMovimentacao[]
    notIn?: $Enums.TipoMovimentacao[]
    not?: NestedEnumTipoMovimentacaoFilter<$PrismaModel> | $Enums.TipoMovimentacao
  }

  export type NestedEnumTipoMovimentacaoWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.TipoMovimentacao | EnumTipoMovimentacaoFieldRefInput<$PrismaModel>
    in?: $Enums.TipoMovimentacao[]
    notIn?: $Enums.TipoMovimentacao[]
    not?: NestedEnumTipoMovimentacaoWithAggregatesFilter<$PrismaModel> | $Enums.TipoMovimentacao
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumTipoMovimentacaoFilter<$PrismaModel>
    _max?: NestedEnumTipoMovimentacaoFilter<$PrismaModel>
  }

  export type NestedEnumStatusLoteFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusLote | EnumStatusLoteFieldRefInput<$PrismaModel>
    in?: $Enums.StatusLote[]
    notIn?: $Enums.StatusLote[]
    not?: NestedEnumStatusLoteFilter<$PrismaModel> | $Enums.StatusLote
  }

  export type NestedEnumStatusLoteWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.StatusLote | EnumStatusLoteFieldRefInput<$PrismaModel>
    in?: $Enums.StatusLote[]
    notIn?: $Enums.StatusLote[]
    not?: NestedEnumStatusLoteWithAggregatesFilter<$PrismaModel> | $Enums.StatusLote
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumStatusLoteFilter<$PrismaModel>
    _max?: NestedEnumStatusLoteFilter<$PrismaModel>
  }

  export type EstoqueItemCreateWithoutLocalizacaoInput = {
    id?: string
    insumoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
    movimentacoes?: EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput
    lotes?: EstoqueLoteCreateNestedManyWithoutEstoqueInput
  }

  export type EstoqueItemUncheckedCreateWithoutLocalizacaoInput = {
    id?: string
    insumoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
    movimentacoes?: EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput
    lotes?: EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput
  }

  export type EstoqueItemCreateOrConnectWithoutLocalizacaoInput = {
    where: EstoqueItemWhereUniqueInput
    create: XOR<EstoqueItemCreateWithoutLocalizacaoInput, EstoqueItemUncheckedCreateWithoutLocalizacaoInput>
  }

  export type EstoqueItemCreateManyLocalizacaoInputEnvelope = {
    data: EstoqueItemCreateManyLocalizacaoInput | EstoqueItemCreateManyLocalizacaoInput[]
    skipDuplicates?: boolean
  }

  export type EstoqueItemUpsertWithWhereUniqueWithoutLocalizacaoInput = {
    where: EstoqueItemWhereUniqueInput
    update: XOR<EstoqueItemUpdateWithoutLocalizacaoInput, EstoqueItemUncheckedUpdateWithoutLocalizacaoInput>
    create: XOR<EstoqueItemCreateWithoutLocalizacaoInput, EstoqueItemUncheckedCreateWithoutLocalizacaoInput>
  }

  export type EstoqueItemUpdateWithWhereUniqueWithoutLocalizacaoInput = {
    where: EstoqueItemWhereUniqueInput
    data: XOR<EstoqueItemUpdateWithoutLocalizacaoInput, EstoqueItemUncheckedUpdateWithoutLocalizacaoInput>
  }

  export type EstoqueItemUpdateManyWithWhereWithoutLocalizacaoInput = {
    where: EstoqueItemScalarWhereInput
    data: XOR<EstoqueItemUpdateManyMutationInput, EstoqueItemUncheckedUpdateManyWithoutLocalizacaoInput>
  }

  export type EstoqueItemScalarWhereInput = {
    AND?: EstoqueItemScalarWhereInput | EstoqueItemScalarWhereInput[]
    OR?: EstoqueItemScalarWhereInput[]
    NOT?: EstoqueItemScalarWhereInput | EstoqueItemScalarWhereInput[]
    id?: StringFilter<"EstoqueItem"> | string
    insumoId?: StringFilter<"EstoqueItem"> | string
    localizacaoId?: StringFilter<"EstoqueItem"> | string
    quantidadeAtual?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: DecimalNullableFilter<"EstoqueItem"> | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFilter<"EstoqueItem"> | string
    createdAt?: DateTimeFilter<"EstoqueItem"> | Date | string
    updatedAt?: DateTimeFilter<"EstoqueItem"> | Date | string
    dataUltimaMov?: DateTimeNullableFilter<"EstoqueItem"> | Date | string | null
  }

  export type EstoqueLocalizacaoCreateWithoutEstoquesInput = {
    id?: string
    codigo: string
    deposito: string
    corredor?: string | null
    prateleira?: string | null
    nivel?: string | null
    posicao?: string | null
    descricao?: string | null
    capacidade?: Decimal | DecimalJsLike | number | string | null
    ativo?: boolean
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput = {
    id?: string
    codigo: string
    deposito: string
    corredor?: string | null
    prateleira?: string | null
    nivel?: string | null
    posicao?: string | null
    descricao?: string | null
    capacidade?: Decimal | DecimalJsLike | number | string | null
    ativo?: boolean
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstoqueLocalizacaoCreateOrConnectWithoutEstoquesInput = {
    where: EstoqueLocalizacaoWhereUniqueInput
    create: XOR<EstoqueLocalizacaoCreateWithoutEstoquesInput, EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput>
  }

  export type EstoqueMovimentacaoCreateWithoutEstoqueInput = {
    id?: string
    tipo: $Enums.TipoMovimentacao
    quantidade: Decimal | DecimalJsLike | number | string
    quantidadeAnterior: Decimal | DecimalJsLike | number | string
    quantidadePosterior: Decimal | DecimalJsLike | number | string
    documentoRef?: string | null
    orcamentoId?: string | null
    usuarioId: string
    lojaId: string
    dataMovimentacao?: Date | string
    observacoes?: string | null
  }

  export type EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput = {
    id?: string
    tipo: $Enums.TipoMovimentacao
    quantidade: Decimal | DecimalJsLike | number | string
    quantidadeAnterior: Decimal | DecimalJsLike | number | string
    quantidadePosterior: Decimal | DecimalJsLike | number | string
    documentoRef?: string | null
    orcamentoId?: string | null
    usuarioId: string
    lojaId: string
    dataMovimentacao?: Date | string
    observacoes?: string | null
  }

  export type EstoqueMovimentacaoCreateOrConnectWithoutEstoqueInput = {
    where: EstoqueMovimentacaoWhereUniqueInput
    create: XOR<EstoqueMovimentacaoCreateWithoutEstoqueInput, EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput>
  }

  export type EstoqueMovimentacaoCreateManyEstoqueInputEnvelope = {
    data: EstoqueMovimentacaoCreateManyEstoqueInput | EstoqueMovimentacaoCreateManyEstoqueInput[]
    skipDuplicates?: boolean
  }

  export type EstoqueLoteCreateWithoutEstoqueInput = {
    id?: string
    numeroLote: string
    dataFabricacao?: Date | string | null
    dataValidade?: Date | string | null
    quantidadeLote: Decimal | DecimalJsLike | number | string
    status?: $Enums.StatusLote
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstoqueLoteUncheckedCreateWithoutEstoqueInput = {
    id?: string
    numeroLote: string
    dataFabricacao?: Date | string | null
    dataValidade?: Date | string | null
    quantidadeLote: Decimal | DecimalJsLike | number | string
    status?: $Enums.StatusLote
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstoqueLoteCreateOrConnectWithoutEstoqueInput = {
    where: EstoqueLoteWhereUniqueInput
    create: XOR<EstoqueLoteCreateWithoutEstoqueInput, EstoqueLoteUncheckedCreateWithoutEstoqueInput>
  }

  export type EstoqueLoteCreateManyEstoqueInputEnvelope = {
    data: EstoqueLoteCreateManyEstoqueInput | EstoqueLoteCreateManyEstoqueInput[]
    skipDuplicates?: boolean
  }

  export type EstoqueLocalizacaoUpsertWithoutEstoquesInput = {
    update: XOR<EstoqueLocalizacaoUpdateWithoutEstoquesInput, EstoqueLocalizacaoUncheckedUpdateWithoutEstoquesInput>
    create: XOR<EstoqueLocalizacaoCreateWithoutEstoquesInput, EstoqueLocalizacaoUncheckedCreateWithoutEstoquesInput>
    where?: EstoqueLocalizacaoWhereInput
  }

  export type EstoqueLocalizacaoUpdateToOneWithWhereWithoutEstoquesInput = {
    where?: EstoqueLocalizacaoWhereInput
    data: XOR<EstoqueLocalizacaoUpdateWithoutEstoquesInput, EstoqueLocalizacaoUncheckedUpdateWithoutEstoquesInput>
  }

  export type EstoqueLocalizacaoUpdateWithoutEstoquesInput = {
    id?: StringFieldUpdateOperationsInput | string
    codigo?: StringFieldUpdateOperationsInput | string
    deposito?: StringFieldUpdateOperationsInput | string
    corredor?: NullableStringFieldUpdateOperationsInput | string | null
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null
    nivel?: NullableStringFieldUpdateOperationsInput | string | null
    posicao?: NullableStringFieldUpdateOperationsInput | string | null
    descricao?: NullableStringFieldUpdateOperationsInput | string | null
    capacidade?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolFieldUpdateOperationsInput | boolean
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstoqueLocalizacaoUncheckedUpdateWithoutEstoquesInput = {
    id?: StringFieldUpdateOperationsInput | string
    codigo?: StringFieldUpdateOperationsInput | string
    deposito?: StringFieldUpdateOperationsInput | string
    corredor?: NullableStringFieldUpdateOperationsInput | string | null
    prateleira?: NullableStringFieldUpdateOperationsInput | string | null
    nivel?: NullableStringFieldUpdateOperationsInput | string | null
    posicao?: NullableStringFieldUpdateOperationsInput | string | null
    descricao?: NullableStringFieldUpdateOperationsInput | string | null
    capacidade?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    ativo?: BoolFieldUpdateOperationsInput | boolean
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstoqueMovimentacaoUpsertWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueMovimentacaoWhereUniqueInput
    update: XOR<EstoqueMovimentacaoUpdateWithoutEstoqueInput, EstoqueMovimentacaoUncheckedUpdateWithoutEstoqueInput>
    create: XOR<EstoqueMovimentacaoCreateWithoutEstoqueInput, EstoqueMovimentacaoUncheckedCreateWithoutEstoqueInput>
  }

  export type EstoqueMovimentacaoUpdateWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueMovimentacaoWhereUniqueInput
    data: XOR<EstoqueMovimentacaoUpdateWithoutEstoqueInput, EstoqueMovimentacaoUncheckedUpdateWithoutEstoqueInput>
  }

  export type EstoqueMovimentacaoUpdateManyWithWhereWithoutEstoqueInput = {
    where: EstoqueMovimentacaoScalarWhereInput
    data: XOR<EstoqueMovimentacaoUpdateManyMutationInput, EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueInput>
  }

  export type EstoqueMovimentacaoScalarWhereInput = {
    AND?: EstoqueMovimentacaoScalarWhereInput | EstoqueMovimentacaoScalarWhereInput[]
    OR?: EstoqueMovimentacaoScalarWhereInput[]
    NOT?: EstoqueMovimentacaoScalarWhereInput | EstoqueMovimentacaoScalarWhereInput[]
    id?: StringFilter<"EstoqueMovimentacao"> | string
    estoqueId?: StringFilter<"EstoqueMovimentacao"> | string
    tipo?: EnumTipoMovimentacaoFilter<"EstoqueMovimentacao"> | $Enums.TipoMovimentacao
    quantidade?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFilter<"EstoqueMovimentacao"> | Decimal | DecimalJsLike | number | string
    documentoRef?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
    orcamentoId?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
    usuarioId?: StringFilter<"EstoqueMovimentacao"> | string
    lojaId?: StringFilter<"EstoqueMovimentacao"> | string
    dataMovimentacao?: DateTimeFilter<"EstoqueMovimentacao"> | Date | string
    observacoes?: StringNullableFilter<"EstoqueMovimentacao"> | string | null
  }

  export type EstoqueLoteUpsertWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueLoteWhereUniqueInput
    update: XOR<EstoqueLoteUpdateWithoutEstoqueInput, EstoqueLoteUncheckedUpdateWithoutEstoqueInput>
    create: XOR<EstoqueLoteCreateWithoutEstoqueInput, EstoqueLoteUncheckedCreateWithoutEstoqueInput>
  }

  export type EstoqueLoteUpdateWithWhereUniqueWithoutEstoqueInput = {
    where: EstoqueLoteWhereUniqueInput
    data: XOR<EstoqueLoteUpdateWithoutEstoqueInput, EstoqueLoteUncheckedUpdateWithoutEstoqueInput>
  }

  export type EstoqueLoteUpdateManyWithWhereWithoutEstoqueInput = {
    where: EstoqueLoteScalarWhereInput
    data: XOR<EstoqueLoteUpdateManyMutationInput, EstoqueLoteUncheckedUpdateManyWithoutEstoqueInput>
  }

  export type EstoqueLoteScalarWhereInput = {
    AND?: EstoqueLoteScalarWhereInput | EstoqueLoteScalarWhereInput[]
    OR?: EstoqueLoteScalarWhereInput[]
    NOT?: EstoqueLoteScalarWhereInput | EstoqueLoteScalarWhereInput[]
    id?: StringFilter<"EstoqueLote"> | string
    estoqueId?: StringFilter<"EstoqueLote"> | string
    numeroLote?: StringFilter<"EstoqueLote"> | string
    dataFabricacao?: DateTimeNullableFilter<"EstoqueLote"> | Date | string | null
    dataValidade?: DateTimeNullableFilter<"EstoqueLote"> | Date | string | null
    quantidadeLote?: DecimalFilter<"EstoqueLote"> | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFilter<"EstoqueLote"> | $Enums.StatusLote
    lojaId?: StringFilter<"EstoqueLote"> | string
    createdAt?: DateTimeFilter<"EstoqueLote"> | Date | string
    updatedAt?: DateTimeFilter<"EstoqueLote"> | Date | string
  }

  export type EstoqueItemCreateWithoutMovimentacoesInput = {
    id?: string
    insumoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
    localizacao: EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput
    lotes?: EstoqueLoteCreateNestedManyWithoutEstoqueInput
  }

  export type EstoqueItemUncheckedCreateWithoutMovimentacoesInput = {
    id?: string
    insumoId: string
    localizacaoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
    lotes?: EstoqueLoteUncheckedCreateNestedManyWithoutEstoqueInput
  }

  export type EstoqueItemCreateOrConnectWithoutMovimentacoesInput = {
    where: EstoqueItemWhereUniqueInput
    create: XOR<EstoqueItemCreateWithoutMovimentacoesInput, EstoqueItemUncheckedCreateWithoutMovimentacoesInput>
  }

  export type EstoqueItemUpsertWithoutMovimentacoesInput = {
    update: XOR<EstoqueItemUpdateWithoutMovimentacoesInput, EstoqueItemUncheckedUpdateWithoutMovimentacoesInput>
    create: XOR<EstoqueItemCreateWithoutMovimentacoesInput, EstoqueItemUncheckedCreateWithoutMovimentacoesInput>
    where?: EstoqueItemWhereInput
  }

  export type EstoqueItemUpdateToOneWithWhereWithoutMovimentacoesInput = {
    where?: EstoqueItemWhereInput
    data: XOR<EstoqueItemUpdateWithoutMovimentacoesInput, EstoqueItemUncheckedUpdateWithoutMovimentacoesInput>
  }

  export type EstoqueItemUpdateWithoutMovimentacoesInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localizacao?: EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput
    lotes?: EstoqueLoteUpdateManyWithoutEstoqueNestedInput
  }

  export type EstoqueItemUncheckedUpdateWithoutMovimentacoesInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    localizacaoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    lotes?: EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput
  }

  export type EstoqueItemCreateWithoutLotesInput = {
    id?: string
    insumoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
    localizacao: EstoqueLocalizacaoCreateNestedOneWithoutEstoquesInput
    movimentacoes?: EstoqueMovimentacaoCreateNestedManyWithoutEstoqueInput
  }

  export type EstoqueItemUncheckedCreateWithoutLotesInput = {
    id?: string
    insumoId: string
    localizacaoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
    movimentacoes?: EstoqueMovimentacaoUncheckedCreateNestedManyWithoutEstoqueInput
  }

  export type EstoqueItemCreateOrConnectWithoutLotesInput = {
    where: EstoqueItemWhereUniqueInput
    create: XOR<EstoqueItemCreateWithoutLotesInput, EstoqueItemUncheckedCreateWithoutLotesInput>
  }

  export type EstoqueItemUpsertWithoutLotesInput = {
    update: XOR<EstoqueItemUpdateWithoutLotesInput, EstoqueItemUncheckedUpdateWithoutLotesInput>
    create: XOR<EstoqueItemCreateWithoutLotesInput, EstoqueItemUncheckedCreateWithoutLotesInput>
    where?: EstoqueItemWhereInput
  }

  export type EstoqueItemUpdateToOneWithWhereWithoutLotesInput = {
    where?: EstoqueItemWhereInput
    data: XOR<EstoqueItemUpdateWithoutLotesInput, EstoqueItemUncheckedUpdateWithoutLotesInput>
  }

  export type EstoqueItemUpdateWithoutLotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    localizacao?: EstoqueLocalizacaoUpdateOneRequiredWithoutEstoquesNestedInput
    movimentacoes?: EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput
  }

  export type EstoqueItemUncheckedUpdateWithoutLotesInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    localizacaoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    movimentacoes?: EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput
  }

  export type EstoqueItemCreateManyLocalizacaoInput = {
    id?: string
    insumoId: string
    quantidadeAtual?: Decimal | DecimalJsLike | number | string
    quantidadeReservada?: Decimal | DecimalJsLike | number | string
    estoqueMinimo?: Decimal | DecimalJsLike | number | string
    estoqueMaximo?: Decimal | DecimalJsLike | number | string | null
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
    dataUltimaMov?: Date | string | null
  }

  export type EstoqueItemUpdateWithoutLocalizacaoInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    movimentacoes?: EstoqueMovimentacaoUpdateManyWithoutEstoqueNestedInput
    lotes?: EstoqueLoteUpdateManyWithoutEstoqueNestedInput
  }

  export type EstoqueItemUncheckedUpdateWithoutLocalizacaoInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    movimentacoes?: EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueNestedInput
    lotes?: EstoqueLoteUncheckedUpdateManyWithoutEstoqueNestedInput
  }

  export type EstoqueItemUncheckedUpdateManyWithoutLocalizacaoInput = {
    id?: StringFieldUpdateOperationsInput | string
    insumoId?: StringFieldUpdateOperationsInput | string
    quantidadeAtual?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeReservada?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMinimo?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    estoqueMaximo?: NullableDecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string | null
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
    dataUltimaMov?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
  }

  export type EstoqueMovimentacaoCreateManyEstoqueInput = {
    id?: string
    tipo: $Enums.TipoMovimentacao
    quantidade: Decimal | DecimalJsLike | number | string
    quantidadeAnterior: Decimal | DecimalJsLike | number | string
    quantidadePosterior: Decimal | DecimalJsLike | number | string
    documentoRef?: string | null
    orcamentoId?: string | null
    usuarioId: string
    lojaId: string
    dataMovimentacao?: Date | string
    observacoes?: string | null
  }

  export type EstoqueLoteCreateManyEstoqueInput = {
    id?: string
    numeroLote: string
    dataFabricacao?: Date | string | null
    dataValidade?: Date | string | null
    quantidadeLote: Decimal | DecimalJsLike | number | string
    status?: $Enums.StatusLote
    lojaId: string
    createdAt?: Date | string
    updatedAt?: Date | string
  }

  export type EstoqueMovimentacaoUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string
    tipo?: EnumTipoMovimentacaoFieldUpdateOperationsInput | $Enums.TipoMovimentacao
    quantidade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null
    usuarioId?: StringFieldUpdateOperationsInput | string
    lojaId?: StringFieldUpdateOperationsInput | string
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EstoqueMovimentacaoUncheckedUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string
    tipo?: EnumTipoMovimentacaoFieldUpdateOperationsInput | $Enums.TipoMovimentacao
    quantidade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null
    usuarioId?: StringFieldUpdateOperationsInput | string
    lojaId?: StringFieldUpdateOperationsInput | string
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EstoqueMovimentacaoUncheckedUpdateManyWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string
    tipo?: EnumTipoMovimentacaoFieldUpdateOperationsInput | $Enums.TipoMovimentacao
    quantidade?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadeAnterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    quantidadePosterior?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    documentoRef?: NullableStringFieldUpdateOperationsInput | string | null
    orcamentoId?: NullableStringFieldUpdateOperationsInput | string | null
    usuarioId?: StringFieldUpdateOperationsInput | string
    lojaId?: StringFieldUpdateOperationsInput | string
    dataMovimentacao?: DateTimeFieldUpdateOperationsInput | Date | string
    observacoes?: NullableStringFieldUpdateOperationsInput | string | null
  }

  export type EstoqueLoteUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string
    numeroLote?: StringFieldUpdateOperationsInput | string
    dataFabricacao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dataValidade?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quantidadeLote?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstoqueLoteUncheckedUpdateWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string
    numeroLote?: StringFieldUpdateOperationsInput | string
    dataFabricacao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dataValidade?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quantidadeLote?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type EstoqueLoteUncheckedUpdateManyWithoutEstoqueInput = {
    id?: StringFieldUpdateOperationsInput | string
    numeroLote?: StringFieldUpdateOperationsInput | string
    dataFabricacao?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    dataValidade?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    quantidadeLote?: DecimalFieldUpdateOperationsInput | Decimal | DecimalJsLike | number | string
    status?: EnumStatusLoteFieldUpdateOperationsInput | $Enums.StatusLote
    lojaId?: StringFieldUpdateOperationsInput | string
    createdAt?: DateTimeFieldUpdateOperationsInput | Date | string
    updatedAt?: DateTimeFieldUpdateOperationsInput | Date | string
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}