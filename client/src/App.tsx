import "./css/App.css";

import React from "react";
import {
  Redirect,
  Route,
  HashRouter as Router,
  Switch,
} from "react-router-dom";

import { DndProvider } from "react-dnd-multi-backend";
import HTML5toTouch from "react-dnd-multi-backend/dist/esm/HTML5toTouch";
import backgroundImage from "./assets/Polka-Dots.svg";
import { PlayerPage } from "./routes/PlayerPage";
import { Homepage } from "./routes/Homepage";
import { withFirebaseContext } from "./contexts/firebaseContext";

function App() {
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
            <Redirect from="*" to={"/"} />
          </Switch>
        </Router>
      )}
    </div>
  );
}

export default App;
