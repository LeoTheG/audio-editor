import React from "react";
import anime from "animejs/lib/anime.es";
import { FirebaseContext } from "../contexts/firebaseContext";

var EmojiData = require("emoji-data");

const testEmojiData = {
  "1.0": ["1f605"],
  "2.0": ["1f3e0"],
};

class BulletSection extends React.Component {
  constructor(props) {
    super(props);
    this.chosenEmoji = testEmojiData;
    this.audio = null;
    this.id = 0;
    window.bulletComponent = this;
  }

  initializeAudio(audio) {
    this.audio = audio;
    this.audio.onplaying = (element) => {
      this.interval = setInterval(this.bulletScreen, 500);
    };
    this.audio.onpause = (element) => {
      if (this.interval != null) clearInterval(this.interval);
    };
  }

  initializeEmojis(liveEmojis) {
    this.chosenEmoji = liveEmojis;
  }

  round = (num) => {
    return (Math.floor(num * 2) / 2).toFixed(1);
  };

  getTimeStamp = () => {
    return this.round(this.audio.currentTime);
  };

  addEmoji(songId, emoji) {
    // var time = this.getTimeStamp();
    // var node = this.createEmojiNode(emoji);
    // if (node !== undefined) {
    //   this.emojiToScreen(node);
    // }
    // setTimeout(() => {
    //   if (!(time in this.chosenEmoji)) this.chosenEmoji[time] = [];
    //   this.chosenEmoji[time].push(emoji);
    //   FirebaseContext.updateLiveEmojis(songId, time, this.chosenEmoji[time]);
    // }, 500);
  }

  createEmojiNode = (emoji) => {
    var node = document.createElement("div");
    node.className = "live_emoji";
    var renderEmoji = EmojiData.from_unified(emoji);
    if (renderEmoji !== undefined) {
      node.innerHTML = renderEmoji.render();
      node.id = "emoji" + this.id;
      node.className = "live_emoji";
      let random = Math.floor(Math.random() * 8) * 2.5;
      node.style.top = [random + "rem"];
      this.id++;
      return node;
    }
    return undefined;
  };

  emojiToScreen = (node) => {
    console.log("Adding emojis");
    var emojisNode = document.getElementById("emojis");
    emojisNode.appendChild(node);

    anime({
      targets: "#" + node.id,
      translateX: function () {
        return "23rem";
      },
      scale: function () {
        return anime.random(15, 20) / 10;
      },
      duration: function () {
        return 2750;
      },
      easing: "linear",
      complete: () => {
        document.getElementById("emojis").removeChild(node);
      },
    });
  };

  bulletScreen = () => {
    if (this.audio != null && this.audio.played) {
      console.log(this.getTimeStamp());
      var time = this.getTimeStamp();
      console.log(this.chosenEmoji);
      if (time in this.chosenEmoji) {
        console.log("In");
        this.chosenEmoji[time].map((emoji) => {
          console.log(this.chosenEmoji[time]);
          var node = this.createEmojiNode(emoji);
          if (node !== undefined) {
            setTimeout(() => {
              this.emojiToScreen(node);
            }, Math.random() * 500);
          }
        });
      }
    }
  };

  render() {
    return <div id="emojis"></div>;
  }
}

export default BulletSection;
