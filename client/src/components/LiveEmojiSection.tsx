import AnimationCanvas from "./AnimationCanvas";
import { ILiveEmojis } from "../types";
import React from "react";
import ReactPlayer from "react-player";
//@ts-ignore
import anime from "animejs/lib/anime.es";
import bananadanceGif from "../assets/bananadance.gif";
import blobExcited from "../assets/blob_excited.gif";
import blobOctopus from "../assets/blob-octopus.gif";
import coolDoge from "../assets/cool-doge.gif";
import handWave from "../assets/hand_wave.gif";
import koopaTroopaMarioKart from "../assets/koopa_troopa_mario_kart.gif";
import letsGoGoombaGif from "../assets/goomba.gif";
import mega from "../assets/mega.gif";
import metroid from "../assets/metroid.gif";
import penguin from "../assets/penguin.gif";
import powerup from "../assets/powerup.gif";
import readMyMind from "../assets/read-my-mind.gif";
import star from "../assets/star.gif";
import streakBonusBuildsGif from "../assets/builds.gif";
import upRedArrow from "../assets/up-red-arrow.gif";
import yahooGamesWoman from "../assets/yahoo_games_woman.png";

const INTERVAL_DELAY = 50;
// before this timestamp, we consider resetting the state of the widget
const RESET_STATE_TIMESTAMP = 0.5;

const WELCOME_CONTAINER_WIDTH = 200;
const LETTER_WIDTH = 7.5;
const GIF_WIDTH = 35;

const EMOJI_HEIGHT = 30;
const EMOJI_WIDTH = 30;
const EMOJI_TOP_OFFSET = 10;
const EMOJI_DURATION_FACTOR = 4.8;
const EMOJI_MIN_DURATION = 2000;

const INSTRUCTIONS = [
  "Press emojis to tally points ",
  "Go for consecutive streaks ",
  "Enter comments to display above ",
  "Add emojis below to flow ",
  "You are great ",
];
const INSTRUCTION_GIFS = [coolDoge, powerup, readMyMind, star, blobOctopus];
const INSTRUCTION_TOP_OFFSET = 20;
const INSTRUCTION_HEIGHT = 45;
const INSTRUCTION_DELAY = 2000;
const INSTRUCTION_STAY_TIME = 5000;
const INSTRUCTION_DURATION_FACTOR = 4;
const INSTRUCTION_WIDTH = 200;

const MEDAL_EMOJIS = ["1f947", "1f948", "1f949"];
const HIGHSCORE_TOP_OFFSET = 70;
const HIGHSCORE_HEIGHT = 50;
const HIGHSCORE_DELAY = 750;
const HIGHSCORE_DURATION_FACTOR = 6;

const MESSAGE_WIDTH = 250;
const MESSAGE_DURATION_FACTOR = 4;
const MESSAGE_MIN_DURATION = 2300;

const URL_TOP_OFFSET = 70;
const URL_HEIGHT = 50;

interface ILiveEmojiSectionProps {
  youtubeRef?: React.RefObject<ReactPlayer>;
  onChangePoints: (points: number) => void;
  scores: { name: string; score: number }[] | undefined;
  setSongPlayingIndex: (index: number) => void;
  updatePoints: (points: number) => void;
}

interface ILiveEmojiSectionState {
  totalPoints: number;
  streakPoints: number;
  showInstruction: boolean;
  showHighscore: boolean;
}

class LiveEmojiSection extends React.Component<
  ILiveEmojiSectionProps,
  ILiveEmojiSectionState
