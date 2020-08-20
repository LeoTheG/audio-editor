import "./css/App.css";

import {
  Redirect,
  Route,
  HashRouter as Router,
  Switch,
} from "react-router-dom";

import { DndProvider } from "react-dnd-multi-backend";
import HTML5toTouch from "react-dnd-multi-backend/dist/esm/HTML5toTouch";
import { Homepage } from "./routes/Homepage";
import { PlayerPage } from "./routes/PlayerPage";
import React, { useEffect } from "react";
import { YoutubePage } from "./routes/YoutubePage";
import backgroundImage from "./assets/Polka-Dots.svg";
import { withFirebaseContext } from "./contexts/firebaseContext";

import io from "socket.io-client";

const socket = io("ws://yeeplayer.herokuapp.com");

function App() {
  useEffect(() => {
    socket.on("connect", function () {
      console.log("connected client");
    });
    socket.on("event", function (data: any) {});
    socket.on("disconnect", function () {});
  }, []);

  return (
    <div
      className="App"
      style={{
        background: `url(${backgroundImage})`,
      }}
    >
      {withFirebaseContext(
        <Router>
          <Switch>
            <Route exact path={"/"}>
              <DndProvider options={HTML5toTouch}>
                <Homepage />
              </DndProvider>
            </Route>
            <Route path={"/player"}>
              <PlayerPage />
            </Route>
            <Route path={"/youtube"}>
              <YoutubePage />
            </Route>
            <Redirect from="*" to={"/"} />
          </Switch>
        </Router>
      )}
    </div>
  );
}

export default App;
