import React from "react";
import anime from "animejs/lib/anime.es";

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
    this.interval = null;
    window.bulletComponent = this;
  }

  initializeAudio(audio) {
    if (audio) {
      this.audio = audio;
      this.audio.onplaying = (element) => {
        console.log("playing");
        this.clearBulletInterval();
        this.interval = setInterval(this.bulletScreen, 500);
      };
      this.audio.onpause = (element) => {
        console.log("paused");
        this.clearBulletInterval();
      };
      this.audio.onend = (element) => {
        console.log("ended");
        this.clearBulletInterval();
      };
      console.log("Audio initialized");
    }
  }

  clearBulletInterval() {
    if (this.interval != null) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  initializeEmojis(liveEmojis) {
    this.chosenEmoji = liveEmojis;
    console.log("Live Emoji initialized");
  }

  round = (num) => {
    return (Math.floor(num * 2) / 2).toFixed(1);
  };

  getTimeStamp = () => {
    return this.round(this.audio.currentTime);
  };

  addEmoji(emoji) {
    var time = this.getTimeStamp();
    var node = this.createEmojiNode(emoji);
    if (node !== undefined) {
      this.emojiToScreen(node);
    }
    setTimeout(() => {
      if (!(time in this.chosenEmoji)) this.chosenEmoji[time] = [];
      this.chosenEmoji[time].push(emoji);
    }, 500);
  }

  createEmojiNode = (emoji) => {
    var node = document.createElement("img");
    node.className = "live_emoji";
    node.src = getEmojiImageURL(emoji);
    node.id = "emoji" + this.id;
    let random = Math.floor(Math.random() * 7) * 2 + 0.8;
    node.style.top = [random + "rem"];
    this.id++;
    if (this.id >= 1024) this.id = 0;
    return node;
  };

  emojiToScreen = (node) => {
    var emojisNode = document.getElementById("emojis");
    emojisNode.appendChild(node);

    anime({
      targets: "#" + node.id,
      translateX: function () {
        return "30rem";
      },
      scale: function () {
        return anime.random(13, 17) / 10;
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
      var time = this.getTimeStamp();
      if (time in this.chosenEmoji) {
        this.chosenEmoji[time].map((emoji) => {
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

const baseEmojiUrl =
  "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/";

const getEmojiImageURL = (code) => {
  return `${baseEmojiUrl}${code}.png`;
};

export default BulletSection;
