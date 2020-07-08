import React from "react";
import "../css/video.css";
import YouTube from "react-youtube";
/*
https://github.com/tjallingt/react-youtube
-- npm i --save react-youtube
https://developers.google.com/youtube/player_parameters

https://stackoverflow.com/questions/42761378/react-create-a-new-html-element-on-click/42761554

*/

class AdventureVideoPlayer extends React.Component {
  render() {
    const opts = {
      height: "350",
      width: "350",
      playerVars: {
        // https://developers.google.com/youtube/player_parameters
        autoplay: 1,
        listType: "playlist",
        list: "PLnLZJgemd8FCF-kmBs1gpZIMi-VlmwlsA",
        loop: 1,
      },
    };

    return (
      <div className="AdvenMainDiv">
        <h2>Adventure Video Player</h2>
        <div className="AdvenVideo">
          <YouTube
            videoId="PLnLZJgemd8FCF-kmBs1gpZIMi-VlmwlsA"
            opts={opts}
            onReady={this._onReady}
          />
        </div>
      </div>
    );
  }

  _onReady(event) {
    // access to player in all event handlers via event.target
    event.target.playVideo();
    console.log(event.target);
  }
}
export default AdventureVideoPlayer;
