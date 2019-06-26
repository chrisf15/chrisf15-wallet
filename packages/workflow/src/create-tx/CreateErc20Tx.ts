import {targetFromNumber, TxTarget, ValidationResult} from "./types";
import {Units, Wei} from "@emeraldplatform/eth";
import BigNumber from "bignumber.js";

export enum TransferType {
  STANDARD,
  DELEGATE
}

export function transferFromNumber(i: number): TransferType {
  if (i == TransferType.DELEGATE.valueOf()) {
    return TransferType.DELEGATE;
  }
  return TransferType.STANDARD;
}

export type ERC20TxDetails = {
  from?: string;
  to?: string;
  erc20: string;
  target: TxTarget;
  amount: BigNumber;
  totalTokenBalance?: BigNumber;
  totalEtherBalance?: Wei;
  gasPrice: Wei;
  gas: BigNumber;
  transferType: TransferType;
}

export type ERC20TxDetailsPlain = {
  from?: string;
  to?: string;
  erc20: string;
  target: number;
  amount: string;
  totalTokenBalance?: string;
  totalEtherBalance?: string;
  gasPrice: string;
  gas: number;
  transferType: number;
}

const TxDefaults: ERC20TxDetails = {
  erc20: '',
  target: TxTarget.MANUAL,
  amount: new BigNumber(0),
  gasPrice: Wei.ZERO,
  gas: new BigNumber(21000),
  transferType: TransferType.STANDARD
};

function toPlainDetails(tx: ERC20TxDetails): ERC20TxDetailsPlain {
  return {
    from: tx.from,
    to: tx.to,
    erc20: tx.erc20,
    target: tx.target.valueOf(),
    amount: tx.amount.toString(10),
    totalTokenBalance: tx.totalTokenBalance == null ? undefined : tx.totalTokenBalance.toString(10),
    totalEtherBalance: tx.totalEtherBalance == null ? undefined : tx.totalEtherBalance.toString(Units.WEI, 0, false),
    gasPrice: tx.gasPrice.toString(Units.WEI, 0, false),
    gas: tx.gas.toNumber(),
    transferType: tx.transferType.valueOf()
  }
}

function fromPlainDetails(plain: ERC20TxDetailsPlain): ERC20TxDetails {
  return {
    from: plain.from,
    to: plain.to,
    erc20: plain.erc20,
    target: targetFromNumber(plain.target),
    amount: new BigNumber(plain.amount, 10),
    totalTokenBalance: plain.totalTokenBalance == null ? undefined : new BigNumber(plain.totalTokenBalance, 10),
    totalEtherBalance: plain.totalEtherBalance == null ? undefined : new Wei(plain.totalEtherBalance, Units.WEI),
    gasPrice: new Wei(plain.gasPrice, Units.WEI),
    gas: new BigNumber(plain.gas),
    transferType: transferFromNumber(plain.transferType)
  }
}

export class CreateERC20Tx implements ERC20TxDetails {
  from?: string;
  to?: string;
  erc20: string;
  target: TxTarget;
  amount: BigNumber;
  totalTokenBalance?: BigNumber;
  totalEtherBalance?: Wei;
  gasPrice: Wei;
  gas: BigNumber;
  transferType: TransferType;

  constructor(source?: ERC20TxDetails) {
    if (!source) {
      source = TxDefaults;
    }
    this.from = source.from;
    this.to = source.to;
    this.erc20 = source.erc20;
    this.target = source.target;
    this.amount = source.amount;
    this.totalTokenBalance = source.totalTokenBalance;
    this.totalEtherBalance = source.totalEtherBalance;
    this.gasPrice = source.gasPrice;
    this.gas = source.gas;
    this.transferType = source.transferType;
  }

  static fromPlain(details: ERC20TxDetailsPlain): CreateERC20Tx {
    return new CreateERC20Tx(fromPlainDetails(details));
  }

  dump(): ERC20TxDetailsPlain {
    return toPlainDetails(this);
  }

  setFrom(from: string, tokenBalance: BigNumber, etherBalance: Wei) {
    this.from = from;
    this.totalTokenBalance = tokenBalance;
    this.totalEtherBalance = etherBalance;
  }

  validate(): ValidationResult {
    if (this.from == null || this.totalTokenBalance == null || this.totalEtherBalance == null) {
      return ValidationResult.NO_FROM;
    }
    if (this.to == null) {
      return ValidationResult.NO_TO;
    }
    if (this.getTotal().isGreaterThan(this.totalTokenBalance)) {
      return ValidationResult.INSUFFICIENT_TOKEN_FUNDS;
    }
    if (this.getFees().value.isGreaterThan(this.totalEtherBalance.value)) {
      return ValidationResult.INSUFFICIENT_FUNDS;
    }
    return ValidationResult.OK;
  }

  getTotal(): BigNumber {
    return this.amount;
  }

  getChange(): (BigNumber | null) {
    if (this.totalTokenBalance == null) {
      return null
    }
    return this.totalTokenBalance.minus(this.getTotal());
  }

  getFeesChange(): (Wei | null) {
    if (this.totalEtherBalance == null) {
      return null
    }
    //TODO upgrade to latest Wei from emerald-js
    const res = new Wei(0);
    res.value = this.totalEtherBalance.value.minus(this.getFees().value);
    return res;
  }

  getFees(): Wei {
    return new Wei(this.gas.multipliedBy(this.gasPrice.value));
  }

  rebalance(): Boolean {
    if (this.target == TxTarget.SEND_ALL) {
      if (this.totalTokenBalance == null) {
        return false;
      }
      this.amount = this.totalTokenBalance;
      return true;
    }
    return true;
  }

  debug(): String {
    const change = this.getChange();
    return `Send ${this.from} -> ${this.to} of ${this.amount} using ${this.gas} at ${this.gasPrice.toString(Units.MWEI, undefined, true)}.\n` +
      `Total to send: ${this.getTotal()} of token, pay ${this.getFees()} of Ether fees,` +
      `account has ${this.totalTokenBalance}, will have ${change}`

  }
}