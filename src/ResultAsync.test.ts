import { ResultAsync } from './ResultAsync'
import { Err, Ok, Result } from './Result'
import { Nothing, Just } from './Maybe'

describe('ResultAsync', () => {
  test('fantasy-land', () => {
    expect(ResultAsync(async () => {}).constructor).toEqual(ResultAsync)
  })

  test('liftResult', () => {
    ResultAsync(async ({ liftResult }) => {
      const value: 5 = await liftResult(Ok<5>(5))
    })
  })

  test('fromPromise', () => {
    ResultAsync(async ({ fromPromise }) => {
      const value: 5 = await fromPromise(Promise.resolve(Ok<5>(5)))
    })
  })

  test('throwE', async () => {
    const ea = ResultAsync<string, number>(async ({ liftResult, throwE }) => {
      const value: 5 = await liftResult(Ok<5>(5))
      throwE('Test')
      return value
    })

    expect(await ea.run()).toEqual(Err('Test'))
  })

  test('try/catch', async () => {
    const ea = ResultAsync<string, void>(async ({ fromPromise, throwE }) => {
      try {
        await fromPromise(Promise.reject('shouldnt show'))
      } catch {
        throwE('should show')
      }
    })

    expect(await ea.run()).toEqual(Err('should show'))
  })

  test('Promise compatibility', async () => {
    const result = await ResultAsync<string, never>(() => {
      throw 'Err'
    })

    const result2 = await ResultAsync<never, string>(async () => {
      return 'A'
    })

    expect(result).toEqual(Err('Err'))
    expect(result2).toEqual(Ok('A'))
  })

  test('bimap', async () => {
    const newResultAsync = ResultAsync(() => Promise.resolve(5)).bimap(
      (_) => 'err',
      (_) => 'ok'
    )
    const newResultAsync2 = ResultAsync(() => Promise.resolve(5))[
      'fantasy-land/bimap'
    ](
      (_) => 'err',
      (_) => 'ok'
    )
    const newResultAsync3 = ResultAsync(() => {
      throw ''
    }).bimap(
      (_) => 'err',
      (_) => 'ok'
    )
    const newResultAsync4 = ResultAsync(() => {
      throw ''
    })['fantasy-land/bimap'](
      (_) => 'err',
      (_) => 'ok'
    )

    expect(await newResultAsync.run()).toEqual(Ok('ok'))
    expect(await newResultAsync2.run()).toEqual(Ok('ok'))
    expect(await newResultAsync3.run()).toEqual(Err('err'))
    expect(await newResultAsync4.run()).toEqual(Err('err'))
  })

  test('map', async () => {
    const newResultAsync = ResultAsync(() => Promise.resolve(5)).map(
      (_) => 'val'
    )
    const newResultAsync2 = ResultAsync(() => Promise.resolve(5))[
      'fantasy-land/map'
    ]((_) => 'val')

    expect(await newResultAsync.run()).toEqual(Ok('val'))
    expect(await newResultAsync2.run()).toEqual(Ok('val'))
  })

  test('mapErr', async () => {
    const newResultAsync = ResultAsync<number, never>(() =>
      Promise.reject(0)
    ).mapErr((x) => x + 1)

    const newResultAsync2 = ResultAsync<never, number>(() =>
      Promise.resolve(0)
    ).mapErr((x) => x + 1)

    expect(await newResultAsync.run()).toEqual(Err(1))
    expect(await newResultAsync2.run()).toEqual(Ok(0))
  })

  test('chain', async () => {
    const newResultAsync = ResultAsync(() => Promise.resolve(5)).chain((_) =>
      ResultAsync(() => Promise.resolve('val'))
    )
    const newResultAsync2 = ResultAsync(() => Promise.resolve(5))[
      'fantasy-land/chain'
    ]((_) => ResultAsync(() => Promise.resolve('val')))

    expect(await newResultAsync.run()).toEqual(Ok('val'))
    expect(await newResultAsync2.run()).toEqual(Ok('val'))
  })

  test('chain (with PromiseLike)', async () => {
    const newResultAsync = ResultAsync(() => Promise.resolve(5)).chain((_) =>
      Promise.resolve(Ok('val'))
    )
    const newResultAsync2 = ResultAsync(() => Promise.resolve(5))[
      'fantasy-land/chain'
    ]((_) => Promise.resolve(Ok('val')))

    expect(await newResultAsync.run()).toEqual(Ok('val'))
    expect(await newResultAsync2.run()).toEqual(Ok('val'))
  })

  test('chainErr', async () => {
    const newResultAsync = ResultAsync(() => Promise.resolve(5)).chainErr(
      (_) => ResultAsync(() => Promise.resolve(7))
    )
    const newResultAsync2 = ResultAsync<number, number>(() =>
      Promise.reject(5)
    ).chainErr((e) => ResultAsync(() => Promise.resolve(e + 1)))

    expect(await newResultAsync.run()).toEqual(Ok(5))
    expect(await newResultAsync2.run()).toEqual(Ok(6))
  })

  test('chainErr (with PromiseLike)', async () => {
    const newResultAsync = ResultAsync(() => Promise.resolve(5)).chainErr(
      (_) => Promise.resolve(Ok(7))
    )
    const newResultAsync2 = ResultAsync<number, number>(() =>
      Promise.reject(5)
    ).chainErr((e) => Promise.resolve(Ok(e + 1)))

    expect(await newResultAsync.run()).toEqual(Ok(5))
    expect(await newResultAsync2.run()).toEqual(Ok(6))
  })

  test('toMaybeAsync', async () => {
    const ma = ResultAsync(({ liftResult }) => liftResult(Err('123')))

    expect(await ma.toMaybeAsync().run()).toEqual(Nothing)

    const ma2 = ResultAsync(({ liftResult }) => liftResult(Ok(5)))

    expect(await ma2.toMaybeAsync().run()).toEqual(Just(5))
  })

  test('swap', async () => {
    const resultAsyncOk = ResultAsync(() => Promise.resolve(5))
    expect(await resultAsyncOk.swap().run()).toEqual(Err(5))

    const resultAsyncErr = ResultAsync(async () => Promise.reject('fail'))
    expect(await resultAsyncErr.swap().run()).toEqual(Ok('fail'))
  })

  test('ifErr', async () => {
    let a = 0
    await ResultAsync.liftResult(Err('Error')).ifErr(() => {
      a = 5
    })
    expect(a).toEqual(5)

    let b = 0
    await ResultAsync.liftResult(Ok(5)).ifErr(() => {
      b = 5
    })
    expect(b).toEqual(0)
  })

  test('ifOk', async () => {
    let a = 0
    await ResultAsync.liftResult(Err('Error')).ifOk(() => {
      a = 5
    })
    expect(a).toEqual(0)

    let b = 0
    await ResultAsync.liftResult(Ok(5)).ifOk(() => {
      b = 5
    })
    expect(b).toEqual(5)
  })

  describe('run', () => {
    it('resolves to Err if any of the async Results are Err', async () => {
      expect(
        await ResultAsync(({ fromPromise }) =>
          fromPromise(Promise.resolve(Err('Error')))
        ).run()
      ).toEqual(Err('Error'))
    })

    it('resolves to a Err with the rejected value if there is a rejected promise', async () => {
      expect(
        await ResultAsync<void, never>(({ fromPromise }) =>
          fromPromise(Promise.reject('Some error'))
        ).run()
      ).toEqual(Err('Some error'))
    })

    it('resolves to Err with an exception if there is an exception thrown', async () => {
      expect(
        await ResultAsync(() => {
          throw new Error('!')
        }).run()
      ).toEqual(Err(Error('!')))
    })

    it('resolve to Ok if the promise resolves successfully', async () => {
      expect(
        await ResultAsync(({ fromPromise }) =>
          fromPromise(Promise.resolve(Ok(5)))
        ).run()
      ).toEqual(Ok(5))
    })
  })

  test('errOrDefault', async () => {
    const resultAsyncOk = ResultAsync(() => Promise.resolve(5))
    expect(await resultAsyncOk.errOrDefault(5)).toEqual(5)

    const resultAsyncErr = ResultAsync(async () => Promise.reject('fail'))
    expect(await resultAsyncErr.errOrDefault(5)).toEqual('fail')
  })

  test('orDefault', async () => {
    const resultAsyncOk = ResultAsync(() => Promise.resolve(5))
    expect(await resultAsyncOk.orDefault(10)).toEqual(5)

    const resultAsyncErr = ResultAsync<string, number>(async () =>
      Promise.reject('fail')
    )
    expect(await resultAsyncErr.orDefault(5)).toEqual(5)
  })

  test('join', async () => {
    const ea = ResultAsync(async () => 1).map((x) =>
      ResultAsync(async () => x + 1)
    )

    expect(await ea.join()).toEqual(Ok(2))

    const ea2 = ResultAsync(async () => 1).map(() =>
      ResultAsync(async () => {
        throw 'Err'
      })
    )

    expect(await ea2.join()).toEqual(Err('Err'))

    const ea3 = ResultAsync(async () => {
      throw 'Err'
    })

    expect(await ea3.join()).toEqual(Err('Err'))
  })

  test('ap', async () => {
    expect(
      await ResultAsync.liftResult(Ok(5)).ap(
        ResultAsync(async () => (x: number) => x + 1)
      )
    ).toEqual(Ok(6))
    expect(
      await ResultAsync.liftResult(Ok(5)).ap(
        ResultAsync(() => {
          throw 'Error'
        })
      )
    ).toEqual(Err('Error'))
    expect(
      await ResultAsync.liftResult(Err('Error')).ap(
        ResultAsync(async () => (x: number) => x + 1)
      )
    ).toEqual(Err('Error'))
    expect(
      await ResultAsync.liftResult(Err('Error')).ap(
        ResultAsync(() => {
          throw 'Function Error'
        })
      )
    ).toEqual(Err('Function Error'))

    expect(
      await ResultAsync.liftResult(Ok(5))['fantasy-land/ap'](
        ResultAsync(async () => (x: number) => x + 1)
      )
    ).toEqual(Ok(6))
  })

  test('alt', async () => {
    expect(
      await ResultAsync.liftResult(Err('Error')).alt(
        ResultAsync.liftResult(Err('Error!'))
      )
    ).toEqual(Err('Error!'))
    expect(
      await ResultAsync.liftResult(Err('Error')).alt(
        ResultAsync.liftResult(Ok(5) as any)
      )
    ).toEqual(Ok(5))
    expect(
      await ResultAsync.liftResult(Ok(5)).alt(
        ResultAsync.liftResult(Err('Error') as any)
      )
    ).toEqual(Ok(5))
    expect(
      await ResultAsync.liftResult(Ok(5)).alt(
        ResultAsync.liftResult(Ok(6))
      )
    ).toEqual(Ok(5))

    expect(
      await ResultAsync.liftResult(Ok(5))['fantasy-land/alt'](
        ResultAsync.liftResult(Ok(6))
      )
    ).toEqual(Ok(5))
  })

  test('extend', async () => {
    expect(
      await ResultAsync.liftResult<string, number>(Err('Error')).extend((x) =>
        x.orDefault(6)
      )
    ).toEqual(Err('Error'))
    expect(
      await ResultAsync.liftResult(Ok(5)).extend((x) => x.orDefault(6))
    ).toEqual(Ok(5))

    expect(
      await ResultAsync.liftResult(Ok(5))['fantasy-land/extend']((x) =>
        x.orDefault(6)
      )
    ).toEqual(Ok(5))
  })

  test('fromPromise static', async () => {
    expect(
      await ResultAsync.fromPromise(() => Promise.resolve(Ok(5))).run()
    ).toEqual(Ok(5))
    expect(
      await ResultAsync.fromPromise(() => Promise.reject(5)).run()
    ).toEqual(Err(5))
  })

  test('liftResult static', async () => {
    expect(await ResultAsync.liftResult(Ok(5)).run()).toEqual(Ok(5))
    expect(await ResultAsync.liftResult(Err(5)).run()).toEqual(Err(5))
  })

  test('errs', async () => {
    expect(
      await ResultAsync.errs([
        ResultAsync.liftResult(Err('Error')),
        ResultAsync.liftResult(Err('Error2')),
        ResultAsync.liftResult(Ok(5))
      ])
    ).toEqual(['Error', 'Error2'])
  })

  test('oks', async () => {
    expect(
      await ResultAsync.oks([
        ResultAsync.liftResult(Ok(10)),
        ResultAsync.liftResult(Err('Error')),
        ResultAsync.liftResult(Ok(5))
      ])
    ).toEqual([10, 5])
  })

  test('sequence', async () => {
    expect(await ResultAsync.sequence([])).toEqual(Ok([]))

    const uncalledFn = jest.fn()

    expect(
      await ResultAsync.sequence([
        ResultAsync(
          () =>
            new Promise((_, reject) => {
              setTimeout(() => {
                reject('A')
              }, 200)
            })
        ),
        ResultAsync(uncalledFn)
      ])
    ).toEqual(Err('A'))

    expect(uncalledFn).toHaveBeenCalledTimes(0)

    const calledFn = jest.fn()

    expect(
      await ResultAsync.sequence([
        ResultAsync.liftResult(Ok(1)),
        ResultAsync(async () => {
          calledFn()
          return 2
        })
      ])
    ).toEqual(Ok([1, 2]))

    expect(calledFn).toHaveBeenCalledTimes(1)
  })

  test('all', async () => {
    expect(await ResultAsync.all([])).toEqual(Ok([]))

    const fn1 = jest.fn()

    expect(
      await ResultAsync.all([
        ResultAsync(
          () =>
            new Promise((_, reject) => {
              setTimeout(() => {
                reject('A')
              }, 200)
            })
        ),
        ResultAsync(async () => {
          fn1()
          return 2
        })
      ])
    ).toEqual(Err('A'))

    expect(fn1).toHaveBeenCalledTimes(1)

    const fn2 = jest.fn()

    expect(
      await ResultAsync.all([
        ResultAsync.liftResult(Ok(1)),
        ResultAsync(async () => {
          fn2()
          return 2
        })
      ])
    ).toEqual(Ok([1, 2]))

    expect(fn2).toHaveBeenCalledTimes(1)
  })

  test('throwing in some method', async () => {
    const ea = ResultAsync(async () => 5).map(() => {
      throw 'AAA'
    })

    expect(await ea).toEqual(Err('AAA'))
  })

  test('void', async () => {
    const ea: ResultAsync<string, void> = ResultAsync<string, number>(
      async () => 5
    ).void()

    expect(await ea).toEqual(Ok(undefined))
  })

  test('caseOf', async () => {
    expect(
      await ResultAsync.liftResult(Err('Error')).caseOf({
        Err: (x) => x,
        Ok: () => 'No error'
      })
    ).toEqual('Error')
    expect(
      await ResultAsync.liftResult(Ok(6)).caseOf({
        Err: (_) => 0,
        Ok: (x) => x + 1
      })
    ).toEqual(7)
    expect(
      await ResultAsync.liftResult(Ok(6)).caseOf({ _: () => 0 })
    ).toEqual(0)
    expect(
      await ResultAsync.liftResult(Err('Error')).caseOf({ _: () => 0 })
    ).toEqual(0)
  })

  test('finally', async () => {
    let a = 0
    await ResultAsync.liftResult(Err('Error')).finally(() => {
      a = 5
    })
    expect(a).toEqual(5)

    let b = 0
    await ResultAsync.liftResult(Ok(5)).finally(() => {
      b = 5
    })
    expect(b).toEqual(5)
  })
})
