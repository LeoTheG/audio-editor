import AnimationCanvas from "./AnimationCanvas";
import React from "react";
import ReactPlayer from "react-player";
//@ts-ignore
import anime from "animejs/lib/anime.es";
import bananadanceGif from "../assets/bananadance.gif";
import letsGoGoombaGif from "../assets/goomba.gif";
import streakBonusBuildsGif from "../assets/builds.gif";
import handWave from "../assets/hand_wave.gif";
import coolDoge from "../assets/cool-doge.gif";
import powerup from "../assets/powerup.gif";
import readMyMind from "../assets/read-my-mind.gif";
import blobOctopus from "../assets/blob-octopus.gif";
import alloHappy from "../assets/allo-happy.gif";
import koopaTroopaMarioKart from "../assets/koopa_troopa_mario_kart.gif";
import star from "../assets/star.gif";

import { ILiveEmojis } from "../types";

// a sample data for chosenEmoji
const testEmojiData = {
  1.5: ["1f605", "1f605"],
  2.0: ["1f3e0"],
};

interface ILiveEmojiSectionProps {
  youtubeRef?: React.RefObject<ReactPlayer>;
  onChangePoints: (points: number) => void;
  scores: { name: string; score: number }[] | undefined;
}

interface ILiveEmojiSectionState {
  totalPoints: number;
  streakPoints: number;
  firstTime: boolean;
}

class LiveEmojiSection extends React.Component<
  ILiveEmojiSectionProps,
  ILiveEmojiSectionState
