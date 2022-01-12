import { Result, ResultPatterns, Err, Ok } from './Result'
import { MaybeAsync } from './MaybeAsync'

export interface ResultAsyncTypeRef {
  /** Constructs an `ResultAsync` object from a function that takes an object full of helpers that let you lift things into the `ResultAsync` context and returns a Promise */
  <E, T>(
    runPromise: (helpers: ResultAsyncHelpers<E>) => PromiseLike<T>
  ): ResultAsync<E, T>
  /** Constructs an `ResultAsync` object from a function that returns an Result wrapped in a Promise */
  fromPromise<E, T>(f: () => PromiseLike<Result<E, T>>): ResultAsync<E, T>
  /** Constructs an `ResultAsync` object from an Result */
  liftResult<E, T>(result: Result<E, T>): ResultAsync<E, T>
  /** Takes a list of `ResultAsync`s and returns a Promise that will resolve with all `Err` values. Internally it uses `Promise.all` to wait for all results */
  errs<E, T>(list: ResultAsync<E, T>[]): Promise<E[]>
  /** Takes a list of `ResultAsync`s and returns a Promise that will resolve with all `Ok` values. Internally it uses `Promise.all` to wait for all results */
  oks<E, T>(list: ResultAsync<E, T>[]): Promise<T[]>
  /** Turns a list of `ResultAsync`s into an `ResultAsync` of list. The returned `Promise` will be rejected as soon as a single `ResultAsync` resolves to a `Err`, it will not wait for all Promises to resolve and since `ResultAsync` is lazy, unlike `Promise`, the remaining async operations will not be executed at all */
  sequence<E, T>(eas: ResultAsync<E, T>[]): ResultAsync<E, T[]>
  /** The same as `ResultAsync.sequence`, but it will run all async operations at the same time rather than sequentially */
  all<E, T>(eas: ResultAsync<E, T>[]): ResultAsync<E, T[]>
}

