import { useState, useEffect } from "react";

// use a callback as a parameter
export const useKeyPress = (callback) => {
  // give keyPressed a state and use setKeyPressed to change the state of keyPressed
  const [keyPressed, setKeyPressed] = useState();

  // key update operations
  useEffect(() => {
    const downHandler = ({ key }) => {
      // check if the pressed key is a valid character (not shift, command, etc.)
      if (keyPressed !== key && key.length === 1) {
        setKeyPressed(key);
        callback && callback(key);
      }
    };
    // when the current key is released, set the current key state to null
    const upHandler = () => {
      setKeyPressed(null);
    };

    //Register the handlers with the browser’s window
    window.addEventListener("keydown", downHandler);
    // stop scroll down when spacebar is pressed ////////
    window.addEventListener("keydown", function (e) {
      if (e.keyCode == 32 && e.target == document.body) {
        e.preventDefault();
      }
    });
    /////////////////////////////////////////////////////
    window.addEventListener("keyup", upHandler);

    return () => {
      // deregister the handlers with the browser’s window
      window.removeEventListener("keydown", downHandler);
      window.removeEventListener("keyup", upHandler);
    };
  });

  // Return the keyPressed state to the caller
  return keyPressed;
};
