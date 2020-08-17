import React from "react";
//@ts-ignore
import anime from "animejs/lib/anime.es";
import AnimationCanvas from "./AnimationCanvas";

// a sample data for chosenEmoji
const testEmojiData = {
  1.5: ["1f605", "1f605"],
  2.0: ["1f3e0"],
};

class BulletSection extends React.Component<
  {},
  { totalPoints: number; streakPoints: number }
> {
  chosenEmoji: any = testEmojiData;
  audio: HTMLAudioElement | null = null;
  interval: any = -1; //Timeout object
  id: number = 0;
  streakId: number = 0;
  emojiAnimations: any = {};
  emojiDiv: React.RefObject<HTMLDivElement> = React.createRef();
  animeCanvas: React.RefObject<AnimationCanvas> = React.createRef();
  clickZone: React.RefObject<HTMLDivElement> = React.createRef();
  streakDisplay: React.RefObject<HTMLCanvasElement> = React.createRef();
  streakCount: React.RefObject<HTMLSpanElement> = React.createRef();

  // the value could either be "touchstart" or "mousedown", used to detect both taps and mouse clicks
  tap: "touchstart" | "mousedown" =
    "ontouchstart" in window || navigator.msMaxTouchPoints
      ? "touchstart"
      : "mousedown";

  constructor(props: Readonly<{}>) {
    super(props);
    this.state = {
      totalPoints: 0,
      streakPoints: 0,
    };
  }
  componentDidMount() {
    this.initializeStreak();
  }

  initializeStreak() {
    if (this.streakCount.current) {
      const countRef = this.streakCount.current;
      countRef.style.color = "rgb(255, 0, 0)";
      countRef.hidden = true;
    }
  }

  animateInstruction() {
    if (this.emojiDiv.current) {
      let width = this.emojiDiv.current.clientWidth;
      anime({
        targets: ".instruction",
        translateX: function () {
          return width + 100;
        },
        duration: function () {
          return width * 4.8;
        },
        easing: "linear",
      });
    }
  }

  resetStreak = () => {
    this.setState({
      streakPoints: 0,
    });
    this.animateStreak();
  };

  animateStreak() {
    if (this.streakDisplay.current) {
      const display = this.streakDisplay.current;
      const ctx = display.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, display.width, display.height);
      }
    }

    if (this.streakCount.current) {
      const countRef = this.streakCount.current;
      if (this.state.streakPoints >= 5) countRef.hidden = false;
      else countRef.hidden = true;
      countRef.style.color =
        "rgb(255," + Math.min(200, (this.state.streakPoints - 5) * 10) + ", 0)";
    }

    anime.timeline().add({
      targets: ".streak-count-text",
      scale: [0.2, 1],
      duration: 800,
    });
  }

  resetPoints() {
    this.setState({
      totalPoints: 0,
      streakPoints: 0,
    });
  }

  initializeEmojis(liveEmojis: { number: Array<string> }) {
    this.chosenEmoji = liveEmojis;
    this.resetPoints();
  }

  initializeAudio(audio: HTMLAudioElement) {
    // helper function
    const clearBulletInterval = () => {
      if (this.interval !== -1) {
        clearInterval(this.interval);
        this.interval = -1;
      }
    };

    if (audio) {
      this.audio = audio;
      // if the song is playing, we keep outputing emojis every .5 sec
      this.audio.onplaying = (element: any) => {
        clearBulletInterval();
        this.animateInstruction();
        if (this.audio && this.audio.currentTime < 0.1) this.resetPoints();
        this.interval = setInterval(this.bulletScreen, 50);
      };

      // if paused or ended, stop outputing emojis
      this.audio.onpause = (element: any) => {
        clearBulletInterval();
      };
    }
  }

  // round the current time stamp to nearest 0.2 value
  round(num: number) {
    const result = Math.floor(num * 20) / 20;
    // being compatible with previous data
    if (parseFloat(result.toFixed(1)) === parseFloat(result.toFixed(2)))
      return result.toFixed(1);
    return result.toFixed(2);
  }

  getTimeStamp() {
    if (this.audio) return this.round(this.audio.currentTime);
    return -1;
  }

  // manually add the emoji to screen
  async addEmoji(emoji: any) {
    const time = this.getTimeStamp();
    if (time <= 0) return;
    const node = this.createEmojiNode(emoji);
    if (node !== undefined) {
      this.emojiToScreen(node);
    }

    // add the emoji to the list 0.5 sec later to avoid outputing emoji twice
    setTimeout(() => {
      if (!(time in this.chosenEmoji)) this.chosenEmoji[time] = [];
      this.chosenEmoji[time].push(emoji);
    }, 50);
  }

  addPoint() {
    const streakPoints = this.state.streakPoints + 1;
    const totalPoints =
      this.state.totalPoints + 1 + Math.floor(streakPoints / 5);
    this.setState({
      totalPoints: totalPoints,
      streakPoints: streakPoints,
    });
    this.animateStreak();
  }

  withinClickZone(x: number, y: number, node: HTMLDivElement) {
    if (this.clickZone.current) {
      const rect = this.clickZone.current.getBoundingClientRect();
      if (
        x >= rect.left &&
        x <= rect.right &&
        y >= 0 &&
        y <= rect.bottom - rect.top
      ) {
        if (this.streakId !== parseInt(node.id) - 1) {
          this.resetStreak();
          this.streakId = parseInt(node.id);
        } else {
          this.streakId++;
        }
        this.addPoint();
      }
    }
  }

  onLiveEmojiClick(node: HTMLDivElement) {
    const y = parseFloat(node.style.top);
    const transInfo = node.style.transform;
    const x = parseFloat(
      transInfo.substring(transInfo.indexOf("(") + 1, transInfo.indexOf("px"))
    );

    this.animeCanvas.current?.animateParticules(x, y);

    this.withinClickZone(x, y, node);
    this.emojiAnimations[node.id].pause();

    // shrinks the emoji and make it disappear
    anime({
      targets: node,
      scale: function () {
        return 0.01;
      },
      duration: function () {
        return 100;
      },
      easing: "linear",
      complete: () => {
        try {
          node.parentElement?.removeChild(node);
        } catch (e) {
          //console.log(e);
        }
      },
    });
  }

  // create the img node for emoji
  createEmojiNode(emoji: string) {
    const node = document.createElement("img");
    node.className = "live-emoji";
    node.src = getEmojiImageURL(emoji);
    node.addEventListener(this.tap, () => this.onLiveEmojiClick(node), false);

    if (this.emojiDiv.current) {
      // the number of emojis in a column the screen can hold
      const options = Math.floor(this.emojiDiv.current.clientHeight / 30) - 1;
      // randomly picks a row and calculate the respective height
      let random = Math.floor(Math.random() * options) * 30 + 10;
      node.style.top = [random + "px"] as any;
    }

    return node;
  }

  // add the emoji to screen and animate it
  emojiToScreen(node: HTMLDivElement) {
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      let width = this.emojiDiv.current.clientWidth;
      const animation = anime({
        targets: node,
        translateX: function () {
          return width + 30;
        },
        scale: function () {
          return anime.random(13, 17) / 10;
        },
        duration: function () {
          return width * 4.8;
        },
        easing: "linear",
        complete: () => {
          try {
            node.parentElement?.removeChild(node);
            this.resetStreak();
          } catch (e) {}
        },
      });
      node.id = this.id.toString();
      this.emojiAnimations[this.id] = animation;
      this.id++;
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
            }, Math.random() * 25);
          }
        });
      }
    }
  };

  render() {
    return (
      <div id="bullet-sec">
        <div className="instruction"> Click emojis to add to stream </div>
        <div className="instruction">
          Click flowing emojis for points: {this.state.totalPoints}
        </div>
        <div className="clickzone" ref={this.clickZone} />
        <div id="emojis" ref={this.emojiDiv}>
          <AnimationCanvas
            ref={this.animeCanvas}
            resetStreak={this.resetStreak}
          />
          <canvas
            className="streak-container"
            ref={this.streakDisplay}
          ></canvas>
          <span className="streak-count-text" ref={this.streakCount}>
            {this.state.streakPoints}
          </span>
        </div>
      </div>
    );
  }
}

const baseEmojiUrl =
  "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/";

const getEmojiImageURL = (code: string) => {
  return `${baseEmojiUrl}${code}.png`;
};

export default BulletSection;
