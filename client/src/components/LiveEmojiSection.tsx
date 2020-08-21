import AnimationCanvas from "./AnimationCanvas";
import React from "react";
import ReactPlayer from "react-player";
//@ts-ignore
import anime from "animejs/lib/anime.es";
import bananadanceGif from "../assets/bananadance.gif";
import letsGoGoombaGif from "../assets/goomba.gif";
import streakBonusBuildsGif from "../assets/builds.gif";

// a sample data for chosenEmoji
const testEmojiData = {
  1.5: ["1f605", "1f605"],
  2.0: ["1f3e0"],
};

interface ILiveEmojiSectionProps {
  youtubeRef?: React.RefObject<ReactPlayer>;
  onChangePoints: (points: number) => void;
}

interface ILiveEmojiSectionState {
  totalPoints: number;
  streakPoints: number;
}

class LiveEmojiSection extends React.Component<
  ILiveEmojiSectionProps,
  ILiveEmojiSectionState
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
  streakCount: React.RefObject<HTMLSpanElement> = React.createRef();
  youtubeRef?: React.RefObject<ReactPlayer> = React.createRef();

  // the value could either be "touchstart" or "mousedown", used to detect both taps and mouse clicks
  tap: "touchstart" | "mousedown" =
    "ontouchstart" in window || navigator.msMaxTouchPoints
      ? "touchstart"
      : "mousedown";

  constructor(props: Readonly<ILiveEmojiSectionProps>) {
    super(props);
    this.state = {
      totalPoints: 0,
      streakPoints: 0,
    };
    this.youtubeRef = props.youtubeRef;
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

  initializeEmojis(liveEmojis: { number: Array<string> }) {
    this.chosenEmoji = liveEmojis;
    this.resetPoints();
  }

  initializeInstruction() {
    if (this.emojiDiv.current) {
      let width = this.emojiDiv.current.clientWidth;
      anime({
        targets: ".instruction",
        translateX: function () {
          return width + 100;
        },
        duration: function () {
          return width;
        },
        easing: "easeOutQuart",
      });
    }
  }

  initializeAudio(audio: HTMLAudioElement) {
    if (audio) this.audio = audio;
  }

  componentWillUnmount() {
    this.clearBulletInterval();
  }

  onPlayCallback = () => {
    this.clearBulletInterval();
    this.initializeInstruction();
    if (
      this.youtubeRef &&
      this.youtubeRef.current &&
      this.youtubeRef.current.getCurrentTime() < 0.1
    )
      this.resetPoints();
    else if (this.audio && this.audio.currentTime < 0.1) this.resetPoints();
    this.interval = setInterval(this.liveEmojiScreen, 50);
  };

  onPauseCallback = () => {
    this.clearBulletInterval();
  };

  clearBulletInterval = () => {
    if (this.interval !== -1) {
      clearInterval(this.interval);
      this.interval = -1;
    }
  };

  // manually add the emoji to screen
  async addEmoji(emoji: string) {
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

  // round the current time stamp to nearest 0.2 value
  round(num: number) {
    const result = Math.floor(num * 20) / 20;
    // being compatible with previous data
    if (parseFloat(result.toFixed(1)) === parseFloat(result.toFixed(2)))
      return result.toFixed(1);
    return result.toFixed(2);
  }

  // check if we are on a youtube page first
  getTimeStamp() {
    if (this.youtubeRef && this.youtubeRef.current)
      return this.round(this.youtubeRef.current.getCurrentTime());
    if (this.audio) return this.round(this.audio.currentTime);
    return -1;
  }

  resetPoints() {
    this.setState({
      totalPoints: 0,
      streakPoints: 0,
    });
    this.id = 0;
    this.streakId = 0;
  }

  resetStreak = () => {
    this.setState({
      streakPoints: 0,
    });
    this.animateStreak();
  };

  animateStreak() {
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

  addPoint() {
    const streakPoints = this.state.streakPoints + 1;
    const totalPoints =
      this.state.totalPoints + 1 + Math.floor(streakPoints / 5);

    // checking whether to send out a special message animation
    if (streakPoints === 5) this.streakBonusToScreen();
    else if (Math.random() < 0.1) this.bananadanceToScreen();
    else if (
      Math.floor(totalPoints / 10) - Math.floor(this.state.totalPoints / 10) ===
      1
    )
      this.goombaToScreen();

    // update the state
    this.setState({
      totalPoints: totalPoints,
      streakPoints: streakPoints,
    });
    this.props.onChangePoints(totalPoints);

    // animate the streak number
    this.animateStreak();
  }

  // check if the click should generate points (at this point anywhere within the canvas)
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
  emojiToScreen(node: HTMLImageElement) {
    node.id = this.id.toString();
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
            if (parseInt(node.id) > this.streakId) this.resetStreak();
          } catch (e) {}
        },
      });
      this.emojiAnimations[this.id] = animation;
      this.id++;
    }
  }

  // all functions below here are for bonus message calls
  createStreakBonusNode() {
    const node = document.createElement("div");
    node.className = "streak-bonus-text";
    node.innerText = " builder bonus 10+ ";

    const gifNodeBegin = document.createElement("img");
    gifNodeBegin.className = "live-gif";
    gifNodeBegin.src = streakBonusBuildsGif;
    node.insertAdjacentElement("afterbegin", gifNodeBegin);

    const gifNodeEnd = document.createElement("img");
    gifNodeEnd.className = "live-gif";
    gifNodeEnd.src = streakBonusBuildsGif;
    node.insertAdjacentElement("beforeend", gifNodeEnd);

    return node;
  }

  streakBonusToScreen() {
    const node = this.createStreakBonusNode();
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      let width = this.emojiDiv.current.clientWidth;
      const animation = anime({
        targets: node,
        translateX: function () {
          return width + node.clientWidth * 1.5;
        },
        duration: function () {
          return width * 3.6;
        },
        easing: "linear",
        complete: () => {
          try {
            node.parentElement?.removeChild(node);
          } catch (e) {}
        },
      });
      return animation;
    }
  }

  createGoombaNode() {
    const node = document.createElement("div");
    node.className = "goomba-bonus-text";
    node.innerHTML = "yee ";

    const gifNodeBegin = document.createElement("img");
    gifNodeBegin.className = "live-gif";
    gifNodeBegin.src = letsGoGoombaGif;
    node.insertAdjacentElement("beforeend", gifNodeBegin);

    node.innerHTML += " lets go";
    return node;
  }

  goombaToScreen() {
    const node = this.createGoombaNode();
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      let width = this.emojiDiv.current.clientWidth;
      const animation = anime({
        targets: node,
        translateX: function () {
          return width + node.clientWidth * 1.5;
        },
        duration: function () {
          return width * 3.6;
        },
        easing: "linear",
        complete: () => {
          try {
            node.parentElement?.removeChild(node);
          } catch (e) {}
        },
      });
      return animation;
    }
  }

  createBananadanceNode() {
    const node = document.createElement("div");
    node.className = "special-bonus-text";
    node.innerHTML = "Go bananas ";

    const gifNodeBegin = document.createElement("img");
    gifNodeBegin.className = "live-gif";
    gifNodeBegin.src = bananadanceGif;
    node.insertAdjacentElement("beforeend", gifNodeBegin);

    node.innerHTML += " go go";
    return node;
  }

  bananadanceToScreen() {
    const node = this.createBananadanceNode();
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      let width = this.emojiDiv.current.clientWidth;
      const animation = anime({
        targets: node,
        translateX: function () {
          return width + node.clientWidth * 1.5;
        },
        duration: function () {
          return width * 4;
        },
        easing: "linear",
        complete: () => {
          try {
            node.parentElement?.removeChild(node);
          } catch (e) {}
        },
      });
      return animation;
    }
  }

  // add all emojis at the current timestamp to the screen
  liveEmojiScreen = () => {
    const time = this.getTimeStamp();
    if (time in this.chosenEmoji) {
      this.chosenEmoji[time].forEach((emoji: string) => {
        const node = this.createEmojiNode(emoji);
        if (node !== undefined) {
          // have a random time offset for each emoji (dont clutter together)
          setTimeout(() => {
            this.emojiToScreen(node);
          }, Math.random() * 50);
        }
      });
    }
  };

  render() {
    return (
      <div id="live-emoji-sec">
        <div className="instruction"> Click emojis to add to stream </div>
        <div className="instruction">
          Click flowing emojis for points: {this.state.totalPoints}
        </div>
        <div className="clickzone" ref={this.clickZone} />
        <div id="emojis" ref={this.emojiDiv}>
          <div className="special-bonus-text">Special Text</div>
          <AnimationCanvas
            ref={this.animeCanvas}
            resetStreak={this.resetStreak}
          />
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

export default LiveEmojiSection;
