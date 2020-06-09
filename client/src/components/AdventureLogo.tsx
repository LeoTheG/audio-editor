import React from "react";
import { Tooltip } from "@material-ui/core";

const adventureText = `version 0.1.0. credits: leo, mike`;

export const AdventureLogo = () => (
  <Tooltip title={adventureText}>
    <div className="adventure-logo">
      adventure
      <br />
      corporation
    </div>
  </Tooltip>
);
