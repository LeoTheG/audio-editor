import React, { useState, useEffect } from "react";

import { generatePhrase } from "./Misc/phrases";
import { useKeyPress } from "./Misc/keyPress";
import { currentTime } from "./Misc/time";
import "./typeGame.css";

import Leaderboard from "./leaderboard";

//import axios from "axios";

let durationInMinutes;

const initalWords = generatePhrase();

function Game(props) {
  // set state as empty arr with 20 spaces
  const [leftPadding, setLeftPadding] = useState(
    new Array(20).fill(" ").join("")
  );
  ///// UI /////
  const [id, setId] = useState("");
  const [outgoingChars, setOutgoingChars] = useState("");
  const [currentChar, setCurrentChar] = useState(initalWords.charAt(0));
  const [incomingChars, setIncomingChars] = useState(initalWords.substr(1));
  const [seconds, setSeconds] = useState(props.start);
  const [winner, setWinner] = useState("");
  useEffect(() => {
    if (seconds > 0) {
      setTimeout(() => setSeconds(seconds - 1), 1000);
    } else {
      setSeconds("Start");
    }
  });

  /////// wpm ///////
  const [startTime, setStartTime] = useState();
  const [wordCount, setWordCount] = useState(0);
  const [wpm, setWpm] = useState(0);

  useKeyPress((key) => {
    var i = (currentTime() - startTime) / 60000;

    if (!startTime) {
      setStartTime(currentTime());
    }

    //
    let updatedOutgoingChars = outgoingChars;
    let updatedIncomingChars = incomingChars;

    //
    if (key === currentChar) {
      //
      if (leftPadding.length > 0) {
        setLeftPadding(leftPadding.substring(1));
      }
      //
      updatedOutgoingChars += currentChar;
      setOutgoingChars(updatedOutgoingChars);

      //
      setCurrentChar(incomingChars.charAt(0));

      //
      updatedIncomingChars = incomingChars.substring(1);
      if (updatedIncomingChars.split(" ").length < 10) {
        updatedIncomingChars += " " + generatePhrase();
      }
      setIncomingChars(updatedIncomingChars);

      if (incomingChars.charAt(0) === " ") {
        //
        setWordCount(wordCount + 1);
        //
        durationInMinutes = (currentTime() - startTime) / 60000.0;

        //
        setWpm(((wordCount + 1) / durationInMinutes).toFixed(2));

        // props.socket.emit("updateWPM", { username: props.username, wpm: wpm });
        console.log(durationInMinutes);
      }
    }
  });

  /*
  function endGame() {
    props.socket.emit("endgame", { player: props.username });
  }
  

  function gameFinish() {
    axios
      .post("https://721461e8bf88.ngrok.io/finish/", {
        player1: props.username,
        player2: props.opponent,
      })
      .then((res) => {
        console.log(res);

        if (parseFloat(res.data[0]["wpm"]) > parseFloat(res.data[1]["wpm"])) {
          setWinner(res.data[0]["username"]);
        } else {
          setWinner(res.data[1]["username"]);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }
  */

  if (durationInMinutes > 0.25) {
    console.log(durationInMinutes);
    //gameFinish();
    // if players are playing for more than two minutes, turn game off
    return (
      <div className="wpmDiv">
        <h3 style={{ textAlign: "center" }}>Game Over!</h3>
        <p>WPM: {wpm}</p>

        {/*<button onClick={endGame}>End Game</button> */}
        <button style={{ width: "50%" }}>End Game</button>

        {/* <h1>Winner: {winner}</h1> */}
        <h1>Winner: TBD</h1>

        <div style={{ textAlign: "match-parent" }}>
          <Leaderboard />
        </div>
      </div>
    );
  } else {
    return (
      <div style={{ backgroundColor: "white" }}>
        <div className="phraseDiv">
          <p className="Character">
            <span className="Character-out">
              {(leftPadding + outgoingChars).slice(-20)}
            </span>
            <span className="Character-current">{currentChar}</span>
            <span>{incomingChars.substr(0, 20)}</span>
          </p>
        </div>

        <div className="wpmDiv">
          <h3>WPM: {wpm}</h3>
        </div>

        <div className="oppDiv">
          {/* <h2>Opponent: {props.opponent}</h2> */}
          <h2>Opponent: TBD </h2>
        </div>

        <div className="secDiv">
          <h1>{seconds}</h1>
        </div>
      </div>
    );
  }
}

export default Game;
