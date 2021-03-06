import "../css/Widget.css";

import { ItemTypes, WidgetTypes } from "../../types";
import React, { useCallback, useEffect, useState } from "react";

import { GIFPreview } from "../GIFPreview";
import { useDrag } from "react-dnd";

export interface IWidgetProps {
  type: WidgetTypes;
  top: number;
  left: number;
  id: string;
}

export const Widget = (props: IWidgetProps) => {
  const { top, left, id, type } = props;

  const [, drag] = useDrag({
    item: { id, left, top, type: ItemTypes.WIDGET },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  return (
    <div
      ref={drag}
      className="widget-container"
      style={{
        left,
        top,
      }}
    >
      {renderWidget(type)}
    </div>
  );
};

const renderWidget = (type: WidgetTypes) => {
  switch (type) {
    case WidgetTypes.time:
      return <WidgetTime />;
    case WidgetTypes.joke:
      return <JokeWidget />;
    case WidgetTypes.shareSong:
      return <GIFPreview />;
    // add widget case here for new widget types
    default:
      return null;
  }
};

//Joke Widget
const JokeWidget = () => {
  const [setup, setSetup] = useState("loading");
  const [punchline, setPunchline] = useState("loading");
  const audio = new Audio(
    "http://static1.grsites.com/archive/sounds/comic/comic002.mp3"
  );
  const newJoke = useCallback(() => {
    fetch("https://official-joke-api.appspot.com/random_joke")
      .then((res) => res.json())
      .then((res2) => {
        setSetup(res2.setup);
        setPunchline(res2.punchline);
      });
    audio.play();
  }, [audio]);

  useEffect(() => {
    newJoke();
  }, [newJoke]);
  return (
    <div className="default">
      <div className="joke-container">
        <h3 className="title">Press The Button To Get A Random Joke!</h3>
        <button className="getJoke" onClick={newJoke}>
          Tell Me Something Funny!
        </button>
      </div>
      <div className="Joke">
        Setup: {setup} <br />
        Punchline: {punchline} <br />
      </div>
    </div>
  );
};

// example widget

const WidgetTime = () => {
  const [time, setTime] = useState("");

  useEffect(() => {
    setInterval(() => {
      const newTime = getFormattedTime();
      setTime(newTime);
    }, 100);
  }, []);

  return (
    <div>
      The time is <div>{time}</div>
    </div>
  );
};

const getFormattedTime = (): string => {
  const newDate = new Date(Date.now());

  return `${newDate.getHours()}:${newDate
    .getMinutes()
    .toString()
    .padStart(2, "0")}:${newDate
    .getSeconds()

    .toString()
    .padStart(2, "0")}:${newDate
    .getMilliseconds()

    .toString()
    .padStart(2, "0")}`;
};
