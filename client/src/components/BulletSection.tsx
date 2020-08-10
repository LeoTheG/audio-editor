import React from "react";
//@ts-ignore
import anime from "animejs/lib/anime.es";

// a sample data for chosenEmoji
const testEmojiData = {
  1.5: ["1f605", "1f605"],
  2.0: ["1f3e0"],
};

const emojiSize = 33;

class BulletSection extends React.Component {
  chosenEmoji: any = testEmojiData;
  audio: HTMLAudioElement | null = null;
  interval: any = -1; //Timeout object
  emojiSecRef:
    | React.RefObject<HTMLCanvasElement>
    | undefined = React.createRef();
  ctx: CanvasRenderingContext2D | null = null;

  componentDidMount() {
    this.initializeCanvas();
    this.initializeClearOnUpdate(this.ctx);
  }

  initializeEmojis(liveEmojis: { number: Array<string> }) {
    this.chosenEmoji = liveEmojis;
  }

  initializeCanvas() {
    if (this.emojiSecRef && this.emojiSecRef.current) {
      const canvasEl = this.emojiSecRef.current;
      this.ctx = canvasEl.getContext("2d");
      canvasEl.width = window.innerWidth;
      canvasEl.height = window.innerHeight / 4;
      canvasEl.style.width = canvasEl.width + "px";
      canvasEl.style.height = canvasEl.height + "px";
    }
  }

  initializeClearOnUpdate(ctx: CanvasRenderingContext2D | null) {
    if (this.emojiSecRef && this.emojiSecRef.current) {
      const canvasEl = this.emojiSecRef.current;
      anime({
        duration: Infinity,
        update: function () {
          if (ctx) ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
        },
      });
    }
  }

  initializeAudio(audio: HTMLAudioElement) {
    if (audio) {
      this.audio = audio;
      // if the song is playing, we keep outputing emojis every .5 sec
      this.audio.onplaying = (element: any) => {
        this.clearBulletInterval();
        this.interval = setInterval(this.bulletScreen, 500);
      };

      // if paused or ended, stop outputing emojis
      this.audio.onpause = (element: any) => {
        this.clearBulletInterval();
      };
    }
  }

  // helper function
  clearBulletInterval() {
    if (this.interval !== -1) {
      clearInterval(this.interval);
      this.interval = -1;
    }
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
  async addEmoji(emoji: any) {
    const time = this.getTimeStamp();
    const node = this.createEmojiNode(emoji);
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
    const node = document.createElement("img");
    node.src = getEmojiImageURL(emoji);

    if (this.emojiSecRef && this.emojiSecRef.current) {
      const canvasEl = this.emojiSecRef.current;
      const ctx = this.ctx;
      // the number of emojis in a column the screen can hold
      const options = Math.floor(canvasEl.height / emojiSize);
      // randomly picks a row and calculate the respective height
      let random = Math.floor(Math.random() * options) * emojiSize + 10;
      const result = {
        node: node,
        x: -30,
        y: random,
        endPos: {
          x: canvasEl.width + 30,
          y: random,
        },
        draw: function () {
          if (ctx) ctx.drawImage(node, this.x, this.y, emojiSize, emojiSize);
        },
      };
      return result;
    }
    return undefined;
  }

  onLiveEmojiClick = (node: HTMLDivElement, animation: any) => {};

  // add the emoji to screen and animate it
  emojiToScreen(node: any) {
    if (this.emojiSecRef && this.emojiSecRef.current) {
      const canvasEl = this.emojiSecRef.current;

      const renderParticule = (anim: any) => {
        for (var i = 0; i < anim.animatables.length; i++) {
          anim.animatables[i].target.draw();
        }
      };
      anime.timeline().add({
        targets: [node],
        x: function (node: any) {
          return node.endPos.x;
        },
        y: function (node: any) {
          return node.endPos.y;
        },
        duration: canvasEl.width * 3.5,
        update: renderParticule,
        easing: "linear",
      });
    }
  }

  // add all emojis at the current timestamp to the screen
  bulletScreen = () => {
    if (this.audio != null && this.audio.played) {
      const time = this.getTimeStamp();
      if (time in this.chosenEmoji) {
        this.chosenEmoji[time].forEach((emoji: string) => {
          const node = this.createEmojiNode(emoji);
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
    return <canvas id="emojis" ref={this.emojiSecRef}></canvas>;
  }
}

const baseEmojiUrl =
  "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/";

const getEmojiImageURL = (code: string) => {
  return `${baseEmojiUrl}${code}.png`;
};

export default BulletSection;
