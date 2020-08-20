import React from "react";
//@ts-ignore
import anime from "animejs/lib/anime.es";

interface animationContext {
  createParticule: (x: number, y: number, canvas: HTMLCanvasElement) => any;
  setParticuleDirection: (x: number, y: number) => any;
}

export const AnimationContext = React.createContext<animationContext>({
  createParticule: () => {},
  setParticuleDirection: () => {},
});

export function withAnimationContext(Component: JSX.Element) {
  const animationContext: animationContext = {
    createParticule: (x, y, canvas) => {
      const colors = ["#FF1461", "#18FF92", "#5A87FF", "#FBF38C"];
      console.log(canvas);
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const p = {
          x: x,
          y: y,
          color: colors[anime.random(0, colors.length - 1)],
          radius: anime.random(16, 24),
          endPos: animationContext.setParticuleDirection(x, y),
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
    },
    setParticuleDirection: (x, y) => {
      var angle = (anime.random(0, 360) * Math.PI) / 180;
      var value = anime.random(25, 90);
      var radius = [-1, 1][anime.random(0, 1)] * value;
      return {
        x: x + radius * Math.cos(angle),
        y: y + radius * Math.sin(angle),
      };
    },
  };

  return (
    <AnimationContext.Provider value={animationContext}>
      {Component}
    </AnimationContext.Provider>
  );
}
