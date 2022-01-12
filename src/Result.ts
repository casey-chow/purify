import { Maybe, Just, Nothing } from './Maybe'

export type ResultPatterns<E, T, U> =
  | { Err: (l: E) => U; Ok: (r: T) => U }
  | { _: () => U }

/**
 * @template E the error type
 * @template T the ok type
 */
export interface Result<E, T> {
  /** Returns true if `this` is `Err`, otherwise it returns false */
  isErr(): this is Result<E, never>
  /** Returns true if `this` is `Ok`, otherwise it returns false */
  isOk(): this is Result<never, T>
  toJSON(): E | T
  inspect(): string
  toString(): string
  /** Given two functions, maps the value inside `this` using the first if `this` is `Err` or using the second one if `this` is `Ok`.
   * If both functions return the same type consider using `Result#result` instead
   */
  bimap<E2, T2>(f: (value: E) => E2, g: (value: T) => T2): Result<E2, T2>
  /** Maps the `Ok` value of `this`, acts like an identity if `this` is `Err` */
  map<T2>(f: (value: T) => T2): Result<E, T2>
  /** Maps the `Err` value of `this`, acts like an identity if `this` is `Ok` */
  mapErr<E2>(f: (value: E) => E2): Result<E2, T>
  /** Applies a `Ok` function over a `Ok` value. Returns `Err` if result `this` or the function are `Err` */
  ap<T2>(other: Result<E, (value: T) => T2>): Result<E, T2>
  /** Compares `this` to another `Result`, returns false if the constructors or the values inside are different, e.g. `Ok(5).equals(Err(5))` is false */
  equals(other: Result<E, T>): boolean
  /** Transforms `this` with a function that returns an `Result`. Useful for chaining many computations that may fail */
  chain<E2, T2>(f: (value: T) => Result<E2, T2>): Result<E | E2, T2>
  /** The same as Result#chain but executes the transformation function only if the value is Err. Useful for recovering from errors */
  chainErr<E2, T2>(f: (value: E) => Result<E2, T2>): Result<E2, T | T2>
  /** Flattens nested Results. `e.join()` is equivalent to `e.chain(x => x)` */
  join<T2>(this: Result<E, Result<E, T2>>): Result<E, T2>
  /** Returns the first `Ok` between `this` and another `Result` or the `Err` in the argument if both `this` and the argument are `Err` */
  alt(other: Result<E, T>): Result<E, T>
  /** Lazy version of `alt` */
  altLazy(other: () => Result<E, T>): Result<E, T>
  /** Takes a reducer and an initial value and returns the initial value if `this` is `Err` or the result of applying the function to the initial value and the value inside `this` */
  reduce<U>(reducer: (accumulator: U, value: T) => U, initialValue: U): U
  /** Returns `this` if it's a `Err`, otherwise it returns the result of applying the function argument to `this` and wrapping it in a `Ok` */
  extend<T2>(f: (value: Result<E, T>) => T2): Result<E, T2>
  /** Returns the value inside `this` if it's a `Ok` or result throws the value or a generic exception depending on whether the value is an Error */
  unsafeCoerce(): T
  /** Structural pattern matching for `Result` in the form of a function */
  caseOf<U>(patterns: ResultPatterns<E, T, U>): U
  /** Returns the value inside `this` if it\'s `Err` or a default value if `this` is `Ok` */
  errOrDefault(defaultValue: E): E
  /** Returns the value inside `this` if it\'s `Ok` or a default value if `this` is `Err` */
  orDefault(defaultValue: T): T
  /** Lazy version of `orDefault`. Takes a function that returns the default value, that function will be called only if `this` is `Err` */
  orDefaultLazy(getDefaultValue: () => T): T
  /** Lazy version of `errOrDefault`. Takes a function that returns the default value, that function will be called only if `this` is `Ok` */
  errOrDefaultLazy(getDefaultValue: () => E): E
  /** Runs an effect if `this` is `Err`, returns `this` to make chaining other methods possible */
  ifErr(effect: (value: E) => any): this
  /** Runs an effect if `this` is `Ok`, returns `this` to make chaining other methods possible */
  ifOk(effect: (value: T) => any): this
  /** Constructs a `Just` with the value of `this` if it\'s `Ok` or a `Nothing` if `this` is `Err` */
  toMaybe(): Maybe<T>
  /** Constructs a `Just` with the value of `this` if it\'s `Err` or a `Nothing` if `this` is `Ok` */
  errToMaybe(): Maybe<E>
  /** Extracts the value out of `this` */
  extract(): E | T
  /** Returns `Ok` if `this` is `Err` and vice versa */
  swap(): Result<T, E>