export interface ResultAsync<E, T> extends PromiseLike<Result<E, T>> {
  /**
   * It's important to remember how `run` will behave because in an
   * async context there are other ways for a function to fail other
   * than to return a Nothing, for example:
   * If any of the computations inside ResultAsync resolved to a Err,
   * `run` will return a Promise resolved to that Err.
   * If any of the promises were to be rejected then `run` will return
   * a Promise resolved to a Err with the rejection value inside
   * If an exception is thrown then `run` will return a Promise
   * resolved to a Err with the exception inside
   * If none of the above happen then a promise resolved to the
   * returned value wrapped in a Ok will be returned
   */
  run(): Promise<Result<E, T>>
  /** Given two functions, maps the value that the Promise inside `this` resolves to using the first if it is `Err` or using the second one if it is `Ok` */
  bimap<E2, T2>(f: (value: E) => E2, g: (value: T) => T2): ResultAsync<E2, T2>
  /** Transforms the `Ok` value of `this` with a given function. If the `ResultAsync` that is being mapped resolves to a Err then the mapping function won't be called and `run` will resolve the whole thing to that Err, just like the regular Result#map */
  map<T2>(f: (value: T) => T2): ResultAsync<E, T2>
  /** Maps the `Err` value of `this`, acts like an identity if `this` is `Ok` */
  mapErr<E2>(f: (value: E) => E2): ResultAsync<E2, T>
  /** Transforms `this` with a function that returns a `ResultAsync`. Behaviour is the same as the regular Result#chain */
  chain<E2, T2>(
    f: (value: T) => PromiseLike<Result<E2, T2>>
  ): ResultAsync<E | E2, T2>
  /** The same as ResultAsync#chain but executes the transformation function only if the value is Err. Useful for recovering from errors */
  chainErr<E2, T2>(
    f: (value: E) => PromiseLike<Result<E2, T2>>
  ): ResultAsync<E2, T | T2>
  /** Flattens nested `ResultAsync`s. `e.join()` is equivalent to `e.chain(x => x)` */
  join<T2>(this: ResultAsync<E, ResultAsync<E, T2>>): ResultAsync<E, T2>
  /** Converts `this` to a MaybeAsync, discarding any error values */
  toMaybeAsync(): MaybeAsync<T>
  /** Returns `Ok` if `this` is `Err` and vice versa */
  swap(): ResultAsync<T, E>
  /** Runs an effect if `this` is `Err`, returns `this` to make chaining other methods possible */
  ifErr(effect: (value: E) => any): ResultAsync<E, T>
  /** Runs an effect if `this` is `Ok`, returns `this` to make chaining other methods possible */
  ifOk(effect: (value: T) => any): ResultAsync<E, T>
  /** Applies a `Ok` function wrapped in `ResultAsync` over a future `Ok` value. Returns `Err` if result the `this` resolves to a `Err` or the function is `Err` */
  ap<T2>(other: PromiseLike<Result<E, (value: T) => T2>>): ResultAsync<E, T2>
  /** Returns the first `Ok` between the future value of `this` and another `ResultAsync` or the `Err` in the argument if both `this` and the argument resolve to `Err` */
  alt(other: ResultAsync<E, T>): ResultAsync<E, T>
  /** Returns `this` if it resolves to a `Err`, otherwise it returns the result of applying the function argument to `this` and wrapping it in a `Ok` */
  extend<T2>(f: (value: ResultAsync<E, T>) => T2): ResultAsync<E, T2>
  /** Returns a Promise that resolves to the value inside `this` if it\'s `Err` or a default value if `this` is `Ok` */
  errOrDefault(defaultValue: E): Promise<E>
  /** Returns a Promise that resolves to the value inside `this` if it\'s `Ok` or a default value if `this` is `Err` */
  orDefault(defaultValue: T): Promise<T>
  /** Useful if you are not interested in the result of an operation */
  void(): ResultAsync<E, void>
  /** Structural pattern matching for `ResultAsync` in the form of a function */
  caseOf<U>(patterns: ResultPatterns<E, T, U>): Promise<U>
  /* Similar to the Promise method of the same name, the provided function is called when the `ResultAsync` is executed regardless of whether the `Result` result is `Err` or `Ok` */
  finally(effect: () => any): ResultAsync<E, T>

  'fantasy-land/map'<T2>(f: (value: T) => T2): ResultAsync<E, T2>
  'fantasy-land/bimap'<E2, T2>(
    f: (value: E) => E2,
    g: (value: T) => T2
  ): ResultAsync<E2, T2>
  'fantasy-land/chain'<T2>(
    f: (value: T) => PromiseLike<Result<E, T2>>
  ): ResultAsync<E, T2>
  'fantasy-land/ap'<T2>(
    other: ResultAsync<E, (value: T) => T2>
  ): ResultAsync<E, T2>
  'fantasy-land/alt'(other: ResultAsync<E, T>): ResultAsync<E, T>
  'fantasy-land/extend'<T2>(
    f: (value: ResultAsync<E, T>) => T2
  ): ResultAsync<E, T2>
  /** WARNING: This is implemented only for Promise compatibility. Please use `chain` instead. */
  then: PromiseLike<Result<E, T>>['then']
}

export interface ResultAsyncValue<T> extends PromiseLike<T> {}

export interface ResultAsyncHelpers<E> {
  /** Allows you to take a regular Result value and lift it to the `ResultAsync` context. Awaiting a lifted Result will give you the `Ok` value inside. If the Result is Err then the function will exit immediately and ResultAsync will resolve to that Err after running it */
  liftResult<T>(result: Result<E, T>): ResultAsyncValue<T>
  /** Allows you to take an Result inside a Promise and lift it to the `ResultAsync` context. Awaiting a lifted Promise<Result> will give you the `Ok` value inside the Result. If the Result is Err or the Promise is rejected then the function will exit immediately and MaybeAsync will resolve to that Err or the rejection value after running it */
  fromPromise<T>(promise: PromiseLike<Result<E, T>>): ResultAsyncValue<T>
  /** A type safe version of throwing an exception. Unlike the Error constructor, which will take anything, throwE only accepts values of the same type as the Err part of the Result */
  throwE(error: E): never
}