> {
  chosenEmoji: ILiveEmojis = {};
  audio: HTMLAudioElement | null = null;
  interval: NodeJS.Timeout | null = null;
  id: number = 0;
  streakId: number = 0;
  // this stores pairs of <id, animation>
  emojiAnimations: { [nodeid: string]: any } = {};
  latestTimestamp: string = "0"; // store the last timestamp when emojis are sent. Avoid being redundant.
  movingNodes: HTMLDivElement[] = [];
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
      showInstruction: true,
      showHighscore: true,
    };
  }

  initializeEmojis(liveEmojis: ILiveEmojis) {
    this.chosenEmoji = liveEmojis;
    // this.instructionOut();
    this.resetPoints();
  }

  initializeAudio(audio: HTMLAudioElement) {
    if (audio) this.audio = audio;
  }

  onPlayCallback = () => {
    this.instructionOut();
    this.urlsOut();
    this.animateWelcome(true);
    if (this.state.showHighscore) this.highScores();

    this.clearBulletInterval();
    if (
      this.props.youtubeRef &&
      this.props.youtubeRef.current &&
      this.props.youtubeRef.current.getCurrentTime() < RESET_STATE_TIMESTAMP
    )
      this.resetPoints();
    else if (this.audio && this.audio.currentTime < RESET_STATE_TIMESTAMP)
      this.resetPoints();
    this.interval = setInterval(this.liveEmojiScreen, INTERVAL_DELAY);
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

  getPreciseTime() {
    if (this.props.youtubeRef && this.props.youtubeRef.current)
      return this.props.youtubeRef.current.getCurrentTime();
    if (this.audio) return this.audio.currentTime;
    return -1;
  }

  getTimeStamp() {
    return this.round(this.getPreciseTime());
  }

  // round the current time stamp to nearest 0.2 value
  round(num: number) {
    const result = Math.floor(num * 20) / 20;
    // being compatible with previous data
    if (parseFloat(result.toFixed(1)) === parseFloat(result.toFixed(2)))
      return result.toFixed(1);
    return result.toFixed(2);
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
  };

  resetState() {
    this.setState({
      showInstruction: true,
      showHighscore: true,
    });
    this.urlsOut();
  }

  animatePoint() {
    anime.timeline().add({
      targets: ".point-count",
      scale: [0.2, 1],
      duration: 800,
    });
  }

  // manually add the emoji to screen, will be called by the player file
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
    }, INTERVAL_DELAY);
  }

  // shows the instructions
  openingScreen() {
    INSTRUCTIONS.forEach((value, index) => {
      const node = this.createInstructionNode(
        value,
        INSTRUCTION_GIFS[index],
        INSTRUCTION_TOP_OFFSET + INSTRUCTION_HEIGHT * index + "px"
      );
      this.instrNodeToScreen(
        node,
        index * INSTRUCTION_DELAY,
        (INSTRUCTIONS.length + index) * INSTRUCTION_DELAY +
          INSTRUCTION_STAY_TIME
      );
    });
    this.finalInstructionToScreen(
      INSTRUCTIONS.length * 2 * INSTRUCTION_DELAY + INSTRUCTION_STAY_TIME
    );
  }

  // shows high scores
  highScores() {
    if (!this.props.scores || this.getPreciseTime() >= RESET_STATE_TIMESTAMP)
      return;

    const titleNode = this.createInstructionNode(
      "High scores ",
      koopaTroopaMarioKart,
      "20px"
    );
    this.highScoreNodeToScreen(titleNode, 0);

    const inOrderScores = this.props.scores.sort((a, b) => b.score - a.score);
    const texts = inOrderScores.map((score) => score.name + ": " + score.score);

    // getting the top 3 of the leaderboard (if there are more than 3 players)
    for (var i = 0; i < Math.min(3, texts.length); i++) {
      const node = this.createHighScoreNode(
        texts[i],
        MEDAL_EMOJIS[i],
        HIGHSCORE_TOP_OFFSET + HIGHSCORE_HEIGHT * i + "px"
      );
      this.highScoreNodeToScreen(node, (i + 1) * HIGHSCORE_DELAY);
    }
    this.setState({ showHighscore: false });
  }

  // shows the emoji flow
  liveEmojiScreen = () => {
    const time = this.getTimeStamp();
    if (time in this.chosenEmoji && time !== this.latestTimestamp) {
      this.latestTimestamp = time;
      this.chosenEmoji[time].forEach((emoji) => {
        const node = this.createEmojiNode(emoji);
        if (node !== undefined) {
          // have a random time offset for each emoji (dont clutter together)
          setTimeout(() => {
            this.emojiToScreen(node);
          }, Math.random() * INTERVAL_DELAY);
        }
      });
    }
  };

  componentDidUpdate(
    _: ILiveEmojiSectionProps,
    prevState: ILiveEmojiSectionState
  ) {
    if (this.state.totalPoints !== prevState.totalPoints) {
      this.props.updatePoints(this.state.totalPoints);
    }
  }

  /*
   * Below are all helper functions
   */

  // increment points
  addPoint() {
    const streakPoints = this.state.streakPoints + 1;
    const totalPoints =
      this.state.totalPoints + 1 + Math.floor(streakPoints / 5);

    // checking whether to send out a special message animation
    if (
      streakPoints % 5 === 0 ||
      Math.floor(totalPoints / 20) > Math.floor(this.state.totalPoints / 20)
    )
      this.messageToScreen(this.randomBonusNode(), 220);
    else if (Math.random() < 0.1)
      this.messageToScreen(this.randomSpecialNode(), -220);

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

  // when the flowing emoji is clicked
  onLiveEmojiClick(node: HTMLDivElement) {
    const y = parseFloat(node.style.top);
    const transInfo = node.style.transform;
    const x = parseFloat(
      transInfo.substring(transInfo.indexOf("(") + 1, transInfo.indexOf("px"))
    );

    this.animeCanvas.current?.animateParticules(x, y, this.state.streakPoints);

    this.withinClickZone(x, y, node);
    this.emojiAnimations[node.id].pause();

    // shrinks the emoji and make it disappear
    anime({
      targets: node,
      scale: 0.01,
      duration: 100,
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

  randomBonusNode() {
    const choice = Math.floor(Math.random() * 4);
    switch (choice) {
      case 0:
        return this.createBuildNode();
      case 1:
        return this.createPenguinNode();
      case 2:
        return this.createNiceWorkNode();
      case 3:
        return this.createMegamegaNode();
    }
  }

  randomSpecialNode() {
    const choice = Math.floor(Math.random() * 3);
    switch (choice) {
      case 0:
        return this.createGoombaNode();
      case 1:
        return this.createBananadanceNode();
      case 2:
        return this.createMarchonNode();
    }
  }

  randomSongUrl(choices: { index: number; name: string }[]) {
    const titleNode = this.createInstructionNode(
      "Check these out! ",
      blobExcited,
      "20px"
    );
    titleNode.className = "url-title-container";
    this.urlsToScreen(titleNode, true);
    console.log(choices);
    choices.forEach((choice, index) => {
      const node = this.createSongUrlNode(
        choice,
        URL_TOP_OFFSET + index * URL_HEIGHT
      );
      this.urlsToScreen(node, false);
    });
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
    node.style.left = -text.length * LETTER_WIDTH - GIF_WIDTH + "px";
    return node;
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
    node.style.left = -text.length * LETTER_WIDTH - GIF_WIDTH + "px";
    return node;
  }

  // create the img node for emoji
  createEmojiNode(emoji: string) {
    const node = document.createElement("img");
    node.className = "live-emoji";
    node.src = getEmojiImageURL(emoji);
    node.addEventListener(this.tap, () => this.onLiveEmojiClick(node), false);

    if (this.emojiDiv.current) {
      // the number of emojis in a column the screen can hold
      const options =
        Math.floor(this.emojiDiv.current.clientHeight / EMOJI_HEIGHT) - 1;
      // randomly picks a row and calculate the respective height
      let random =
        Math.floor(Math.random() * options) * EMOJI_HEIGHT + EMOJI_TOP_OFFSET;
      node.style.top = random + "px";
    }

    return node;
  }

  // create div node in the form of (gif text gif)
  gifTextGifNode(frontGif: string, text: string, backGif: string) {
    const node = document.createElement("div");
    node.className = "special-bonus-text";
    node.innerText = text;

    const gifNodeBegin = document.createElement("img");
    gifNodeBegin.className = "live-gif";
    gifNodeBegin.src = frontGif;
    node.insertAdjacentElement("afterbegin", gifNodeBegin);

    const gifNodeEnd = document.createElement("img");
    gifNodeEnd.className = "live-gif";
    gifNodeEnd.src = backGif;
    node.insertAdjacentElement("beforeend", gifNodeEnd);

    return node;
  }

  // create div node in the form of (text gif text)
  textGifTextNode(frontText: string, gif: string, backText: string) {
    const node = document.createElement("div");
    node.className = "special-bonus-text";
    node.innerHTML = frontText;

    const gifNodeBegin = document.createElement("img");
    gifNodeBegin.className = "live-gif";
    gifNodeBegin.src = gif;
    node.insertAdjacentElement("beforeend", gifNodeBegin);

    node.innerHTML += backText;
    return node;
  }

  // all functions below here are for bonus message calls
  createBuildNode() {
    return this.gifTextGifNode(
      streakBonusBuildsGif,
      " builder bonus 10+ ",
      streakBonusBuildsGif
    );
  }

  createGoombaNode() {
    return this.textGifTextNode("yee ", letsGoGoombaGif, " lets go");
  }

  createBananadanceNode() {
    return this.textGifTextNode("Go bananas ", bananadanceGif, " go go");
  }

  createMegamegaNode() {
    return this.gifTextGifNode(mega, " mega mega ", mega);
  }

  createMarchonNode() {
    return this.gifTextGifNode(metroid, " march on ", metroid);
  }

  createPenguinNode() {
    return this.gifTextGifNode(penguin, " super super ", penguin);
  }

  createNiceWorkNode() {
    return this.textGifTextNode("yee ", yahooGamesWoman, " nice work");
  }

  createSongUrlNode(choice: { index: number; name: string }, top: number) {
    const node = document.createElement("div");
    node.id = choice.index.toString();
    node.innerText = choice.name;
    node.className = "url-container";
    if (choice.name)
      node.style.left = -choice.name.length * LETTER_WIDTH + "px";
    node.style.top = top + "px";
    node.onclick = () => {
      this.props.setSongPlayingIndex(parseInt(node.id));
      this.resetState();
    };
    return node;
  }

  animateWelcome(fast: boolean) {
    if (this.emojiDiv.current) {
      // if we want fast animation, the duration is low, vice versa
      const duration = this.emojiDiv.current.clientWidth * (fast ? 1 : 3);
      anime.timeline().add({
        targets: ".welcome-container",
        translateX: this.emojiDiv.current.clientWidth + WELCOME_CONTAINER_WIDTH,
        duration: duration,
        easing: fast ? "easeInExpo" : "linear",
        complete: () => {
          this.setState({ showInstruction: false });
        },
      });
    }
  }

  // goes to the middle of the screen and wait and flow to the end of the screen
  instrNodeToScreen(node: HTMLDivElement, delayIn: number, delayOut: number) {
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      const width = this.emojiDiv.current.clientWidth;
      this.movingNodes.push(node);
      anime
        .timeline()
        .add(
          {
            targets: node,
            translateX: (width + node.clientWidth + GIF_WIDTH) / 2,
            duration: (width * INSTRUCTION_DURATION_FACTOR) / 2,
            easing: "easeOutQuad",
          },
          delayIn
        )
        .add(
          {
            targets: node,
            translateX: width + node.clientWidth + GIF_WIDTH,
            duration: (width * INSTRUCTION_DURATION_FACTOR) / 2,
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

  // last instruction that stays in the middle until user clicks on play
  finalInstructionToScreen(delay: number) {
    const node = this.createInstructionNode(
      "Click video above to begin ",
      upRedArrow,
      "100px"
    );
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      this.movingNodes.push(node);
      const width = this.emojiDiv.current.clientWidth;
      anime.timeline().add(
        {
          targets: node,
          translateX: (width + node.clientWidth + GIF_WIDTH) / 2,
          duration: INSTRUCTION_DURATION_FACTOR / 2,
          easing: "easeOutQuad",
        },
        delay
      );
    }
  }

  highScoreNodeToScreen(node: HTMLDivElement, delay: number) {
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      const width = this.emojiDiv.current.clientWidth;
      anime.timeline().add(
        {
          targets: node,
          translateX: width + node.clientWidth,
          duration: width * HIGHSCORE_DURATION_FACTOR,
          easing: "linear",
          complete: () => {
            try {
              node.parentElement?.removeChild(node);
            } catch (e) {
              //console.log(e);
            }
          },
        },
        delay
      );
    }
  }

  // add the emoji to screen and animate it
  emojiToScreen(node: HTMLImageElement) {
    node.id = this.id.toString();
    if (this.emojiDiv.current) {
      this.emojiDiv.current.appendChild(node);
      let width = this.emojiDiv.current.clientWidth;
      const animation = anime({
        targets: node,
        translateX: width + EMOJI_WIDTH,
        scale: anime.random(13, 17) / 10,
        duration: Math.max(EMOJI_MIN_DURATION, width * EMOJI_DURATION_FACTOR),
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

  messageToScreen(node: HTMLDivElement | undefined, top: number) {
    if (this.emojiDiv.current && node) {
      node.style.top = top + "px";
      this.emojiDiv.current.appendChild(node);
      let width = this.emojiDiv.current.clientWidth;
      const animation = anime({
        targets: node,
        translateX: width + MESSAGE_WIDTH,
        duration: Math.max(
          MESSAGE_MIN_DURATION,
          width * MESSAGE_DURATION_FACTOR
        ),
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

  urlsToScreen(node: HTMLDivElement, title: boolean) {
    if (this.emojiDiv.current && node) {
      this.emojiDiv.current.appendChild(node);
      let width = this.emojiDiv.current.clientWidth;
      const animation = anime({
        targets: node,
        translateX:
          (width +
            node.innerText.length * LETTER_WIDTH +
            (title ? GIF_WIDTH : 0)) /
          2,
        duration: (width * MESSAGE_DURATION_FACTOR) / 2,
        easing: "easeOutExpo",
      });
      return animation;
    }
  }

  // quickly move the instructions out of the way when the video is being played.
  instructionOut() {
    if (this.emojiDiv.current) {
      const width = this.emojiDiv.current.clientWidth;
      anime({
        targets: this.movingNodes,
        translateX: width + INSTRUCTION_WIDTH,
        duration: width / 2,
        easing: "easeInExpo",
        complete: () => {
          this.movingNodes.forEach((node) => {
            try {
              node.parentElement?.removeChild(node);
            } catch (e) {
              //console.log(e);
            }
          });
          this.movingNodes = [];
        },
      });
    }
  }

  // quickly move the urls out of the way when the video is being played.
  urlsOut() {
    if (this.emojiDiv.current) {
      const width = this.emojiDiv.current.clientWidth;
      anime({
        targets: [".url-container", ".url-title-container"],
        translateX: width * 2,
        duration: width / 2,
        easing: "easeInExpo",
        complete: () => {
          this.movingNodes.forEach((node) => {
            try {
              node.parentElement?.removeChild(node);
            } catch (e) {
              //console.log(e);
            }
          });
          this.movingNodes = [];
        },
      });
    }
  }

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
          {this.state.showInstruction && (
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
