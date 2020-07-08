import React from "react";
import "../css/video.css";

/*

--> https://developers.google.com/youtube/player_parameters

need to splice url to include 'embed' and only use video id
ex: https://www.youtube.com/embed/yr6IzOGoMsQ  vs  https://www.youtube.com/watch?v=yr6IzOGoMsQ
            (good)                                          (bad)
*/

class VideoPlayer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      videoURL: "",
      history: [],
      historyFull: false,
    };
  }

  componentDidMount() {
    alert(
      "Tip: \n Scroll down in the Video Player Widget to view your video history"
    );
  }

  handleClick = () => {
    if (this.refs.myInput !== null) {
      var input = this.refs.myInput;
      var badURL = input.value;
      var goodURL = badURL.replace("watch?v=", "embed/"); // allows the iframe to play the youtube videos
      this.setState({ videoURL: goodURL });
      // add to history
      const item = this.state.history;
      item.push({ goodURL });
      this.setState({ history: item });
      console.log(this.state.history);
    }
  };

  render() {
    return (
      <div className="MainDiv">
        <div className="MainTitle">
          <h3>Video Player</h3>
          <input type="text" ref="myInput" placeholder="Enter Youtube URL" />
          <input
            className="inputButton"
            type="button"
            value="Enter Link"
            onClick={this.handleClick}
            title="Scroll down to see History!"
            alt="Scroll down to see History!"
          />

          <iframe title="iFrame" src={this.state.videoURL} />
        </div>
        <div>
          <h3>History</h3>
          {this.state.history.map((item, index) => {
            return (
              <div key={index}>
                <div>
                  <p>{item.goodURL}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default VideoPlayer;
