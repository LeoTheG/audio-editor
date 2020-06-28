declare let web3: any;

let minABI = [
  // balanceOf
  {
    constant: true,
    inputs: [{ name: "_owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "balance", type: "uint256" }],
    type: "function",
  },
  // decimals
  {
    name: "decimals",
    constant: true,
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    type: "function",
  },
];

const getBalance = (
  tokenAddress: string,
  userAddress: string
): Promise<string> => {
  let contract = web3.eth.contract(minABI);
  let cont = contract.at(tokenAddress);
  return new Promise<string>((resolve) => {
    cont.balanceOf(userAddress, (error: object, balance: any) => {
      // Get decimals
      cont.decimals((error: object, decimal: number) => {
        // calculate a balance
        balance = balance.div(10 ** decimal);
        // let output = balance;
        resolve(balance);
      });
    });
  });
};

export default getBalance;
