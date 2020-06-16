import React from "react";

//import Leaderboard from "./Leaderboard";
import Game from "./game";

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.handleClick = this.handleClick.bind(this);
    this.state = {
      changeComponent: false, // just to load the game comp after the button is pressed
    };
  }

  handleClick() {
    this.setState({ changeComponent: true });
  }

  render() {
    const changeComponent = this.state.changeComponent;
    console.log(changeComponent);
    if (changeComponent) {
      return <Game />;
    } else {
      return (
        <div
          style={{
            textAlign: "center",
            color: "black",
            cursor: "default", // get rid of the quad arrow cuser
            width: "100%", // take up the whole widget space
            height: "100%",
          }}
        >
          <p>Typing Challenge!</p>

          <div>
            <label htmlFor="username">Create Username: </label>
            <input
              placeholder="Enter a username"
              id="username"
              name="username"
            />
            <button onClick={this.handleClick}>Join Game</button>
          </div>
        </div>
      );
    }
  }
}
export default Login;
