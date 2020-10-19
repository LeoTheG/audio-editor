import { Button } from "@material-ui/core";
import React from "react";
import { useHistory } from "react-router-dom";

interface IRouteButtonProps {
  to: RouteButtonTypes;
  onClick?: () => void;
}

export enum RouteButtonTypes {
  home,
  youtube,
  createSong,
  playerNonYoutube,
}

const routeURLMap: { [key in RouteButtonTypes]: string } = {
  [RouteButtonTypes.home]: "/",
  [RouteButtonTypes.youtube]: "/youtube",
  [RouteButtonTypes.createSong]: "/create",
  [RouteButtonTypes.playerNonYoutube]: "/player",
};

const routeTitleMap: { [key in RouteButtonTypes]: string } = {
  [RouteButtonTypes.home]: "HOME",
  [RouteButtonTypes.youtube]: "PLAYER",
  [RouteButtonTypes.createSong]: "CREATE",
  [RouteButtonTypes.playerNonYoutube]: "PLAYER",
};

const buttonStyle = {
  minWidth: 20,
  color: "white",
  background: "grey",
  padding: 10,
};

export const RouteButton = (props: IRouteButtonProps) => {
  const history = useHistory();

  return (
    <Button
      style={buttonStyle}
      variant="contained"
      onClick={() => history.push(routeURLMap[props.to])}
    >
      {routeTitleMap[props.to]}
    </Button>
  );
};
