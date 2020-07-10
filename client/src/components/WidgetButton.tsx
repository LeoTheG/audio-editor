import { IconButton } from "@material-ui/core";
import React from "react";
import { Widgets as WidgetsIcon } from "@material-ui/icons";

interface IWidgetButtonProps {
  onClick: () => void;
}

export const WidgetButton = ({ onClick }: IWidgetButtonProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginRight: 10,
    }}
  >
    <IconButton onClick={onClick}>
      <WidgetsIcon style={{ height: 40, width: 40 }} />
    </IconButton>
    widgets
  </div>
);
