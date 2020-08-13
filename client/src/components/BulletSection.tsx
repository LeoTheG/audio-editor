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
  interval: any = -1; //Timeout object
  emojiDiv: React.RefObject<HTMLDivElement> = React.createRef();
  emojiCanvas: React.RefObject<HTMLCanvasElement> = React.createRef();

  // the value could either be "touchstart" or "mousedown", used to detect both taps and mouse clicks
  tap: "touchstart" | "mousedown" =
    "ontouchstart" in window || navigator.msMaxTouchPoints
      ? "touchstart"
      : "mousedown";

  componentDidMount() {
    this.initializeCanvas();
    this.initializeListener();
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

  // will be used for future usage, detects clicks on the canvas
  initializeListener() {
    /*
    const updateCoords = (e: any) => {
      if (this.emojiCanvas.current) {
        const rect = this.emojiCanvas.current.getBoundingClientRect();
        const pointerX = (e.clientX || e.touches[0].clientX) - rect.left;
        const pointerY = (e.clientY || e.touches[0].clientY) - rect.top;
      }
    };
    */

    if (this.emojiCanvas.current) {
      this.emojiCanvas.current.addEventListener(
        this.tap,
        function (e) {
          // updateCoords(e);
        },
        false
      );
    }
  }

  // The dimension of canvas matches the parent div element
  initializeCanvas() {
    const initializeDimension = () => {
      if (this.emojiCanvas.current && this.emojiDiv.current) {
        const canvasEl = this.emojiCanvas.current;
        canvasEl.width = this.emojiDiv.current.clientWidth;
        canvasEl.height = this.emojiDiv.current.clientHeight;
        canvasEl.width = canvasEl.offsetWidth;
        canvasEl.height = canvasEl.offsetHeight;
      }
    };

    initializeDimension();
    window.addEventListener("resize", initializeDimension);

    if (this.emojiCanvas.current) {
      const canvasEl = this.emojiCanvas.current;
      // this clears the canvas screen on each update (avoid leaving the trace of animating objects)
      const ctx = canvasEl.getContext("2d");
      anime({
        duration: Infinity,
        update: function () {
          ctx?.clearRect(0, 0, canvasEl.width, canvasEl.height);
        },
      });
    }
  }

  initializeEmojis(liveEmojis: { number: Array<string> }) {
    this.chosenEmoji = liveEmojis;
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
        this.interval = setInterval(this.bulletScreen, 200);
      };

      // if paused or ended, stop outputing emojis
      this.audio.onpause = (element: any) => {
        clearBulletInterval();
      };
    }
  }

  // round the current time stamp to nearest 0.2 value
  round(num: number) {
    return (Math.floor(num * 5) / 5).toFixed(1);
  }

  getTimeStamp() {
    if (this.audio) return this.round(this.audio.currentTime);
    return -1;
  }

  // manually add the emoji to screen
  async addEmoji(emoji: any) {
    const time = this.getTimeStamp();
    if (time < 0) return;
    const node = this.createEmojiNode(emoji);
    if (node !== undefined) {
      this.emojiToScreen(node);
    }

    // add the emoji to the list 0.5 sec later to avoid outputing emoji twice
    setTimeout(() => {
      if (!(time in this.chosenEmoji)) this.chosenEmoji[time] = [];
      this.chosenEmoji[time].push(emoji);
    }, 200);
  }

  createParticule(x: number, y: number) {
    const colors = ["#FF1461", "#18FF92", "#5A87FF", "#FBF38C"];
    if (this.emojiCanvas.current) {
      const ctx = this.emojiCanvas.current.getContext("2d");
      const p = {
        x: x,
        y: y,
        color: colors[anime.random(0, colors.length - 1)],
        radius: anime.random(16, 24),
        endPos: this.setParticuleDirection(x, y),
        draw: function () {
          if (ctx) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
            ctx.fillStyle = p.color;
            ctx.fill();
          }
        },
      };
      return p;
    }
    return undefined;
  }

  createCircle(x: number, y: number) {
    if (this.emojiCanvas.current) {
      const ctx = this.emojiCanvas.current.getContext("2d");
      const p = {
        x: x,
        y: y,
        color: "#FFFFFF",
        radius: 0.1,
        alpha: 0.5,
        lineWidth: 6,
        draw: function () {
          if (ctx) {
            ctx.globalAlpha = p.alpha;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, 2 * Math.PI, true);
            ctx.lineWidth = p.lineWidth;
            ctx.strokeStyle = p.color;
            ctx.stroke();
            ctx.globalAlpha = 1;
          }
        },
      };
      return p;
    }
    return undefined;
  }

  setParticuleDirection(x: number, y: number) {
    var angle = (anime.random(0, 360) * Math.PI) / 180;
    var value = anime.random(25, 90);
    var radius = [-1, 1][anime.random(0, 1)] * value;
    return {
      x: x + radius * Math.cos(angle),
      y: y + radius * Math.sin(angle),
    };
  }

  // create particles for the firework
  renderParticule = (anim: any) => {
    for (var i = 0; i < anim.animatables.length; i++) {
      anim.animatables[i].target.draw();
    }
  };
  // The animation for the firework
  animateParticules = (x: number, y: number) => {
    const circle = this.createCircle(x, y);
    const particules = [];
    for (var i = 0; i < 30; i++) {
      particules.push(this.createParticule(x, y));
    }
    anime
      .timeline()
      .add({
        targets: particules,
        x: function (p: any) {
          return p.endPos.x;
        },
        y: function (p: any) {
          return p.endPos.y;
        },
        radius: 0.1,
        duration: anime.random(1200, 1800),
        easing: "easeOutExpo",
        update: this.renderParticule,
      })
      .add({
        targets: circle,
        radius: anime.random(80, 160),
        lineWidth: 0,
        alpha: {
          value: 0,
          easing: "linear",
          duration: anime.random(600, 800),
        },
        duration: anime.random(1200, 1800),
        easing: "easeOutExpo",
        update: this.renderParticule,
        offset: 0,
      });
  };

  onLiveEmojiClick(node: HTMLDivElement) {
    const y = parseFloat(node.style.top);
    const transInfo = node.style.transform;
    const x = parseFloat(
      transInfo.substring(transInfo.indexOf("(") + 1, transInfo.indexOf("px"))
    );
    this.animateParticules(x, y);

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
    node.className = "live_emoji";
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
      anime({
        targets: node,
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
          try {
            node.parentElement?.removeChild(node);
          } catch (e) {}
        },
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
            }, Math.random() * 200);
          }
        });
      }
    }
  };

  render() {
    return (
      <div id="bullet_sec">
        <div className="instruction"> Click emojis to add to stream </div>
        <div className="instruction"> Click flowing emojis for points </div>
        <div id="emojis" ref={this.emojiDiv}>
          <canvas ref={this.emojiCanvas}></canvas>
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
