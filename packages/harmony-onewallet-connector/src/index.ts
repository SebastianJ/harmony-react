import { AbstractConnectorArguments, ConnectorUpdate } from '@harmony-react/types'
import { AbstractConnector } from '@harmony-react/abstract-connector'
import { fromBech32 } from '@harmony-js/crypto'
import { Harmony } from '@harmony-js/core'
import { ChainID, ChainType } from '@harmony-js/utils'
import warning from 'tiny-warning'

//import { SendReturnResult, SendReturn, Send, SendOld } from './types'

export class NoHarmonyWalletProviderError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'No Harmony Mathwallet provider was found on window.onewallet.'
  }
}

export class UserRejectedRequestError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The user rejected the request.'
  }
}

export class WalletLockedError extends Error {
  public constructor() {
    super()
    this.name = this.constructor.name
    this.message = 'The wallet is locked. Please unlock it.'
  }
}

export class HarmonyOneWalletConnector extends AbstractConnector {
  constructor(kwargs: AbstractConnectorArguments) {
    super(kwargs)
  }

  public async activate(): Promise<ConnectorUpdate> {
    if (!window.onewallet) {
      throw new NoHarmonyWalletProviderError()
    }

    let account = await this.retrieveAccount()

    return { provider: this.generateProvider(), ...(account ? { account } : {}) }
  }

  public async getProvider(): Promise<any> {
    return this.generateProvider()
  }

  private generateProvider(): (Harmony | undefined) {
    let network
    try {
      network = window?.onewallet?.network
    } catch {
      warning(false, 'window.onewallet.network was unsuccessful')
    }

    let harmony: Harmony | undefined
    if (network && network.chain_id) {
      let url
      let chainId: ChainID
      let chainType: ChainType

      switch (network.chain_id) {
        case 1:
          url = 'https://api.s0.t.hmny.io'
          chainType = ChainType.Harmony
          chainId = ChainID.HmyMainnet
          break
  
        case 2:
          url = 'https://api.s0.b.hmny.io'
          chainType = ChainType.Harmony
          chainId = ChainID.HmyTestnet
          break
  
        default:
          url = 'https://api.s0.t.hmny.io'
          chainType = ChainType.Harmony
          chainId = ChainID.HmyMainnet
      }

      harmony = new Harmony(url, {
        chainType: chainType,
        chainId: chainId,
      })
    }

    return harmony
  }

  public async getChainId(): Promise<number | string> {
    if (!window.onewallet) {
      throw new NoHarmonyWalletProviderError()
    }

    let chainId
    try {
      chainId = window.onewallet.network.chain_id
    } catch {
      warning(false, 'window.onewallet.network.chain_id was unsuccessful')
    }

    return chainId
  }

  public async getAccount(): Promise<null | string> {
    return this.retrieveAccount()
  }

  public deactivate() {
  }

  public async close() {
    await (window as Window).onewallet?.forgetIdentity()
    this.emitDeactivate()
  }

  private async retrieveAccount() : Promise<null | string> {
    if (!window.onewallet) {
      throw new NoHarmonyWalletProviderError()
    }

    let harmony = (window as Window).onewallet
    let account: null | string = null

    if (harmony) {
      try {
        account = await harmony.getAccount().then((acc: any): string => fromBech32(acc.address))
      } catch (error) {
        if (error.message === 'User rejected the provision of an Identity') {
          throw new UserRejectedRequestError()
        } else if (error.message === 'The wallet has been locked and needs to be unlocked for further operation!') {
          throw new WalletLockedError()
        }
        warning(false, 'retrieveAccount was unsuccessful')
      }
    }

    return account
  }

  public async isAuthorized(): Promise<boolean> {
    if (!window.onewallet) {
      return false
    }

    try {
      return await this.retrieveAccount().then((account: null | string) => {
        if (account) {
          return true
        } else {
          return false
        }
      })
    } catch {
      return false
    }
  }
}
