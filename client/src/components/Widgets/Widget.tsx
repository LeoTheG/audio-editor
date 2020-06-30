import "../css/Widget.css";

import { ItemTypes, WidgetTypes } from "../../types";
import React, { useEffect, useState } from "react";
import axios from 'axios';
import { Tooltip } from "@material-ui/core";
import { useDrag } from "react-dnd";
import {MusicController } from "adventure-component-library";

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

      case WidgetTypes.audioplayer:
        return <AudioPlayerWidget />;
    

    case WidgetTypes.joke:
      return <JokeWidget />;
    // add widget case here for new widget types
    default:
      return null;
  }
};

declare let web3: any
declare let ethereum: any
declare let Web3: any



const AudioPlayerWidget = () => {

  
  var [i,setI] = useState(0);
  const [list,set_list] = useState([
                {songName: "dejitaru glow", artist: "a.l.i.s.o.n, crystal cola", url: "http://www.hochmuth.com/mp3/Vivaldi_Sonata_eminor_.mp3"},
                {songName: "dejitaru glow", artist: "brooo", url: "https://file-examples.com/wp-content/uploads/2017/11/file_example_MP3_700KB.mp3"}
              ]);

  
  let [audio,set_audio] = useState(new Audio(list[i].url));

  let [is_playing,set_playing] = useState(false);

  function play ()  {  
    set_playing(!is_playing);
  }

  useEffect(() => {
    if (is_playing) {
      audio.play();
    }
    else {
      audio.pause();
    }
  }, [is_playing]);

useEffect(() => {
  set_audio(new Audio(list[i].url));
},[i]);


function increment() {
    set_playing(false);
    setI((i + 1) % list.length);
    
}
function decrement () {
    set_playing(false);
    if (i == 0) setI(list.length - 1);
    else setI(i-1);
}



 return <div className="player-container">          
            <MusicController
            isPlaying={is_playing}
            onClickPrev={()=>{decrement()}}
            onClickNext={()=>{increment()}}
            onTogglePlay={()=>{play()}}
            song={ list[i]} />
          </div>
}





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
      const apiAddress = "https://adventure-eth-api.herokuapp.com/transfer-token";
          axios.post(apiAddress, {
            ticker: "BEAR",
            amount: 100,
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
    window.alert("Connect with metamask first!")
  }
  
  
  return <div className='header_faucet'>

            <img className="topleft_faucet" src="https://image.flaticon.com/icons/svg/3062/3062276.svg" style={{width: '30px', height: '30px'}}></img>
            <img className="topright_faucet" onClick={connectMetamask} src="data:image/png;base64,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" style={{width: '30px', height: '30px'}}></img>
            <h1> 100 rawr tokens </h1>
            <img className="gif_faucet" src="https://media.giphy.com/media/xT0GqcCJJJH12hJvGM/giphy.gif" style={{width: '80px', height: '80px'}}></img>
            <button className="button_faucet" onClick={send_tokens} >request rawr tokens</button>
            <Tooltip title="version 0.1, production: joão, leo, mike">
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
        var url = 'https://myserverpool.herokuapp.com/'+url_end;
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

      return <div className='widget-container'>
            <div className='header'>
                    connect with metamask --->
                    <img className="topright_balances" onClick={connectMetamask} src="data:image/png;base64,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" 
                    style={{width: '30px', height: '30px'}}></img>
              <h1> here are your tokens: </h1>
                <table id='tokens' className='d'>
                    <tbody>
                        {renderTableData()}
                    </tbody>
                </table>
                </div>
                <Tooltip title="version 0.1, production: joão, leo, mike">
                <div className='credits_balances' >credits</div>
                </Tooltip>
                </div>
}





//Joke Widget
const JokeWidget = () => {
  const [setup, setSetup] = useState("loading");
  const [punchline, setPunchline] = useState("loading");
  const audio = new Audio(
    "http://static1.grsites.com/archive/sounds/comic/comic002.mp3"
  );
  const newJoke = () => {
    fetch("https://official-joke-api.appspot.com/random_joke")
      .then((res) => res.json())
      .then((res2) => {
        setSetup(res2.setup);
        setPunchline(res2.punchline);
      });
    audio.play();
  };
  useEffect(() => {
    newJoke();
  }, []);
  return (
    <div className="default">
      <div className="joke-container">
        <h3 className="title">Press The Button To Get A Random Joke!</h3>
        <button className="getJoke" onClick={newJoke}>
          Tell Me Something Funny!
        </button>
      </div>
      <div className="Joke">
        Setup: {setup} <br />
        Punchline: {punchline} <br />
      </div>
    </div>
  );
};

// example widget

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