> {
  chosenEmoji: ILiveEmojis = testEmojiData;
  audio: HTMLAudioElement | null = null;
  interval: NodeJS.Timeout | null = null; //Timeout object
  id: number = 0;
  streakId: number = 0;
  // this stores pairs of <id, animation>
  emojiAnimations: { [nodeid: string]: any } = {};
  emojiDiv: React.RefObject<HTMLDivElement> = React.createRef();
  animeCanvas: React.RefObject<AnimationCanvas> = React.createRef();
  clickZone: React.RefObject<HTMLDivElement> = React.createRef();

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
      firstTime: true,
    };
  }

  componentDidMount() {}

  initializeEmojis(liveEmojis: ILiveEmojis) {
    this.chosenEmoji = liveEmojis;
    this.resetPoints();
  }

  openingScreen() {
    const instrs = [
      "Press emojis to tally points ",
      "Go for consecutive streaks ",
      "Enter comments to display above ",
      "Add emojis to flow here ",
      "You are great ",
    ];
    const gifSrcs = [coolDoge, powerup, readMyMind, alloHappy, blobOctopus];
    const base = 20;
    const space = 45;
    const delay = 2000;
    const nodes = [];
    for (var i = 0; i < instrs.length; i++) {
      const node = this.createInstructionNode(
        instrs[i],
        gifSrcs[i],
        base + space * i + "px"
      );
      nodes.push(node);
      this.animateInstrNode(node, i * delay, (instrs.length + 1 + i) * delay);
    }
    nodes.forEach((node: HTMLDivElement) => {});
  }

  createInstructionNode(text: string, gifSrc: string, top: string) {
    const node = document.createElement("div");
    node.className = "instruction";
    node.innerHTML = text;
    const gifNode = document.createElement("img");
    gifNode.className = "live-gif";
    gifNode.src = gifSrc;
    node.insertAdjacentElement("beforeend", gifNode);
    node.style.top = top;
    node.style.left = -text.length * 7.5 - 35 + "px";
    return node;
  }

  animateInstrNode(node: HTMLDivElement, delayIn: number, delayOut: number) {
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      const width = this.emojiDiv.current.clientWidth;
      anime
        .timeline()
        .add(
          {
            targets: node,
            translateX: function () {
              return (width + node.clientWidth) / 2 + 20;
            },
            duration: function () {
              return width * 2.5;
            },
            easing: "easeOutQuad",
          },
          delayIn
        )
        .add(
          {
            targets: node,
            translateX: function () {
              return width + node.clientWidth + 20;
            },
            duration: function () {
              return width * 2.5;
            },
            easing: "easeInQuad",
            complete: () => {
              try {
                node.parentElement?.removeChild(node);
              } catch (e) {
                //console.log(e);
              }
            },
          },
          delayOut
        );
    }
  }

  highScores() {
    if (!this.props.scores || this.getPreciseTime() >= 0.5) return;

    const titleNode = this.createInstructionNode(
      "High scores ",
      koopaTroopaMarioKart,
      "20px"
    );
    this.animateHighScoreNode(titleNode, 0);

    const inOrderScores = this.props.scores.sort((a, b) => b.score - a.score);
    const texts = inOrderScores.map(
      (score, index) => score.name + ": " + score.score
    );

    const emojis = ["1f947", "1f948", "1f949"];
    const base = 70;
    const space = 50;
    // getting the top 3 of the leaderboard (if there are more than 3 players)
    for (var i = 0; i < Math.min(3, texts.length); i++) {
      const node = this.createHighScoreNode(
        texts[i],
        emojis[i],
        base + space * i + "px"
      );
      this.animateHighScoreNode(node, (i + 1) * 750);
    }
  }

  animateHighScoreNode(node: HTMLDivElement, delay: number) {
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      const width = this.emojiDiv.current.clientWidth;
      anime.timeline().add(
        {
          targets: node,
          translateX: function () {
            return width + node.clientWidth;
          },
          duration: function () {
            return width * 6;
          },
          easing: "linear",
        },
        delay
      );
    }
  }

  createHighScoreNode(text: string, emoji: string, top: string) {
    const node = document.createElement("div");
    node.className = "high-score";
    node.innerHTML = text;
    const emojiNode = document.createElement("img");
    emojiNode.className = "live-gif";
    emojiNode.src = getEmojiImageURL(emoji);
    node.insertAdjacentElement("beforeend", emojiNode);
    node.style.top = top;
    node.style.left = -text.length * 7.5 - 35 + "px";
    return node;
  }

  initializeAudio(audio: HTMLAudioElement) {
    if (audio) this.audio = audio;
  }

  animateWelcome(fast: boolean) {
    if (this.emojiDiv.current) {
      const duration = this.emojiDiv.current.clientWidth * (fast ? 1 : 3);
      anime.timeline().add({
        targets: ".welcome-container",
        translateX: this.emojiDiv.current.clientWidth + 200,
        duration: duration,
        easing: fast ? "easeInExpo" : "linear",
        complete: () => {
          this.setState({ firstTime: false });
        },
      });
    }
  }

  onPlayCallback = () => {
    this.animateWelcome(true);
    this.highScores();

    this.clearBulletInterval();
    if (
      this.props.youtubeRef &&
      this.props.youtubeRef.current &&
      this.props.youtubeRef.current.getCurrentTime() < 0.1
    )
      this.resetPoints();
    else if (this.audio && this.audio.currentTime < 0.1) this.resetPoints();
    this.interval = setInterval(this.liveEmojiScreen, 50);
  };

  onPauseCallback = () => {
    this.clearBulletInterval();
  };

  clearBulletInterval = () => {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  };

  // manually add the emoji to screen
  async addEmoji(emoji: string) {
    const time = this.getTimeStamp();
    if (parseInt(time) <= 0) return;
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

  getPreciseTime() {
    if (this.props.youtubeRef && this.props.youtubeRef.current)
      return this.props.youtubeRef.current.getCurrentTime();
    if (this.audio) return this.audio.currentTime;
    return -1;
  }

  getTimeStamp() {
    return this.round(this.getPreciseTime());
  }

  resetPoints() {
    this.setState({
      totalPoints: 0,
      streakPoints: 0,
      firstTime: true,
    });
    this.id = 0;
    this.streakId = 0;
  }

  resetStreak = () => {
    this.setState({
      streakPoints: 0,
    });
  };

  animatePoint() {
    console.log("Animate");
    anime.timeline().add({
      targets: ".point-count",
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
    this.animatePoint();
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
    this.starToScreen();
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
      node.style.top = random + "px";
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

  starToScreen() {
    const node = document.createElement("img");
    node.src = star;
    node.className = "star-gif";
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      let width = this.emojiDiv.current.clientWidth;
      const animation = anime({
        targets: node,
        translateX: function () {
          return width + node.clientWidth + 150;
        },
        duration: function () {
          return width * 2;
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

  getStreakColor() {
    const r = 255;
    const g = Math.min(200, (this.state.streakPoints - 5) * 10);
    const b = 0;
    return "rgb(" + r + ", " + g + ", " + b + ")";
  }

  render() {
    return (
      <div id="live-emoji-sec">
        <div className="point-container">
          <span
            style={{
              paddingLeft: this.state.streakPoints < 5 ? "6rem" : "1rem",
            }}
          >
            Total points:
            <span className="point-count"> {this.state.totalPoints} </span>
          </span>
          <span
            hidden={this.state.streakPoints < 5}
            style={{ color: this.getStreakColor(), paddingLeft: "5rem" }}
          >
            Streak points:
            <span className="point-count"> {this.state.streakPoints} </span>
          </span>
        </div>

        <div className="clickzone" ref={this.clickZone} />

        <div id="emojis" ref={this.emojiDiv}>
          {this.state.firstTime && (
            <div className="welcome-container">
              <img
                src={handWave}
                alt="welcome"
                onClick={() => {
                  this.animateWelcome(false);
                  this.openingScreen();
                }}
              />
              <div>Click for instructions</div>
            </div>
          )}

          <AnimationCanvas
            ref={this.animeCanvas}
            resetStreak={this.resetStreak}
          />
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
