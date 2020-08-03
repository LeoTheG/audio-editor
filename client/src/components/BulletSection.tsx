import React from "react";
//@ts-ignore
import anime from "animejs/lib/anime.es";

// a sample data for chosenEmoji
const testEmojiData = {
  1.5: ["1f605", "1f605"],
  2.0: ["1f3e0"],
};

class BulletSection extends React.Component {
  chosenEmoji: any = testEmojiData;
  audio: HTMLAudioElement | null = null;
  id: number = 0;
  interval: any = -1;
  constructor(props: Readonly<{}>) {
    super(props);
    window.bulletComponent = this;
  }

  initializeAudio(audio: HTMLAudioElement) {
    if (audio) {
      this.audio = audio;
      // if the song is playing, we keep outputing emojis every .5 sec
      this.audio.onplaying = (element: any) => {
        console.log("playing");
        this.clearBulletInterval();
        this.interval = setInterval(this.bulletScreen, 500);
      };

      // if paused or ended, stop outputing emojis
      this.audio.onpause = (element: any) => {
        console.log("paused");
        this.clearBulletInterval();
      };
      console.log("Audio initialized");
    }
  }

  // helper function
  clearBulletInterval() {
    if (this.interval !== -1) {
      clearInterval(this.interval);
      this.interval = -1;
    }
  }

  initializeEmojis(liveEmojis: { number: Array<string> }) {
    this.chosenEmoji = liveEmojis;
    console.log("Live Emoji initialized");
  }

  // round to half a sec
  round = (num: number) => {
    return (Math.floor(num * 2) / 2).toFixed(1);
  };

  getTimeStamp = () => {
    if (this.audio) return this.round(this.audio.currentTime);
    return -1;
  };

  // manually add the emoji to screen
  addEmoji(emoji: any) {
    var time = this.getTimeStamp();
    var node = this.createEmojiNode(emoji);
    if (node !== undefined) {
      this.emojiToScreen(node);
    }

    // add the emoji to the list 0.5 sec later to avoid outputing emoji twice
    setTimeout(() => {
      if (!(time in this.chosenEmoji)) this.chosenEmoji[time] = [];
      this.chosenEmoji[time].push(emoji);
    }, 500);
  }

  createEmojiNode(emoji: string) {
    var node = document.createElement("img");
    node.className = "live_emoji";
    node.src = getEmojiImageURL(emoji);
    node.id = "emoji" + this.id;
    var emojisNode = document.getElementById("emojis");

    if (emojisNode != null) {
      // the number of emojis in a column the screen can hold
      var options = Math.floor(emojisNode.clientHeight / 30) - 1;
      // randomly picks a row and calculate the respective height
      let random = Math.floor(Math.random() * options) * 30 + 10;
      node.style.top = [random + "px"] as any;
    }

    // id is necessary to keep track of the animations for each emoji
    // assuming no more than 1024 emojis are being rendered to screen at once
    this.id++;
    if (this.id >= 1024) this.id = 0;
    return node;
  }

  // add the emoji to screen and animate it
  emojiToScreen(node: HTMLElement) {
    var emojisNode = document.getElementById("emojis");
    if (emojisNode != null) {
      emojisNode.appendChild(node as any);
      let width = emojisNode.clientWidth;
      anime({
        targets: "#" + node.id,
        translateX: function () {
          return width + 40;
        },
        scale: function () {
          return anime.random(13, 17) / 10;
        },
        duration: function () {
          return width * 4.8;
        },
        easing: "linear",
        complete: () => {
          if (emojisNode != null) emojisNode.removeChild(node);
        },
      });
    }
  }

  // add all emojis at the current timestamp to the screen
  bulletScreen = () => {
    if (this.audio != null && this.audio.played) {
      var time = this.getTimeStamp();
      if (time in this.chosenEmoji) {
        this.chosenEmoji[time].map((emoji: any) => {
          var node = this.createEmojiNode(emoji);
          if (node !== undefined) {
            // have a random time offset for each emoji (dont clutter together)
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

const getEmojiImageURL = (code: any) => {
  return `${baseEmojiUrl}${code}.png`;
};

export default BulletSection;
