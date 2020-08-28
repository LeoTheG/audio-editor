import { IEmojiSelections } from "../types";
import { IconButton } from "@material-ui/core";
import React from "react";

interface IEmojiPanelProps {
  selectedEmojis: IEmojiSelections;
  onClickEmoji: (emoji: string) => () => void;
  isDisabled?: boolean;
}

export const EmojiPanel = (props: IEmojiPanelProps) => {
  const { selectedEmojis, onClickEmoji, isDisabled } = props;

  return (
    <div className="emoji-panel-container">
      <div style={{ width: "100%", textAlign: "center", background: "white" }}>
        in-game emojis
      </div>
      {Object.entries(selectedEmojis).map(([key, value]) => (
        <div key={key} style={{ textAlign: "center" }}>
          <IconButton disabled={isDisabled} onClick={onClickEmoji(key)}>
            <img
              style={{ width: 30, height: 30 }}
              src={getEmojiImageURL(key)}
              alt="emoji"
            />
          </IconButton>
          {/* <div>{value}</div> */}
        </div>
      ))}
    </div>
  );
};

const baseEmojiUrl =
  "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/";

const getEmojiImageURL = (code: string) => {
  return `${baseEmojiUrl}${code}.png`;
};
