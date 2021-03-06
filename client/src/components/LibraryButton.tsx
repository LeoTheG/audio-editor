import { IconButton } from "@material-ui/core";
import { MusicNoteOutlined } from "@material-ui/icons";
import React from "react";

interface ILibraryButtonProps {
  onClick: () => void;
  text?: string;
}

export const LibraryButton = ({ onClick, text }: ILibraryButtonProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginRight: 10,
    }}
  >
    <IconButton onClick={onClick}>
      <MusicNoteOutlined style={{ height: 40, width: 40 }} />
    </IconButton>
    {text || "library"}
  </div>
);
