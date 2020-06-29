import React, {useState } from "react";
import axios from 'axios';
import "./css/metamaskconn.css"

interface IMetamaskConnection {
  widget?: JSX.Element;
}
declare let web3: any
declare let ethereum: any
declare let Web3: any

var [account,set_account] = useState("");

var [connected,set_connected] = useState(false);

var [balance,set_balance] : any= useState(undefined);

const connectMetamask = async () => {
    try {

      if (ethereum) {

        console.log('ETH IS ', ethereum)
        web3 = new Web3(ethereum)
        try {
          await ethereum.enable()

          web3.eth.getAccounts((err: string, accounts: string[]) => {
            if (err) console.log(err)
            else if (!accounts.length) alert('No Metamask accounts found')
            else {
              set_account(accounts[0]);
              //set_connected(true);
           // set_balance(update_balance(accounts[0],"BEAR"));

            }
          })
        } catch (e) {
          console.error('Error, ', e)
        }
      }
    } catch (e) {
      console.log('error ', e)
    }
  }


  async function api_request(url_end: string, params: object) {
    var url = 'http://localhost:9000/'+url_end;
    var res;
    await axios.post(url,params)
            .then(function (response) {
                res = response.data;
            })
            .catch(function (error) {
              res = undefined;
            });
    
    return res;
}

async function update_balance( _user: string , _ticker: string) {
  const params = {
                user: _user, 
                ticker: _ticker
                };

    const url ="balance";

    try {
        var balance : any = (await api_request(url,params));

        if (balance === undefined ) throw new Error("error api");
        else {
          const aux = require('web3');
          return aux.utils.fromWei(balance.toString(),"ether");
        }

    }
    catch(err) {
        console.log(err+"can't get balance");
        return -1;
    }
}

export const MetamaskConnection = ({ widget }: IMetamaskConnection) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    }}
  >
      <div className="topright">
          <p hidden={!connected}>{account} + "has :" {balance} + " rawr tokens"</p>
      <figure hidden={connected} >
            <img src="https://www.bitdegree.org/tutorials/wp-content/uploads/2018/06/metamask-wallet-review-1.jpg" onClick={connectMetamask}  style={{width: '50px', height: '60px'}}/>
            <figcaption>click to connect to metamask</figcaption>
         </figure>
      </div>

    {widget}
  </div>
);