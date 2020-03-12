export enum StepList {
  CONFIRM_TRANSACTION,
  VERIFYING_ZP_BLOCK,
  RECEIPT_TX_DATA,
  QUEUE,
  GENERATE_TRANSACTION,
  UNCONFIRMED_DEPOSIT_START,
  START_ETH_TRANSACTION,
  TRANSACTION_CONFIRMED
}

export enum ActionList {
  DEPOSIT,
  TRANSFER,
  GAS_DEPOSIT,
  WITHDRAW
}

export interface IProgressDialogMessage {
  title?: string;
  lineOne?: string;
  lineTwo?: string;
  image?: string;
}

export function resolveProgressMessage(action: ActionList, step: StepList): IProgressDialogMessage {

  const progressMessage: IProgressDialogMessage = {
    title: getTitle(action)
  };

  switch (step) {
    case StepList.RECEIPT_TX_DATA:
      progressMessage.lineOne = 'Block successfully verified';
      progressMessage.lineTwo = 'Waiting for a transaction to be included in a block';
      break;
    case StepList.VERIFYING_ZP_BLOCK:
      progressMessage.lineOne = 'Transaction generated';
      progressMessage.lineTwo = 'Verifying ZeroPool block';
      break;
    case StepList.CONFIRM_TRANSACTION:
      progressMessage.lineOne = 'Transaction generated';
      progressMessage.lineTwo = 'Please check your metamask';
      break;
    case StepList.QUEUE:
      progressMessage.lineOne = 'Wait for the last transactions to be confirmed';
      break;
    case StepList.GENERATE_TRANSACTION:
      progressMessage.lineOne = 'Generate ZeroPool transaction';
      progressMessage.lineTwo = 'It might take some time';
      break;
    case StepList.UNCONFIRMED_DEPOSIT_START:
      progressMessage.lineOne = 'Transaction generated';
      progressMessage.lineTwo = 'Wait for deposit confirmation on chain';
      break;
    case StepList.START_ETH_TRANSACTION:
      progressMessage.lineOne = 'Transaction published';
      progressMessage.lineTwo = 'Wait for confirmation on chain';
      break;
  }

  return progressMessage;
}

function getTitle(action: ActionList): string {
  switch (action) {
    case ActionList.DEPOSIT:
      return 'Deposit in progress';
    case ActionList.GAS_DEPOSIT:
      return 'Gas deposit in progress';
    case ActionList.TRANSFER:
      return 'Transfer is in progress';
    case ActionList.WITHDRAW:
      return 'Withdraw in progress';
    default:
      return '';
  }
}
