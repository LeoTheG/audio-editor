import React from "react";
import "./css/GIFPreview.css";
import { ExpansionPanel } from "@material-ui/core";

export const GIFPreview = () => {
  return (
    <div className="width-100-centered">
      <div className="gif-preview-container">
        <div>preview!</div>
        <div className="add-gif-container">
          <div>add gif</div>
        </div>
      </div>
    </div>
  );
};
