//@ts-ignore
import anime from "animejs/lib/anime.es";
import { IBullets } from "../types";
import React from "react";
import ReactPlayer from "react-player";

interface IBulletSectionProps {
  youtubeRef?: React.RefObject<ReactPlayer>;
  updateBullets: () => void;
  submitBullet: (text: string) => void;
}

interface IBulletSectionState {
  inputValue: string;
}

const INTERVAL_DELAY = 500;

// potential colors bullet text can use
const COLOR_PALLET = [
  "#86de89",
  "#49a01c",
  "#3f3ee2",
  "#5bc080",
  "#b1be0f",
  "#8fcf15",
  "#8c4af4",
  "#fd4a50",
  "#06ffe4",
  "#ed5b6f",
  "#f034db",
  "#bf4e37",
  "#9aa46c",
  "#5a446b",
  "#ad9041",
  "#ca141f",
];

const TEXT_HEIGHT = 30;
const LETTER_WIDTH = 7.5;
const BULLET_SCREEN_OFFSET_TOP = 45;
const SEC_PER_LETTER = 0.03;
const DURATION_FACTOR = 12;

// const fonts = [
//   "fonts",
//   "bangers, cursive",
//   "bio rhyme, serif",
//   "caveat, cursive",
//   "fjalla one, sans-serif",
//   "ibm plex mono, monospace",
//   "lobster, cursive",
//   "noto sans, sans-serif",
//   "patrick hand, cursive",
//   "shadows into light, cursive",
//   "yatra one, cursive",
// ];

class BulletSection extends React.Component<
  IBulletSectionProps,
  IBulletSectionState
