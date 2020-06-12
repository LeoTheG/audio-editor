import { Pause, PlayCircleFilledRounded } from "@material-ui/icons";
import React, { useEffect } from "react";

import { IconButton } from "@material-ui/core";

interface IPlayerButtonProps {
  onClick: () => void;
  style?: React.CSSProperties;
  isPlaying: boolean;
}

export const PlayerButton = (props: IPlayerButtonProps) => (
  <div className="player-button">
    <IconButton onClick={props.onClick}>
      {props.isPlaying ? (
        <Pause
          style={{
            color: "orange",
            width: 50,
            height: 50,
            marginTop: -10,
          }}
        />
      ) : (
        <PlayCircleFilledRounded
          style={{
            color: "orange",
            width: 50,
            height: 50,
            marginTop: -10,
            ...props.style,
          }}
        />
      )}
    </IconButton>
    <div style={{ userSelect: "none" }}>
      {props.isPlaying ? "pause" : "play"}
    </div>
  </div>
);

export const PlayerLogo = () => (
  <div className="player-logo">
    <IconButton disabled={true}>
      <PlayCircleFilledRounded
        style={{ color: "orange", width: 50, height: 50 }}
      />
    </IconButton>
    player
  </div>
);
