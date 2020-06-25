import React from "react";
import { Tooltip } from "@material-ui/core";

const adventureText = `version 0.4.1. production: leo, mike, vaish`;

interface IAdventureLogo {
  widget?: JSX.Element;
}

export const AdventureLogo = ({ widget }: IAdventureLogo) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "flex-start",
    }}
  >
    <Tooltip title={adventureText}>
      <div className="adventure-logo">
        adventure
        <br />
        corporation
      </div>
    </Tooltip>

    {widget}
  </div>
);