> {
  bullets: IBullets = {};
  audio: HTMLAudioElement | null = null;
  interval: NodeJS.Timeout | null = null; //Timeout object
  id: number = 0;
  // stores the <lane, timestamp> pair
  lanes: { [lane: number]: number } = {};
  availColor: string[] = [];
  bulletDiv: React.RefObject<HTMLDivElement> = React.createRef();
  youtubeRef?: React.RefObject<ReactPlayer> = React.createRef();

  // the value could either be "touchstart" or "mousedown", used to detect both taps and mouse clicks
  tap: "touchstart" | "mousedown" =
    "ontouchstart" in window || navigator.msMaxTouchPoints
      ? "touchstart"
      : "mousedown";

  constructor(props: IBulletSectionProps) {
    super(props);
    this.state = {
      inputValue: "",
    };
    this.youtubeRef = props.youtubeRef;
    this.resetColor();
  }

  resetColor() {
    this.availColor = [...COLOR_PALLET];
  }

  onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ inputValue: e.target.value });
  };

  // get all possible lanes in the screen
  initializeLanes() {
    if (this.bulletDiv.current) {
      const screen = this.bulletDiv.current;
      const options = Math.floor(screen.clientHeight / TEXT_HEIGHT);
      for (var i = 0; i < options - 1; i++) this.lanes[i * TEXT_HEIGHT] = 0;
    }
  }

  // called when the youtube player is ready, to match the dimension of the player
  matchPlayerDim = () => {
    if (this.bulletDiv.current) {
      const screen = this.bulletDiv.current;
      if (
        this.youtubeRef &&
        this.youtubeRef.current &&
        this.youtubeRef.current.props.height
      )
        screen.style.height = this.youtubeRef.current.props.height.toString();
      if (screen.parentElement)
        screen.style.top = -screen.parentElement.offsetTop + "px";
      this.initializeLanes();
    }
  };

  componentDidMount() {
    const initializeBulletScreen = () => {
      if (this.bulletDiv.current) {
        const screen = this.bulletDiv.current;
        // move the bullet section to the top of the screen
        if (screen.parentElement)
          screen.style.top =
            -screen.parentElement.offsetTop +
            (this.props.youtubeRef ? 0 : BULLET_SCREEN_OFFSET_TOP) +
            "px";
        this.initializeLanes();
      }
    };
    initializeBulletScreen();
    window.addEventListener("resize", initializeBulletScreen);
  }

  initializeAudio(audio: HTMLAudioElement) {
    if (audio) {
      this.audio = audio;
      // if the song is playing, we keep outputing emojis every .5 sec
      this.audio.onplaying = this.onPlayCallback;

      // if paused or ended, stop outputing emojis
      this.audio.onpause = this.onPauseCallback;
    }
  }

  initializeBullets(bullets: IBullets) {
    this.bullets = bullets;
  }

  // helper function
  clearBulletInterval = () => {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  };

  onPlayCallback = () => {
    setTimeout(() => {
      this.clearBulletInterval();
      this.interval = setInterval(this.bulletScreen, INTERVAL_DELAY);
    }, INTERVAL_DELAY);
  };

  onPauseCallback = () => {
    this.clearBulletInterval();
  };

  // round the current time stamp to nearest 0.2 value
  round(num: number) {
    const result = Math.floor(num * 2) / 2;
    return result.toFixed(1);
  }

  getPreciseTime() {
    if (this.youtubeRef && this.youtubeRef.current)
      return this.youtubeRef.current.getCurrentTime();
    if (this.audio) return this.audio.currentTime;
    return -1;
  }

  getTimeStamp() {
    return this.round(this.getPreciseTime());
  }

  // find a random lane that suits the bullet (make sure no overlap)
  getLane() {
    const result: number[] = [];
    Object.keys(this.lanes).forEach((value: string) => {
      // the lane is available only if it was being used earlier enough
      const key = parseInt(value);
      if (this.getPreciseTime() > this.lanes[key]) result.push(key);
    });

    if (result.length === 0) return -1;
    return result[Math.floor(Math.random() * result.length)];
  }

  addBullet = () => {
    const text = this.state.inputValue;
    if (text.length === 0) return;

    this.textToScreen(text);
    this.props.submitBullet(text);
    this.setState({ inputValue: "" });

    const time = this.getTimeStamp();

    if (parseInt(time) <= 0) return;
    // add the emoji to the list 0.5 sec later to avoid outputing emoji twice
    setTimeout(() => {
      if (!(time in this.bullets)) this.bullets[time] = [];
      this.bullets[time].push(text);
      this.props.updateBullets();
    }, INTERVAL_DELAY);
  };

  createBulletNode(text: string) {
    const lane = this.getLane();
    if (lane < 0) return null;

    const node = document.createElement("div");
    node.className = "bullet-text";
    node.innerText = text;
    node.style.top = lane + "px";
    node.style.left = -text.length * LETTER_WIDTH + "px";

    // choose a random color for the text
    const choice = Math.floor(Math.random() * this.availColor.length);
    node.style.color = this.availColor[choice];

    if (this.availColor.length === 1) this.resetColor();

    // remove the previously used color
    this.availColor = this.availColor.filter(
      (item) => item !== this.availColor[choice]
    );

    this.lanes[lane] = this.getPreciseTime() + text.length * SEC_PER_LETTER;
    return node;
  }

  textToScreen = (text: string) => {
    const node = this.createBulletNode(text);
    if (!node) return;
    if (this.bulletDiv.current) {
      this.bulletDiv.current.appendChild(node);
      let width = this.bulletDiv.current.clientWidth;
      anime({
        targets: node,
        translateX: 2 * width,
        duration: width * DURATION_FACTOR,
        easing: "linear",
        complete: () => {
          try {
            node.parentElement?.removeChild(node);
          } catch (e) {}
        },
      });
    }
  };

  bulletScreen = () => {
    const time = this.getTimeStamp();
    if (time in this.bullets) {
      this.bullets[time].forEach((text: string) => {
        if (text && text !== "") {
          // have a random time offset for each emoji (dont clutter together)
          setTimeout(() => {
            this.textToScreen(text);
          }, Math.random() * INTERVAL_DELAY);
        }
      });
    }
  };

  render() {
    return (
      <div id="bullet-sec">
        <div className="bullet-screen" ref={this.bulletDiv}></div>
        <div className="bullet-input-container">
          <div className="bullet-input">
            <input
              type="text"
              placeholder="type a danmu to leave your imprint, click enter to send"
              value={this.state.inputValue}
              onChange={this.onChangeInput}
              onKeyUp={(event) => {
                if (event.key === "Enter") {
                  this.addBullet();
                }
              }}
            ></input>
          </div>
        </div>
      </div>
    );
  }
}

export default BulletSection;
