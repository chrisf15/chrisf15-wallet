import {fromJS, Iterable, List, Map} from 'immutable';
import { Wei } from '@emeraldplatform/eth';
import {BlockchainCode} from "@emeraldwallet/core";
import {
  IAddressesState,
  AddressesAction,
  LoadingAction,
  ActionTypes,
  SetListAction,
  SetBalanceAction,
  UpdateAddressAction,
  AddAccountAction,
  SetHDPathAction,
  SetTxCountAction,
  PendingBalanceAction,
} from "./types";

export const INITIAL_STATE = fromJS({
  addresses: [],
  loading: true,
});

const initialAccount = Map({
  id: null,
  hardware: false,
  hdpath: null,
  balance: null,
  balancePending: null,
  txcount: null,
  name: null,
  description: null,
  hidden: false,
  blockchain: null,
});

function onLoading(state: any, action: LoadingAction): any {
  return state.set('loading', true);
}

type AddressList =  List<Map<string, any>>

function onSetList(state: any, action: SetListAction) {
  const existingAccounts: AddressList = state.get('addresses');
  const getExisting = (id: string, chain: BlockchainCode) => {
    const pos = existingAccounts.findKey((x: any) => x.get('id') === id && x.get('blockchain') === chain);
    if (pos >= 0) {
      return existingAccounts.get(pos);
    }
    return initialAccount;
  };
  const addresses = action.payload;

  const updatedList: AddressList = fromJS(addresses).map((acc: any) => fromJS({
    name: acc.get('name'),
    description: acc.get('description'),
    id: acc.get('address'),
    hardware: acc.get('hardware'),
    hdpath: acc.get('hdpath'),
    hidden: acc.get('hidden'),
    blockchain: acc.get('blockchain'),
  })).map((acc: any) => getExisting(acc.get('id'), acc.get('blockchain')).merge(acc));

  let resultingList = null;

  if (action.chain) {
    const otherChains: Iterable<number, Map<string, any>> = existingAccounts.filter((acc) => acc!.get('blockchain') !== action.chain);
    resultingList = updatedList.merge(otherChains.toList());
  } else {
    resultingList = updatedList;
  }

  return state
    .set('addresses', resultingList)
    .set('loading', false);
}

function updateAccount(state: any, id: string, f: any) {
  return state.update('addresses', (accounts: any) => {
    const pos = accounts.findKey((acc: any) => acc.get('id') === id);
    if (pos >= 0) {
      return accounts.update(pos, f);
    }
    return accounts;
  });
}


function onSetBalance(state: any, action: SetBalanceAction) {
  const { accountId, value } = action.payload;
  return updateAccount(state, accountId, (acc: any) => {
    // Update balance only if it's changed
    const newBalance = new Wei(value);
    const currentBalance = acc.get('balance');
    if (currentBalance && currentBalance.equals(newBalance)) {
      return acc.set('balancePending', null);
    }
    return acc
      .set('balance', newBalance)
      .set('balancePending', null);
  });
}

function onUpdateAccount(state: any, action: UpdateAddressAction) {
  const { address, name, description } = action.payload;
  return updateAccount(state, address, (acc: any) => acc
    .set('name', name)
    .set('description', description));
}

function onAddAccount(state: any, action: AddAccountAction) {
  const {accountId, name, description, blockchain} = action;
  return state.update('addresses', (accounts: any) => {
    const pos = accounts.findKey((acc: any) => acc.get('id') === accountId && acc.get('blockchain') === blockchain);
    if (pos >= 0) {
      return accounts;
    }
    const values = fromJS({
      id: accountId, name, description, blockchain,
    });
    const newAccount = initialAccount.merge(values);
    return accounts.push(newAccount);
  });
}

function onSetHdPath(state: any, action: SetHDPathAction) {
  if (action.type === ActionTypes.SET_HD_PATH) {
    return updateAccount(state, action.accountId, (acc: any) => acc.set('hdpath', action.hdpath));
  }
  return state;
}

function onSetTxCount(state: any, action: SetTxCountAction) {
  if (action.type === ActionTypes.SET_TXCOUNT) {
    return updateAccount(state, action.accountId, (acc: any) => acc.set('txcount', action.value));
  }
  return state;
}

function onPendingBalance(state: any, action: PendingBalanceAction) {
  if (action.type === ActionTypes.PENDING_BALANCE) {
    let bal;
    if (action.to) {
      return updateAccount(state, action.to, (acc: any) => {
        bal = acc.get('balance').plus(new Wei(action.value));
        return acc.set('balancePending', bal);
      });
    } if (action.from) {
      return updateAccount(state, action.from, (acc: any) => {
        bal = acc.get('balance').sub(new Wei(action.value));
        return acc.set('balancePending', bal);
      });
    }
  }
  return state;
}

export function reducer(
  state: any = INITIAL_STATE,
  action: AddressesAction
): IAddressesState {
  switch(action.type) {
    case ActionTypes.UPDATE_ACCOUNT:
      return onUpdateAccount(state, action);
    case ActionTypes.SET_BALANCE:
      return onSetBalance(state, action);
    case ActionTypes.LOADING:
      return onLoading(state, action);
    case ActionTypes.SET_LIST:
      return onSetList(state, action);
    case ActionTypes.ADD_ACCOUNT:
      return onAddAccount(state, action);
    case ActionTypes.SET_HD_PATH:
      return onSetHdPath(state, action);
    case ActionTypes.SET_TXCOUNT:
      return onSetTxCount(state, action);
    case ActionTypes.PENDING_BALANCE:
      return onPendingBalance(state, action);
    default:
      return state;
  }
}
