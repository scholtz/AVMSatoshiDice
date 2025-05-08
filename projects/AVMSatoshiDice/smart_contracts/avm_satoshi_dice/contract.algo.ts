import { Contract } from '@algorandfoundation/algorand-typescript'

export class AvmSatoshiDice extends Contract {
  public hello(name: string): string {
    return `Hello, ${name}`
  }
}
