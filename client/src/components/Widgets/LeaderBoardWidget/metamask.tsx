import { metamaskProps } from "../../../types/leaderboardTypes";

declare let web3: any;
declare let ethereum: any;
declare let Web3: any;

const MetamaskButton = async (props: metamaskProps) => {
  try {
    if (ethereum) {
      web3 = new Web3(ethereum);
      try {
        await ethereum.enable();
        web3.eth.getAccounts((err: string, accounts: string[]) => {
          if (err) console.log(err);
          else if (!accounts.length) alert("No Metamask accounts found");
          else {
            props.setAccount(accounts[0]);
            props.setConnected(true);
          }
        });
      } catch (e) {
        console.error("Error, ", e);
      }
    }
  } catch (e) {
    console.log("error", e);
  }
};

export default MetamaskButton;
