import { TestExecutionContext } from '@algorandfoundation/algorand-typescript-testing'
import { describe, expect, it } from 'vitest'
import { AvmSatoshiDice } from './contract.algo'

describe('AvmSatoshiDice contract', () => {
  const ctx = new TestExecutionContext()
  it('Logs the returned value when sayHello is called', () => {
    const contract = ctx.contract.create(AvmSatoshiDice)

    const result = contract.hello('Sally')

    expect(result).toBe('Hello, Sally')
  })
})
