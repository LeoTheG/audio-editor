import React from "react";
//@ts-ignore
import anime from "animejs/lib/anime.es";

class BulletSection extends React.Component {
  audio: HTMLAudioElement | null = null;
  interval: any = -1; //Timeout object
  id: number = 0;
  bulletDiv: React.RefObject<HTMLDivElement> = React.createRef();
  bulletInput: React.RefObject<HTMLInputElement> = React.createRef();

  // the value could either be "touchstart" or "mousedown", used to detect both taps and mouse clicks
  tap: "touchstart" | "mousedown" =
    "ontouchstart" in window || navigator.msMaxTouchPoints
      ? "touchstart"
      : "mousedown";

  componentDidMount() {}

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
    if (this.bulletInput.current) {
      const text = this.bulletInput.current.value;
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
      this.bulletInput.current.value = "";
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
            ref={this.bulletInput}
          ></input>
          <button type="submit" onClick={this.bulletToScreen}>
            <i className="fas">{"=>"}</i>
          </button>
        </div>
      </div>
    );
  }
}

export default BulletSection;
