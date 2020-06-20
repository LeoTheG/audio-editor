interface data {
  ticker: string;
  address: string;
  link: string;
}

enum tokenName {
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
  [key in tokenName]: data;
};

export interface TokenData {
  [token: string]: number;
}

export type dataTableProps = {
  address: string;
  tokenData: TokenData;
};

export type metamaskProps = {
  setAccount: React.Dispatch<React.SetStateAction<string>>;
  setConnected: React.Dispatch<React.SetStateAction<boolean>>;
};
