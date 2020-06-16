import "../css/Widget.css";

import { ItemTypes, WidgetTypes } from "../../types";
import React, { useEffect, useState } from "react";

import { useDrag } from "react-dnd";
import $ from 'jquery';

export interface IWidgetProps {
  type: WidgetTypes;
  top: number;
  left: number;
  id: string;
}

export const Widget = (props: IWidgetProps) => {
  const { top, left, id, type } = props;

  const [{ isDragging }, drag] = useDrag({
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
      return <JokeWidget />
    // add widget case here for new widget types
    default:
      return null;
  }
};

//Joke Widget
const JokeWidget = () => {
  const [joke] = useState("");

  return(
    <div>
    <link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Shadows+Into+Light&family=Passion+One&display=swap" rel="stylesheet"></link>
    <div>
      <h3 className="title">Press The Button To Get A Random Joke!</h3>
          <button className="getJoke" onClick={laugh}>Tell Me Something Funny!</button>
    </div>
    <div className="Joke"></div>
    <div className="Punch"></div>
    </div>
  );
};
function getJoke(){
  var url = 'https://official-joke-api.appspot.com/random_joke';
	$.getJSON(url, function(data: { setup: any; punchline: any; }) {
        
    var setup = `Setup: ${data.setup}<br>`
		var punchline = `Punchline: ${data.punchline}<br>`
		$(".Joke").html(setup);
    $(".Punch").html(punchline);
    
	});
}
function playIt()
{
  $(document).ready(function() { 
    var obj = document.createElement("audio"); 
    obj.setAttribute("src", "http://static1.grsites.com/archive/sounds/comic/comic002.mp3"); 
    $.get(); 

    $(".getJoke").click(function() { 
        obj.play(); 
    }); 
}); 
}
function laugh(){
  playIt();
  getJoke();
}
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
