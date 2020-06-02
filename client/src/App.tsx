import React from "react";
import { useState, useCallback } from "react";
import "./App.css";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import { DropTargetMonitor, DragObjectWithType, useDrop } from "react-dnd";
import { AudioVisualizer } from "./audioVisualizer";
import WaveformData from "waveform-data";
import { v4 as uuidv4 } from "uuid";
import { UserFiles } from "./types";
import { NativeTypes } from "react-dnd-html5-backend";
import { PlayCircleFilledRounded } from "@material-ui/icons";
import { IconButton, Tooltip } from "@material-ui/core";

const audioContext = new AudioContext();
const adventureText = `version 0.0.2. credits: leo, mike`;

const createWaveform = async (
  file: File
): Promise<{ waveform: WaveformData; audioBuffer: AudioBuffer }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const buffer = reader.result as Buffer;

      audioContext.decodeAudioData(buffer).then((audioBuffer) => {
        const options = {
          audio_context: audioContext,
          audio_buffer: audioBuffer,
          scale: 128,
        };

        resolve(
          new Promise<{ waveform: WaveformData; audioBuffer: AudioBuffer }>(
            (resolve, reject) => {
              WaveformData.createFromAudio(options, (err, waveform) => {
                if (err) {
                  reject(err);
                } else {
                  resolve({ waveform, audioBuffer });
                }
              });
            }
          )
        );
      });
    };
    reader.readAsArrayBuffer(file);
  });
};

export const AudioEditor: React.FC = () => {
  const [userFiles, setUserFiles] = useState<UserFiles>({});

  const onAddFile = async (file: File) => {
    const waveForm = await createWaveform(file);
    const newId = uuidv4();
    const newUserFiles = {
      ...userFiles,
      [newId]: {
        file,
        waveformData: waveForm.waveform,
        audioBuffer: waveForm.audioBuffer,
        id: newId,
      },
    };

    setUserFiles(newUserFiles);
  };

  const handleFileDrop = useCallback(
    (item: DragObjectWithType, monitor: DropTargetMonitor) => {
      if (monitor) {
        const files = monitor.getItem().files as { [key: string]: File };

        const newFilesArr = Object.values(files).reduce(
          (acc: File[], file) => acc.concat(file),
          []
        );

        Promise.all(
          newFilesArr.map((file) => {
            return createWaveform(file);
          })
        ).then((waveformDataArr) => {
          const newUserFiles: UserFiles = Object.values(newFilesArr).reduce(
            (acc: UserFiles, file, index) => {
              const newId = uuidv4();
              acc[newId] = {
                file,
                waveformData: waveformDataArr[index].waveform,
                audioBuffer: waveformDataArr[index].audioBuffer,
                id: newId,
              };
              return acc;
            },
            {}
          );

          setUserFiles({ ...userFiles, ...newUserFiles });
        });
      }
    },
    [userFiles]
  );

  const [{ canDrop, isOver }, drop] = useDrop({
    accept: [NativeTypes.FILE],
    drop(item, monitor) {
      handleFileDrop(item, monitor);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = canDrop && isOver;

  return (
    <div
      ref={drop}
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        position: "relative",
        flexDirection: "column",
      }}
    >
      <div className="player-logo">
        <IconButton style={{ width: 50, height: 50 }} disabled={true}>
          <PlayCircleFilledRounded
            style={{ color: "orange", width: 50, height: 50 }}
          />
        </IconButton>
        player
      </div>
      {isActive && (
        <div
          style={{
            width: "100%",
            height: "100%",
            position: "absolute",
            background: "lightblue",
            opacity: 0.7,
          }}
        />
      )}

      <AudioVisualizer
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
        }}
        userFiles={userFiles}
        onAddFile={onAddFile}
      />

      <Tooltip title={adventureText}>
        <div className="adventure-logo">
          adventure
          <br />
          corporation
        </div>
      </Tooltip>
    </div>
  );
};

function App() {
  return (
    <div className="App">
      <DndProvider backend={Backend}>
        <AudioEditor />
      </DndProvider>
    </div>
  );
}

export default App;
