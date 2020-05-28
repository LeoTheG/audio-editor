import React from "react";
import { useState, useCallback } from "react";
import "./App.css";
import { DndProvider } from "react-dnd";
import Backend from "react-dnd-html5-backend";
import { DropTargetMonitor, DragObjectWithType } from "react-dnd";
import TargetBox from "./fileUpload/TargetBox";
import { AudioVisualizer } from "./audioVisualizer";
import WaveformData from "waveform-data";
import { v4 as uuidv4 } from "uuid";
import { UserFiles } from "./types";

const audioContext = new AudioContext();

const createWaveform = async (file: File): Promise<WaveformData> => {
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
          new Promise<WaveformData>((resolve, reject) => {
            WaveformData.createFromAudio(options, (err, waveform) => {
              if (err) {
                reject(err);
              } else {
                resolve(waveform);
              }
            });
          })
        );
      });
    };
    reader.readAsArrayBuffer(file);
  });
};

export const FileDropper: React.FC = () => {
  const [userFiles, setUserFiles] = useState<UserFiles>({});

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
                waveformData: waveformDataArr[index],
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

  return (
    <>
      <TargetBox onDrop={handleFileDrop} />
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <AudioVisualizer
          style={{
            width: "100%",
            height: 600,
            border: "5px solid black",
            boxSizing: "border-box",
          }}
          userFiles={userFiles}
        />
      </div>
    </>
  );
};
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
