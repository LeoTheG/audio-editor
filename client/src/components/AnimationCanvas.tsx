import React from "react";
//@ts-ignore
import anime from "animejs/lib/anime.es";
class AnimationCanvas extends React.Component<
  { resetStreak: EventListenerOrEventListenerObject },
  {}
> {
  emojiCanvas: React.RefObject<HTMLCanvasElement> = React.createRef();
  tap: "touchstart" | "mousedown" =
    "ontouchstart" in window || navigator.msMaxTouchPoints
      ? "touchstart"
      : "mousedown";

  componentDidMount() {
    this.initializeCanvas();
    this.initializeListener();
  }

  initializeListener() {
    if (this.emojiCanvas.current) {
      this.emojiCanvas.current.addEventListener(
        this.tap,
        this.props.resetStreak,
        false
      );
    }
  }

  // The dimension of canvas matches the parent div element
  initializeCanvas() {
    const initializeDimension = () => {
      if (this.emojiCanvas.current) {
        const canvasEl = this.emojiCanvas.current;
        if (canvasEl.parentElement) {
          canvasEl.width = canvasEl.parentElement.clientWidth;
          // canvasEl.width = canvasEl.offsetWidth;
          // canvasEl.height = canvasEl.offsetHeight;
          // canvasEl.style.border = "2px rgb(0, 204, 255) dashed";
        }
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
  animateParticules = (x: number, y: number, points: number) => {
    const particules = [];
    const particuleCount = points >= 10 ? 50 : 30;
    for (var i = 0; i < particuleCount; i++) {
      particules.push(this.createParticule(x, y));
    }
    anime.timeline().add({
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
    });
  };

  render() {
    return (
      <canvas
        height="270px"
        style={{ position: "absolute" }}
        ref={this.emojiCanvas}
      ></canvas>
    );
  }
}

export default AnimationCanvas;
