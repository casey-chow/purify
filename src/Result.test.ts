import { Nothing, Just } from './Maybe'
import { Result, Err, Ok } from './Result'

const anything = Math.random()

describe('Result', () => {
  test('fantasy-land', () => {
    expect(Err(Error()).constructor).toEqual(Result)
    expect(Ok(5).constructor).toEqual(Result)
  })

  test('inspect', () => {
    expect(Err('Err').inspect()).toEqual('Err("Err")')
    expect(Ok(1).inspect()).toEqual('Ok(1)')
  })

  test('toString', () => {
    expect(Err('Err').toString()).toEqual('Err("Err")')
    expect(Ok(1).toString()).toEqual('Ok(1)')
  })

  test('toJSON', () => {
    expect(JSON.stringify(Err('Err'))).toEqual('"Err"')
    expect(JSON.stringify(Ok(1)).toString()).toEqual('1')
  })

  test('of', () => {
    expect(Result.of(5)).toEqual(Ok(5))
    expect(Result['fantasy-land/of'](5)).toEqual(Ok(5))
  })

  test('lefts', () => {
    expect(Result.errs([Err('Error'), Err('Error2'), Ok(5)])).toEqual([
      'Error',
      'Error2'
    ])
  })

  test('rights', () => {
    expect(Result.oks([Ok(10), Err('Error'), Ok(5)])).toEqual([10, 5])
  })

  test('encase', () => {
    expect(
      Result.encase(() => {
        throw new Error('a')
      })
    ).toEqual(Err(new Error('a')))
    expect(Result.encase(() => 10)).toEqual(Ok(10))
  })

  test('sequence', () => {
    expect(Result.sequence([])).toEqual(Ok([]))
    expect(Result.sequence([Ok(1), Ok(2)])).toEqual(Ok([1, 2]))
    expect(Result.sequence([Ok(1), Err('Nope')])).toEqual(Err('Nope'))
  })

  test('isResult', () => {
    expect(Result.isResult(Err(''))).toEqual(true)
    expect(Result.isResult(Ok(''))).toEqual(true)
    expect(Result.isResult(undefined)).toEqual(false)
    expect(Result.isResult('')).toEqual(false)
    expect(Result.isResult({})).toEqual(false)
  })

  test('isLeft', () => {
    expect(Err(anything).isErr()).toEqual(true)
    expect(Ok(anything).isErr()).toEqual(false)
  })

  test('isRight', () => {
    expect(Err(anything).isOk()).toEqual(false)
    expect(Ok(anything).isOk()).toEqual(true)
  })

  test('bimap', () => {
    expect(
      Err('Error').bimap(
        (x) => x + '!',
        (x) => x + 1
      )
    ).toEqual(Err('Error!'))
    expect(
      Ok(5).bimap(
        (x) => x + '!',
        (x) => x + 1
      )
    ).toEqual(Ok(6))

    expect(
      Err('Error')['fantasy-land/bimap'](
        (x) => x + '!',
        (x) => x + 1
      )
    ).toEqual(Err('Error!'))
    expect(
      Ok(5)['fantasy-land/bimap'](
        (x) => x + '!',
        (x) => x + 1
      )
    ).toEqual(Ok(6))
  })

  test('map', () => {
    expect(Err('Error').map((x) => x + 1)).toEqual(Err('Error'))
    expect(Ok(5).map((x) => x + 1)).toEqual(Ok(6))

    expect(Ok(5)['fantasy-land/map']((x) => x + 1)).toEqual(Ok(6))
  })

  test('mapLeft', () => {
    expect(Err('Error').mapErr((x) => x + '!')).toEqual(Err('Error!'))
    expect(Ok(5).mapErr((x) => x + '!')).toEqual(Ok(5))
  })

  test('ap', () => {
    expect(Ok(5).ap(Ok((x) => x + 1))).toEqual(Ok(6))
    expect(Ok(5).ap(Err('Error' as never))).toEqual(Err('Error'))
    expect(Err('Error').ap(Ok((x) => x + 1))).toEqual(Err('Error'))
    expect(Err('Error').ap(Err('Function Error'))).toEqual(
      Err('Function Error')
    )

    expect(Ok(5)['fantasy-land/ap'](Ok((x) => x + 1))).toEqual(Ok(6))
  })

  test('equals', () => {
    expect(Err('Error').equals(Err('Error'))).toEqual(true)
    expect(Err('Error').equals(Err('Error!'))).toEqual(false)
    expect(Err('Error').equals(Ok('Error') as any)).toEqual(false)
    expect(Ok(5).equals(Ok(5))).toEqual(true)
    expect(Ok(5).equals(Ok(6))).toEqual(false)
    expect(Ok(5).equals(Err('Error') as any)).toEqual(false)

    expect(Ok(5)['fantasy-land/equals'](Ok(5))).toEqual(true)
  })

  test('chain', () => {
    expect(Err('Error').chain((x) => Ok(x + 1))).toEqual(Err('Error'))
    expect(Ok(5).chain((x) => Ok(x + 1))).toEqual(Ok(6))

    expect(Ok(5)['fantasy-land/chain']((x) => Ok(x + 1))).toEqual(
      Ok(6)
    )
  })

  test('chainLeft', () => {
    expect(Err('Error').chainErr((x) => Err(x + '!'))).toEqual(
      Err('Error!')
    )
    expect(Ok(5).chainErr((x) => Ok(x + 1))).toEqual(Ok(5))
  })

  test('join', () => {
    expect(Ok(Ok(5)).join()).toEqual(Ok(5))
    expect(Err(Err('')).join()).toEqual(Err(Err('')))
  })

  test('alt', () => {
    expect(Err('Error').alt(Err('Error!'))).toEqual(Err('Error!'))
    expect(Err('Error').alt(Ok(5) as any)).toEqual(Ok(5))
    expect(Ok(5).alt(Err('Error') as any)).toEqual(Ok(5))
    expect(Ok(5).alt(Ok(6))).toEqual(Ok(5))

    expect(Ok(5)['fantasy-land/alt'](Ok(6))).toEqual(Ok(5))
  })

  test('altLazy', () => {
    const fn = jest.fn(() => Err('Error!'))
    const fn2 = jest.fn(() => Ok(5))
    expect(Err('Error').altLazy(fn)).toEqual(Err('Error!'))
    expect(Ok(5).altLazy(fn2)).toEqual(Ok(5))

    expect(fn).toBeCalledTimes(1)
    expect(fn2).not.toHaveBeenCalled()
  })

  test('reduce', () => {
    expect(Ok(5).reduce((acc, x) => x * acc, 2)).toEqual(10)
    expect(Err('Error').reduce((acc, x) => x * acc, 0)).toEqual(0)

    expect(Ok(5)['fantasy-land/reduce']((acc, x) => x * acc, 2)).toEqual(10)
  })

  test('extend', () => {
    expect(Err('Error').extend((x) => x.isOk())).toEqual(Err('Error'))
    expect(Ok(5).extend((x) => x.isOk())).toEqual(Ok(true))

    expect(Ok(5)['fantasy-land/extend']((x) => x.isOk())).toEqual(
      Ok(true)
    )
  })

  test('unsafeCoerce', () => {
    expect(Ok(5).unsafeCoerce()).toEqual(5)
    expect(() => Err('Error').unsafeCoerce()).toThrow()
    expect(() => Err(new Error('a')).unsafeCoerce()).toThrowError(
      new Error('a')
    )
  })

  test('caseOf', () => {
    expect(
      Err('Error').caseOf({ Err: (x) => x, Ok: () => 'No error' })
    ).toEqual('Error')
    expect(Ok(6).caseOf({ Err: (_) => 0, Ok: (x) => x + 1 })).toEqual(7)
    expect(Ok(6).caseOf({ _: () => 0 })).toEqual(0)
    expect(Err('Error').caseOf({ _: () => 0 })).toEqual(0)
  })

  test('leftOrDefault', () => {
    expect(Err('Error').errOrDefault('No error')).toEqual('Error')
    expect(Ok(5).errOrDefault('No error' as never)).toEqual('No error')
  })

  test('orDefault', () => {
    expect(Err('Error').orDefault(0 as never)).toEqual(0)
    expect(Ok(5).orDefault(0)).toEqual(5)
  })

  test('leftOrDefaultLazy', () => {
    expect(Err('Error').errOrDefaultLazy(() => 'No error')).toEqual('Error')
    expect(Ok(5).errOrDefaultLazy(() => 'No error' as never)).toEqual(
      'No error'
    )
  })

  test('orDefaultLazy', () => {
    expect(Err('Error').orDefaultLazy(() => 0 as never)).toEqual(0)
    expect(Ok(5).orDefaultLazy(() => 0)).toEqual(5)
  })

  test('ifLeft', () => {
    let a = 0
    Err('Error').ifErr(() => {
      a = 5
    })
    expect(a).toEqual(5)

    let b = 0
    Ok(5).ifErr(() => {
      b = 5
    })
    expect(b).toEqual(0)
  })

  test('ifRight', () => {
    let a = 0
    Err('Error').ifOk(() => {
      a = 5
    })
    expect(a).toEqual(0)

    let b = 0
    Ok(5).ifOk(() => {
      b = 5
    })
    expect(b).toEqual(5)
  })

  test('toMaybe', () => {
    expect(Err('Error').toMaybe()).toEqual(Nothing)
    expect(Ok(5).toMaybe()).toEqual(Just(5))
  })

  test('leftToMaybe', () => {
    expect(Err('Error').errToMaybe()).toEqual(Just('Error'))
    expect(Ok(5).errToMaybe()).toEqual(Nothing)
  })

  test('extract', () => {
    expect(Ok(5).extract()).toEqual(5)
    expect(Err('Error').extract()).toEqual('Error')
  })

  test('swap', () => {
    expect(Ok(5).swap()).toEqual(Err(5))
    expect(Err(5).swap()).toEqual(Ok(5))
  })
})
