import React from "react";
import logo from "./logo.svg";
import "./App.css";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import { FileDropper } from "./fileUpload/FileDropper";

function App() {
  return (
    <div className="App">
      <DndProvider backend={Backend}>
        <FileDropper />
      </DndProvider>
    </div>
  );
}

export default App;
