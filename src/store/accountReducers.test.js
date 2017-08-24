import Immutable from 'immutable';
import accountReducers from './accountReducers';

describe('accountReducers', () => {
    it('should add only non existed account', () => {
        let state = accountReducers(null, {});
        expect(state.get('accounts')).toEqual(Immutable.List());
        state = accountReducers(state, {
            type: 'ACCOUNT/ADD_ACCOUNT',
            action: { accountId: 'id1', name: 'name1', description: 'desc1' },
        });
        expect(state.get('accounts').size).toEqual(1);

        // add again
        state = accountReducers(state, {
            type: 'ACCOUNT/ADD_ACCOUNT',
            action: { accountId: 'id1', name: 'name1', description: 'desc1' },
        });
        expect(state.get('accounts').size).toEqual(1);
    });
});
