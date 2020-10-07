import "./css/App.css";

import {
  Redirect,
  Route,
  HashRouter as Router,
  Switch,
} from "react-router-dom";

import { CreatePage } from "./routes/CreatePage";
import { DndProvider } from "react-dnd-multi-backend";
import HTML5toTouch from "react-dnd-multi-backend/dist/esm/HTML5toTouch";
import { PlayerPage } from "./routes/PlayerPage";
import React from "react";
import { UploadPage } from "./routes/UploadPage";
import { YoutubePage } from "./routes/YoutubePage";
import backgroundImage from "./assets/Polka-Dots.svg";
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
              <UploadPage />
            </Route>
            <Route path={"/player/:id?"}>
              <PlayerPage />
            </Route>
            <Route path={"/youtube/:id?"}>
              <YoutubePage />
            </Route>
            <Route path={"/create"}>
              <DndProvider options={HTML5toTouch}>
                <CreatePage />
              </DndProvider>
            </Route>
            <Redirect from="*" to={"/"} />
          </Switch>
        </Router>
      )}
    </div>
  );
}

export default App;