  'fantasy-land/bimap'<L2, R2>(
    f: (value: E) => L2,
    g: (value: T) => R2
  ): Result<L2, R2>
  'fantasy-land/map'<R2>(f: (value: T) => R2): Result<E, R2>
  'fantasy-land/ap'<R2>(other: Result<E, (value: T) => R2>): Result<E, R2>
  'fantasy-land/equals'(other: Result<E, T>): boolean
  'fantasy-land/chain'<L2, R2>(
    f: (value: T) => Result<L2, R2>
  ): Result<E | L2, R2>
  'fantasy-land/alt'(other: Result<E, T>): Result<E, T>
  'fantasy-land/reduce'<U>(
    reducer: (accumulator: U, value: T) => U,
    initialValue: U
  ): U
  'fantasy-land/extend'<R2>(f: (value: Result<E, T>) => R2): Result<E, R2>
}

interface ResultTypeRef {
  /** Takes a value and wraps it in a `Ok` */
  of<E, T>(value: T): Result<E, T>
  /** Takes a list of `Result`s and returns a list of all `Err` values */
  errs<E, T>(list: Result<E, T>[]): E[]
  /** Takes a list of `Result`s and returns a list of all `Ok` values */
  oks<E, T>(list: Result<E, T>[]): T[]
  /** Calls a function and returns a `Ok` with the return value or an exception wrapped in a `Err` in case of failure */
  encase<E extends Error, T>(throwsF: () => T): Result<E, T>
  /** Turns a list of `Result`s into an `Result` of list */
  sequence<E, T>(results: Result<E, T>[]): Result<E, T[]>
  isResult<E, T>(x: unknown): x is Result<E, T>

  'fantasy-land/of'<E, T>(value: T): Result<E, T>
}

export const Result: ResultTypeRef = {
  of<E, T>(value: T): Result<E, T> {
    return ok(value)
  },
  errs<E, T>(list: Result<E, T>[]): E[] {
    let result = []

    for (const x of list) {
      if (x.isErr()) {
        result.push(x.extract())
      }
    }

    return result
  },
  oks<E, T>(list: Result<E, T>[]): T[] {
    let result = []

    for (const x of list) {
      if (x.isOk()) {
        result.push(x.extract())
      }
    }

    return result
  },
  encase<E extends Error, T>(throwsF: () => T): Result<E, T> {
    try {
      return ok(throwsF())
    } catch (e: any) {
      return err(e)
    }
  },
  sequence<E, T>(results: Result<E, T>[]): Result<E, T[]> {
    let res: T[] = []

    for (const e of results) {
      if (e.isErr()) {
        return e
      }
      res.push(e.extract() as T)
    }

    return ok(res)
  },
  isResult<E, T>(x: unknown): x is Result<E, T> {
    return x instanceof Err || x instanceof Ok
  },

  'fantasy-land/of'<E, T>(value: T): Result<E, T> {
    return Result.of(value)
  }
}

class Ok<T, E = never> implements Result<E, T> {
  private _ = 'T'

  constructor(private __value: T) {}

  isErr(): false {
    return false
  }

  isOk(): true {
    return true
  }

  toJSON(): T {
    return this.__value
  }

  inspect(): string {
    return `Ok(${JSON.stringify(this.__value)})`
  }

  toString(): string {
    return this.inspect()
  }

  bimap<E2, T2>(_: (value: E) => E2, g: (value: T) => T2): Result<E2, T2> {
    return ok(g(this.__value))
  }

  map<T2>(f: (value: T) => T2): Result<E, T2> {
    return ok(f(this.__value))
  }

  mapErr<E2>(_: (value: E) => E2): Result<E2, T> {
    return this as any
  }

  ap<T2>(other: Result<E, (value: T) => T2>): Result<E, T2> {
    return other.isOk() ? this.map(other.extract()) : (other as any)
  }

  equals(other: Result<E, T>): boolean {
    return other.isOk() ? this.__value === other.extract() : false
  }

  chain<E2, T2>(f: (value: T) => Result<E2, T2>): Result<E | E2, T2> {
    return f(this.__value)
  }

  chainErr<E2, T2>(_: (value: E) => Result<E2, T2>): Result<E2, T | T2> {
    return this as any
  }

  join<T2>(this: Ok<Result<E, T2>, E>): Result<E, T2> {
    return this.__value as any
  }

  alt(_: Result<E, T>): Result<E, T> {
    return this
  }

  altLazy(_: () => Result<E, T>): Result<E, T> {
    return this
  }

  reduce<U>(reducer: (accumulator: U, value: T) => U, initialValue: U): U {
    return reducer(initialValue, this.__value)
  }

  extend<T2>(f: (value: Result<E, T>) => T2): Result<E, T2> {
    return ok(f(this))
  }

  unsafeCoerce(): T {
    return this.__value
  }

