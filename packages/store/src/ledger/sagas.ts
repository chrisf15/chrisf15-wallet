import {takeEvery, put, call, all} from 'redux-saga/effects';
import {IApi} from "@emeraldwallet/core";
import {ActionTypes, LoadAddrInfoAction} from './types';


function* fetchAddrInfo(api: IApi, action: LoadAddrInfoAction) {
  yield;
}

function* watchLoadInfo(api: IApi) {
  yield takeEvery(ActionTypes.LOAD_ADDR_INFO, fetchAddrInfo, api);
}

export function* root(api: IApi) {
  yield all([
    watchLoadInfo(api)
  ]);
}
