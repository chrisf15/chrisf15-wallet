import { ButtonGroup, Input, Page } from '@emeraldplatform/ui';
import { Back } from '@emeraldplatform/ui-icons';
import { addresses, screen } from '@emeraldwallet/store';
import { Button } from '@emeraldwallet/ui';
import * as React from 'react';
import { useState } from 'react';
import { connect } from 'react-redux';

export interface ICreateWalletProps {
  onCancel?: any;
  onCreate?: any;
}

interface ICreateWalletState {
  name: string;
}

export const CreateWallet = (props: ICreateWalletProps) => {

  const [name, setName] = useState('');
  const [errorText, setErrorText] = useState(null);

  function handleCancelClick () {
    if (props.onCancel) {
      props.onCancel();
    }
  }

  function handleCreateClick () {
    if (props.onCreate) {
      props.onCreate(name);
    }
  }

  function handleNameChange (event: any) {
    const nameValue = event.target.value || '';
    setName(nameValue);
  }

  return (
    <Page
      title={'New Wallet'}
      leftIcon={<Back onClick={handleCancelClick}/>}
    >
      <div>Wallets allow you to organize your funds into categories, like spending or savings.</div>
      <Input
        type='string'
        // containerStyle={this.inputStyles}
        value={name}
        onChange={handleNameChange}
        errorText={errorText}
      />
      <ButtonGroup>
        <Button label={'Cancel'} onClick={handleCancelClick}/>
        <Button label={'Create'} primary={true} onClick={handleCreateClick}/>
      </ButtonGroup>
    </Page>
  );
};

function mapStateToProps () {
  return {

  };
}

function mapDispatchToProps (dispatch: any) {
  return {
    onCancel: () => {
      dispatch(screen.actions.gotoScreen(screen.Pages.HOME));
    },
    onCreate: (walletName: string) => {
      dispatch(addresses.actions.createNewWalletAction(walletName));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(CreateWallet);
