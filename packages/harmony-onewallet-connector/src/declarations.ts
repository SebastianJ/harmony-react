interface OneWallet {
  send: unknown
  enable: () => Promise<string[]>
  on?: (method: string, listener: (...args: any[]) => void) => void
  removeListener?: (method: string, listener: (...args: any[]) => void) => void
  getAccount: () => Promise<any>
  forgetIdentity: () => void
  network?: any
}

declare interface Window {
  onewallet?: OneWallet
}

declare const __DEV__: boolean