  caseOf<U>(patterns: ResultPatterns<E, T, U>): U {
    return '_' in patterns ? patterns._() : patterns.Ok(this.__value)
  }

  errOrDefault(defaultValue: E): E {
    return defaultValue
  }

  orDefault(_: T): T {
    return this.__value
  }

  orDefaultLazy(_: () => T): T {
    return this.__value
  }

  errOrDefaultLazy(getDefaultValue: () => E): E {
    return getDefaultValue()
  }

  ifErr(_: (value: E) => any): this {
    return this
  }

  ifOk(effect: (value: T) => any): this {
    return effect(this.__value), this
  }

  toMaybe(): Maybe<T> {
    return Just(this.__value)
  }

  errToMaybe(): Maybe<E> {
    return Nothing
  }

  extract(): E | T {
    return this.__value
  }

  swap(): Result<T, E> {
    return err(this.__value)
  }

  'fantasy-land/bimap' = this.bimap
  'fantasy-land/map' = this.map
  'fantasy-land/ap' = this.ap
  'fantasy-land/equals' = this.equals
  'fantasy-land/chain' = this.chain
  'fantasy-land/alt' = this.alt
  'fantasy-land/reduce' = this.reduce
  'fantasy-land/extend' = this.extend
}

Ok.prototype.constructor = Result as any

class Err<E, T = never> implements Result<E, T> {
  private _ = 'T'

  constructor(private __value: E) {}

  isErr(): true {
    return true
  }

  isOk(): false {
    return false
  }

  toJSON(): E {
    return this.__value
  }

  inspect(): string {
    return `Err(${JSON.stringify(this.__value)})`
  }

  toString(): string {
    return this.inspect()
  }

  bimap<E2, T2>(f: (value: E) => E2, _: (value: T) => T2): Result<E2, T2> {
    return err(f(this.__value))
  }

  map<T2>(_: (value: T) => T2): Result<E, T2> {
    return this as any
  }

  mapErr<E2>(f: (value: E) => E2): Result<E2, T> {
    return err(f(this.__value))
  }

  ap<T2>(other: Result<E, (value: T) => T2>): Result<E, T2> {
    return other.isErr() ? other : (this as any)
  }

  equals(other: Result<E, T>): boolean {
    return other.isErr() ? other.extract() === this.__value : false
  }

  chain<E2, T2>(_: (value: T) => Result<E2, T2>): Result<E | E2, T2> {
    return this as any
  }

  chainErr<L2, R2>(f: (value: E) => Result<L2, R2>): Result<L2, T | R2> {
    return f(this.__value)
  }

  join<T2>(this: Result<E, Result<E, T2>>): Result<E, T2> {
    return this as any
  }

  alt(other: Result<E, T>): Result<E, T> {
    return other
  }

  altLazy(other: () => Result<E, T>): Result<E, T> {
    return other()
  }

  reduce<U>(_: (accumulator: U, value: T) => U, initialValue: U): U {
    return initialValue
  }

  extend<T2>(_: (value: Result<E, T>) => T2): Result<E, T2> {
    return this as any
  }

  unsafeCoerce(): never {
    if (this.__value instanceof Error) {
      throw this.__value
    }

    throw new Error('Result#unsafeCoerce was ran on a Err')
  }

  caseOf<U>(patterns: ResultPatterns<E, T, U>): U {
    return '_' in patterns ? patterns._() : patterns.Err(this.__value)
  }

  errOrDefault(_: E): E {
    return this.__value
  }

  orDefault(defaultValue: T): T {
    return defaultValue
  }

  orDefaultLazy(getDefaultValue: () => T): T {
    return getDefaultValue()
  }

  errOrDefaultLazy(_: () => E): E {
    return this.__value
  }

  ifErr(effect: (value: E) => any): this {
    return effect(this.__value), this
  }

  ifOk(_: (value: T) => any): this {
    return this
  }

  toMaybe(): Maybe<T> {
    return Nothing
  }

  errToMaybe(): Maybe<E> {
    return Just(this.__value)
  }

  extract(): E | T {
    return this.__value
  }

  swap(): Result<T, E> {
    return ok(this.__value)
  }

  'fantasy-land/bimap' = this.bimap
  'fantasy-land/map' = this.map
  'fantasy-land/ap' = this.ap
  'fantasy-land/equals' = this.equals
  'fantasy-land/chain' = this.chain
  'fantasy-land/alt' = this.alt
  'fantasy-land/reduce' = this.reduce
  'fantasy-land/extend' = this.extend
}

Err.prototype.constructor = Result as any

const err = <E, T = never>(value: E): Result<E, T> => new Err(value)

const ok = <T, E = never>(value: T): Result<E, T> => new Ok(value)

export { err as Err, ok as Ok }