const helpers: ResultAsyncHelpers<any> = {
  liftResult<L, R>(result: Result<L, R>): ResultAsyncValue<R> {
    if (result.isOk()) {
      return Promise.resolve(result.extract())
    }

    throw result.extract()
  },
  fromPromise<L, R>(promise: PromiseLike<Result<L, R>>): ResultAsyncValue<R> {
    return promise.then(helpers.liftResult) as ResultAsyncValue<R>
  },
  throwE<E>(error: E): never {
    throw error
  }
}

class ResultAsyncImpl<E, R> implements ResultAsync<E, R> {
  [Symbol.toStringTag]: 'ResultAsync' = 'ResultAsync'

  constructor(
    private runPromise: (helpers: ResultAsyncHelpers<E>) => PromiseLike<R>
  ) {}

  errOrDefault(defaultValue: E): Promise<E> {
    return this.run().then((x) => x.errOrDefault(defaultValue))
  }

  orDefault(defaultValue: R): Promise<R> {
    return this.run().then((x) => x.orDefault(defaultValue))
  }

  join<T2>(this: ResultAsync<E, ResultAsync<E, T2>>): ResultAsync<E, T2> {
    return ResultAsync(async (helpers) => {
      const result = await this
      if (result.isOk()) {
        const nestedResult = await result.extract()
        return helpers.liftResult(nestedResult)
      }
      return helpers.liftResult(result as any as Result<E, T2>)
    })
  }

  ap<T2>(
    resultF: PromiseLike<Result<E, (value: R) => T2>>
  ): ResultAsync<E, T2> {
    return ResultAsync(async (helpers) => {
      const otherValue = await resultF

      if (otherValue.isOk()) {
        const thisValue = await this

        if (thisValue.isOk()) {
          return otherValue.extract()(thisValue.extract())
        } else {
          return helpers.liftResult(thisValue as any as Result<E, T2>)
        }
      }

      return helpers.liftResult(otherValue as any as Result<E, T2>)
    })
  }

  alt(other: ResultAsync<E, R>): ResultAsync<E, R> {
    return ResultAsync(async (helpers) => {
      const thisValue = await this

      if (thisValue.isOk()) {
        return thisValue.extract()
      } else {
        const otherValue = await other
        return helpers.liftResult(otherValue)
      }
    })
  }

  extend<T2>(f: (value: ResultAsync<E, R>) => T2): ResultAsync<E, T2> {
    return ResultAsync(async (helpers) => {
      const result = await this.run()
      if (result.isOk()) {
        const v = ResultAsync.liftResult(result)
        return helpers.liftResult(Ok(f(v)))
      }
      return helpers.liftResult(result as any as Result<E, T2>)
    })
  }

  async run(): Promise<Result<E, R>> {
    try {
      return Ok(await this.runPromise(helpers))
    } catch (e: any) {
      return Err(e)
    }
  }

  bimap<E2, T2>(f: (value: E) => E2, g: (value: R) => T2): ResultAsync<E2, T2> {
    return ResultAsync(async (helpers) => {
      const result = await this.run()
      return helpers.liftResult(result.bimap(f, g))
    })
  }

  map<T2>(f: (value: R) => T2): ResultAsync<E, T2> {
    return ResultAsync((helpers) => this.runPromise(helpers).then(f))
  }

  mapErr<E2>(f: (value: E) => E2): ResultAsync<E2, R> {
    return ResultAsync(async (helpers) => {
      try {
        return await this.runPromise(helpers as any as ResultAsyncHelpers<E>)
      } catch (e: any) {
        throw f(e)
      }
    })
  }

