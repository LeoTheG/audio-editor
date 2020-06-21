interface data {
  ticker: string;
  address: string;
  link: string;
  balance: number;
}

export enum tokens {
  dunkonyou,
  fishclub,
  ginandjuice,
  jolene,
  sonnet,
}

// export interface balanceObj {
//   [tokens: string]: string[];
// }

export type tokenDataObj = {
  [token: number]: data;
};

export interface tokenData {
  [token: string]: number;
}

export type dataTableProps = {
  address: string;
  tokenData: tokenDataObj;
};

export type metamaskProps = {
  setAddress: React.Dispatch<React.SetStateAction<string>>;
  setConnection: React.Dispatch<React.SetStateAction<boolean>>;
};
