import { Button, TextField } from "@material-ui/core";

import React from "react";
//@ts-ignore
import anime from "animejs/lib/anime.es";

interface IBulletSectionProps {}

interface IBulletSectionState {
  inputValue: string;
}

class BulletSection extends React.Component<
  IBulletSectionProps,
  IBulletSectionState
> {
  audio: HTMLAudioElement | null = null;
  interval: any = -1; //Timeout object
  id: number = 0;
  bulletDiv: React.RefObject<HTMLDivElement> = React.createRef();

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
  }

  onChangeInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ inputValue: e.target.value });
  };

  componentDidMount() {
    const initializeBulletScreen = () => {
      if (this.bulletDiv.current) {
        const screen = this.bulletDiv.current;
        if (screen.parentElement)
          screen.style.top = -screen.parentElement.offsetTop + 45 + "px";
      }
    };
    initializeBulletScreen();
    window.addEventListener("resize", initializeBulletScreen);
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
      };

      // if paused or ended, stop outputing emojis
      this.audio.onpause = (element: any) => {
        clearBulletInterval();
      };
    }
  }

  // round the current time stamp to nearest 0.2 value
  round(num: number) {
    const result = Math.floor(num * 2) / 2;
    return result.toFixed(1);
  }

  getTimeStamp() {
    if (this.audio) return this.round(this.audio.currentTime);
    return -1;
  }

  createBulletNode(text: string) {
    const node = document.createElement("div");
    node.className = "bullet-text";
    node.innerText = text;
    return node;
  }

  bulletToScreen = () => {
    const text = this.state.inputValue;
    console.log(text);
    if (!text || text === "") return;
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
          return width * 5;
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

  render() {
    return (
      <div id="bullet-sec">
        <div className="bullet-screen" ref={this.bulletDiv}></div>
        <div className="bullet-input-container">
          <TextField
            value={this.state.inputValue}
            onChange={this.onChangeInput}
            placeholder="What do you think?"
          />
          <Button
            style={{ color: "white", backgroundColor: "grey" }}
            variant="contained"
            onClick={this.bulletToScreen}
          >
            submit
          </Button>
        </div>
      </div>
    );
  }
}

export default BulletSection;