  chain<E2, T2>(
    f: (value: R) => PromiseLike<Result<E2, T2>>
  ): ResultAsync<E | E2, T2> {
    return ResultAsync(async (helpers) => {
      const value = await this.runPromise(helpers)
      return helpers.fromPromise(f(value))
    })
  }

  chainErr<E2, T2>(
    f: (value: E) => PromiseLike<Result<E2, T2>>
  ): ResultAsync<E2, R | T2> {
    return ResultAsync(async (helpers) => {
      try {
        return await this.runPromise(helpers as any as ResultAsyncHelpers<E>)
      } catch (e: any) {
        return helpers.fromPromise(f(e))
      }
    })
  }

  toMaybeAsync(): MaybeAsync<R> {
    return MaybeAsync(async ({ liftMaybe }) => {
      const result = await this.run()
      return liftMaybe(result.toMaybe())
    })
  }

  swap(): ResultAsync<R, E> {
    return ResultAsync(async (helpers) => {
      const result = await this.run()
      if (result.isOk()) helpers.throwE(result.extract() as R)
      return helpers.liftResult(Ok(result.extract() as E))
    })
  }

  ifErr(effect: (value: E) => any): ResultAsync<E, R> {
    return ResultAsync(async (helpers) => {
      const result = await this.run()
      result.ifErr(effect)
      return helpers.liftResult(result)
    })
  }

  ifOk(effect: (value: R) => any): ResultAsync<E, R> {
    return ResultAsync(async (helpers) => {
      const result = await this.run()
      result.ifOk(effect)
      return helpers.liftResult(result)
    })
  }

  void(): ResultAsync<E, void> {
    return this.map((_) => {})
  }

  caseOf<U>(patterns: ResultPatterns<E, R, U>): Promise<U> {
    return this.run().then((x) => x.caseOf(patterns))
  }

  finally(effect: () => any): ResultAsync<E, R> {
    return ResultAsync(({ fromPromise }) =>
      fromPromise(this.run().finally(effect))
    )
  }

  'fantasy-land/map' = this.map
  'fantasy-land/bimap' = this.bimap
  'fantasy-land/chain' = this.chain
  'fantasy-land/ap' = this.ap
  'fantasy-land/extend' = this.extend
  'fantasy-land/alt' = this.alt

  then: PromiseLike<Result<E, R>>['then'] = (onfulfilled, onrejected) => {
    return this.run().then(onfulfilled, onrejected)
  }
}

export const ResultAsync: ResultAsyncTypeRef = Object.assign(
  <L, R>(
    runPromise: (helpers: ResultAsyncHelpers<L>) => PromiseLike<R>
  ): ResultAsync<L, R> => new ResultAsyncImpl(runPromise),
  {
    fromPromise: <L, R>(
      f: () => PromiseLike<Result<L, R>>
    ): ResultAsync<L, R> => ResultAsync(({ fromPromise: fP }) => fP(f())),
    liftResult: <L, R>(result: Result<L, R>): ResultAsync<L, R> =>
      ResultAsync(({ liftResult }) => liftResult(result)),
    errs: <L, R>(list: ResultAsync<L, R>[]): Promise<L[]> =>
      Promise.all(list.map((x) => x.run())).then(Result.errs),
    oks: <L, R>(list: ResultAsync<L, R>[]): Promise<R[]> =>
      Promise.all(list.map((x) => x.run())).then(Result.oks),
    sequence: <L, T>(eas: ResultAsync<L, T>[]): ResultAsync<L, T[]> =>
      ResultAsync(async (helpers) => {
        let res: T[] = []

        for await (const e of eas) {
          if (e.isErr()) {
            return helpers.liftResult(e)
          }

          res.push(e.extract() as T)
        }

        return helpers.liftResult(Ok(res))
      }),
    all: <L, R>(eas: ResultAsync<L, R>[]): ResultAsync<L, R[]> =>
      ResultAsync.fromPromise(async () =>
        Promise.all(eas).then(Result.sequence)
      )
  }
)

ResultAsyncImpl.prototype.constructor = ResultAsync
