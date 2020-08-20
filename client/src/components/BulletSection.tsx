import React from "react";
//@ts-ignore
import anime from "animejs/lib/anime.es";
import ReactPlayer from "react-player";

interface IBulletSectionProps {
  youtubeRef?: React.RefObject<ReactPlayer>;
  updateBullets: CallableFunction;
}

interface IBulletSectionState {
  inputValue: string;
}

class BulletSection extends React.Component<
  IBulletSectionProps,
  IBulletSectionState
> {
  bullets: any = {};
  audio: HTMLAudioElement | null = null;
  interval: any = -1; //Timeout object
  id: number = 0;
  lanes: Set<number> = new Set();
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
  }

  onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ inputValue: e.target.value });
  };

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
        screen.style.top = -screen.parentElement.offsetTop + 45 + "px";
    }
  };

  componentDidMount() {
    const initializeBulletScreen = () => {
      if (this.bulletDiv.current) {
        const screen = this.bulletDiv.current;
        if (screen.parentElement)
          screen.style.top = -screen.parentElement.offsetTop + 45 + "px";
        const textHeight = 30;
        const options = Math.floor(screen.clientHeight / textHeight);
        for (var i = 0; i < options; i++) this.lanes.add(i * textHeight);
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

  initializeBullets(bullets: any) {
    this.bullets = bullets;
  }

  // helper function
  clearBulletInterval = () => {
    if (this.interval !== -1) {
      clearInterval(this.interval);
      this.interval = -1;
    }
  };

  onPlayCallback = () => {
    this.clearBulletInterval();
    this.interval = setInterval(this.bulletScreen, 500);
  };

  onPauseCallback = () => {
    this.clearBulletInterval();
  };

  // round the current time stamp to nearest 0.2 value
  round(num: number) {
    const result = Math.floor(num * 2) / 2;
    return result.toFixed(1);
  }

  getTimeStamp() {
    if (this.youtubeRef && this.youtubeRef.current)
      return this.round(this.youtubeRef.current.getCurrentTime());
    if (this.audio) return this.round(this.audio.currentTime);
    return -1;
  }

  getRandomLane() {
    const items = Array.from(this.lanes);
    const lane = items[Math.floor(Math.random() * items.length)];
    return lane;
  }

  addBullet = () => {
    const text = this.state.inputValue;
    if (text && text === "") return;

    this.textToScreen(text);

    const time = this.getTimeStamp();
    if (time <= 0) return;

    // add the emoji to the list 0.5 sec later to avoid outputing emoji twice
    setTimeout(() => {
      if (!(time in this.bullets)) this.bullets[time] = [];
      this.bullets[time].push(text);
      this.props.updateBullets();
    }, 500);
  };

  createBulletNode(text: string) {
    const node = document.createElement("div");
    node.className = "bullet-text";
    node.innerText = text;
    const lane = this.getRandomLane();
    node.style.top = lane + "px";
    this.lanes.delete(lane);
    setTimeout(() => {
      this.lanes.add(lane);
    }, text.length * 7);
    return node;
  }

  textToScreen = (text: string) => {
    const node = this.createBulletNode(text);
    if (this.bulletDiv.current) {
      this.bulletDiv.current.appendChild(node);
      let width = this.bulletDiv.current.clientWidth;
      anime({
        targets: node,
        translateX: function () {
          return width + 200;
        },
        duration: function () {
          return width * 6;
        },
        easing: "linear",
        complete: () => {
          try {
            node.parentElement?.removeChild(node);
          } catch (e) {}
        },
      });
    }
    this.setState({ inputValue: "" });
  };

  bulletScreen = () => {
    const time = this.getTimeStamp();
    if (time in this.bullets) {
      this.bullets[time].forEach((text: string) => {
        if (text && text !== "") {
          // have a random time offset for each emoji (dont clutter together)
          setTimeout(() => {
            this.textToScreen(text);
          }, Math.random() * 500);
        }
      });
    }
  };
  render() {
    return (
      <div id="bullet-sec">
        <div className="bullet-screen" ref={this.bulletDiv}></div>
        <div className="bullet-input">
          <input
            type="text"
            placeholder="What do u think?"
            value={this.state.inputValue}
            onChange={this.onChangeInput}
          ></input>
          <button type="submit" onClick={this.addBullet}>
            <i className="fas">{"=>"}</i>
          </button>
        </div>
      </div>

      // <div id="bullet-sec">
      //   <div className="bullet-screen" ref={this.bulletDiv}></div>
      //   <div className="bullet-input">
      //     <TextField
      //       value={this.state.inputValue}
      //       onChange={this.onChangeInput}
      //       placeholder="What do you think?"
      //     />
      //     <Button
      //       style={{ color: "white", backgroundColor: "grey"}}
      //       variant="contained"
      //       onClick={this.bulletToScreen}
      //     >
      //       submit
      //     </Button>
      //   </div>
      // </div>
    );
  }
}

export default BulletSection;
