import "../css/Widget.css";

import { ItemTypes, WidgetTypes } from "../../types";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Tooltip } from "@material-ui/core";
import { useDrag } from "react-dnd";

export interface IWidgetProps {
  type: WidgetTypes;
  top: number;
  left: number;
  id: string;
}

export const Widget = (props: IWidgetProps) => {
  const { top, left, id, type } = props;

  const [{ isDragging }, drag] = useDrag({
    item: { id, left, top, type: ItemTypes.WIDGET },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="widget-container"
      style={{
        left,
        top,
      }}
    >
      {renderWidget(type)}
    </div>
  );
};

const renderWidget = (type: WidgetTypes) => {
  switch (type) {
    case WidgetTypes.time:
      return <WidgetTime />;

    case WidgetTypes.balances:
      return <BalancesWidget />;

    case WidgetTypes.bearfaucet:
      return <BearFaucetWidget />;
    

    // add widget case here for new widget types
    default:
      return null;
  }
};

declare let web3: any
declare let ethereum: any
declare let Web3: any


const BearFaucetWidget = () => {
  let account: string = "";

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
              account = accounts[0];
              
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

  const send_tokens = async () => {
    
    if (account) {
      const apiAddress = "http://13.56.163.182:8000/transfer-token";
          axios.post(apiAddress, {
            ticker: "BEAR",
            amount: 10,
            to: account,
            hookUrl: "done",
          })
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    }
  }
  
  
  return <div className='header_faucet'>

            <img className="topleft_faucet" src="https://image.flaticon.com/icons/svg/3062/3062276.svg" style={{width: '30px', height: '30px'}}></img>
            <img className="topright_faucet" onClick={connectMetamask} src="http://13.56.163.182:8000/metamask.png" style={{width: '30px', height: '30px'}}></img>
            <h1> 100 rawr tokens </h1>
            <img className="gif_faucet" src="https://media.giphy.com/media/xT0GqcCJJJH12hJvGM/giphy.gif" style={{width: '80px', height: '80px'}}></img>
            <button className="button_faucet" onClick={send_tokens} >request rawr tokens</button>
            <Tooltip title="version 0.1, production: mike, leo, joão">
            <div className='credits' >credits</div>
            </Tooltip>
            
          </div>
  
}


const BalancesWidget = () => {


    const [load,setLoad] = useState(false);

    //add new tokens here (and then in the api)
    const [tokens,setTokens] = useState([
                                        {ticker: "BEAR", amount: 0}, 
                                        {ticker: "GRATITUDE" , amount: 0}
                                        ]);
    const [user,setUser] = useState("");

   



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
              setUser(accounts[0]);
              ranking(accounts[0]);
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
    
    
    
    async function ranking(_user: string) {
        const length = tokens.length;

        for (var i = 0; i < length ; i++) {
            var balance = await update_balance(_user,tokens[i].ticker);
            tokens[i].amount = balance;
        }

        setLoad(true);
        renderTableData();
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

    function renderTableData() {
      return tokens.map((token, index) => {
         const { ticker, amount } = token 
         return (
            <tr key={ticker}>
               <td>{ticker}</td>
               <td>{amount}</td>
            </tr>
         )
      })
   }

   
    // useEffect(() => {
    //   connectMetamask();
    // }, []);

      return <div className='header'>
                    <img className="topright" onClick={connectMetamask} src="http://13.56.163.182:8000/metamask.png" style={{width: '50px', height: '50px'}}></img>
              <h1> here are your tokens: </h1>
                <table id='tokens' className='d'>
                    <tbody>
                        {renderTableData()}
                    </tbody>
                </table>
                </div>
}






const WidgetTime = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    setInterval(() => {
      const newTime = getFormattedTime();
      setTime(newTime);
    }, 100);
  }, []);

  return (
    <div>
      The time is <div>{time}</div>
    </div>
  );
};

const getFormattedTime = (): string => {
  const newDate = new Date(Date.now());

  return `${newDate.getHours()}:${newDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${newDate
    .getSeconds()

    .toString()
    .padStart(2, "0")}:${newDate
    .getMilliseconds()

    .toString()
    .padStart(2, "0")}`;
};
