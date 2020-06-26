import "./css/App.css";

import { Button, Drawer } from "@material-ui/core";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import { IUserUpload, UserFiles, WidgetTypes } from "./types";
import { IWidgetProps, Widget } from "./components/Widgets/Widget";
import React, { useEffect } from "react";
import {
  Redirect,
  Route,
  BrowserRouter as Router,
  Switch,
} from "react-router-dom";
import { bucketData, convertTracksToBlob, downloadFromUrl } from "./util";
import { useCallback, useState } from "react";

import { AdventureLogo } from "./components/AdventureLogo";
import { AudioVisualizer } from "./components/audioVisualizer";
import { DndProvider } from "react-dnd-multi-backend";
import HTML5toTouch from "react-dnd-multi-backend/dist/esm/HTML5toTouch";
import { LibraryButton } from "./components/LibraryButton";
import { NativeTypes } from "react-dnd-html5-backend";
import { PlayerLogo } from "./components/PlayerButton";
import { PlayerPage } from "./components/PlayerPage";
import WaveformData from "waveform-data";
import { WidgetButton } from "./components/WidgetButton";
import update from "immutability-helper";
import { v4 as uuidv4 } from "uuid";

// @ts-ignore
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

const convertBufferToWaveformData = (audioBuffer: AudioBuffer) => {
  const options = {
    audio_context: audioContext,
    audio_buffer: audioBuffer,
    scale: 128,
  };

  return new Promise<{ waveform: WaveformData; audioBuffer: AudioBuffer }>(
    (resolve, reject) => {
      WaveformData.createFromAudio(options, (err, waveform) => {
        if (err) {
          reject(err);
        } else {
          resolve({ waveform, audioBuffer });
        }
      });
    }
  );
};

const createWaveform = async (
  file: File
): Promise<{ waveform: WaveformData; audioBuffer: AudioBuffer }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const buffer = reader.result as Buffer;

      audioContext.decodeAudioData(buffer).then(async (audioBuffer) => {
        const waveformData = await convertBufferToWaveformData(audioBuffer);
        resolve(waveformData);
      });
    };
    reader.readAsArrayBuffer(file);
  });
};

enum drawerTypes {
  music = "music",
  widgets = "widgets",
}

export const AudioEditor: React.FC = () => {
  const [userFiles, setUserFiles] = useState<UserFiles>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<drawerTypes | null>(null);
  const [widgets, setWidgets] = useState<{ [key: string]: IWidgetProps }>({});

  useEffect(() => {
    setIsDrawerOpen(!!drawerType);
  }, [drawerType]);

  const moveWidget = (id: string, left: number, top: number) => {
    setWidgets(
      update(widgets, {
        [id]: {
          $merge: { left, top },
        },
      })
    );
  };

  //   const onClickLibraryItem = (key: string, url: string) => () => {
  //     props.onClickLibraryItem(key, url);
  //   };

  const onClickWidgetItem = (type: WidgetTypes) => () => {
    const newWidgetId = uuidv4();

    const newWidgets: {
      [key: string]: IWidgetProps;
    } = {
      [newWidgetId]: {
        id: newWidgetId,
        type,
        top: 0,
        left: 0,
      },
    };

    setWidgets(update(widgets, { $merge: newWidgets }));
  };

  const renderDrawerContent = () => {
    if (drawerType === drawerTypes.music)
      return bucketData.map(({ key, url }) => {
        return (
          <div
            key={key}
            onClick={() => onClickLibraryItem(key, url)}
            className="library-item"
          >
            {key}
          </div>
        );
      });
    else if (drawerType === drawerTypes.widgets) {
      return (
        <div>
        <div
          className="library-item"
          onClick={onClickWidgetItem(WidgetTypes.time)}
        >
          time
        </div>
        <div
        className="library-item"
        onClick={onClickWidgetItem(WidgetTypes.balances)}
      >
        balances
      </div>
      <div
        className="library-item"
        onClick={onClickWidgetItem(WidgetTypes.bearfaucet)}
      >
        bear_faucet
      </div>
      <div
        className="library-item"
        onClick={onClickWidgetItem(WidgetTypes.audioplayer)}
      >
        audio_player
      </div>
      </div>

      );
    }
  };

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

  const onClickLibraryItem = (key: string, url: string) => {
    const request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";
    request.onload = function () {
      var audioData = request.response;
      audioContext.decodeAudioData(
        audioData,
        async (buffer) => {
          const waveForm = await convertBufferToWaveformData(buffer);
          const newId = uuidv4();
          const newUserFiles = {
            ...userFiles,
            [newId]: {
              file: { name: key },
              waveformData: waveForm.waveform,
              audioBuffer: waveForm.audioBuffer,
              id: newId,
            },
          };

          setUserFiles(newUserFiles);
        },
        console.error
      );
    };
    request.send();
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
        minHeight: "100vh",
        position: "relative",
        flexDirection: "column",
      }}
    >
      <PlayerLogo />

      <div
        style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}
      >
        <LibraryButton onClick={() => setDrawerType(drawerTypes.music)} />
      </div>

      <AudioVisualizer
        style={{
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          flex: 1,
        }}
        userFiles={userFiles}
        onAddFile={onAddFile}
        // onClickLibraryItem={onClickLibraryItem}
        widgets={widgets}
        moveWidget={moveWidget}
      />

      <AdventureLogo
        widget={
          <WidgetButton onClick={() => setDrawerType(drawerTypes.widgets)} />
        }
      />

      <Drawer
        variant="persistent"
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setDrawerType(null)}
      >
        <div style={{ width: 400, padding: 10 }}>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <Button
              style={{
                minWidth: 20,
                color: "red",
              }}
              variant="contained"
              onClick={() => setDrawerType(null)}
            >
              x
            </Button>
          </div>
          {renderDrawerContent()}
        </div>
      </Drawer>

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
    </div>
  );
};
function App() {
  const [songList, setSongList] = useState<IUserUpload[]>([]);
  useEffect(() => {
    fetch("/user-uploads")
      // .then(console.log);
      .then((res) => res.json())
      .then((_res) => {
        const res = _res as { uploads: IUserUpload[] };
        setSongList(res.uploads);
      });
  }, []);
  return (
    <div className="App">
      <Router>
        <Switch>
          <Route path="/player">
            <PlayerPage uploadList={songList} />
          </Route>
          <Route exact path="/">
            <DndProvider options={HTML5toTouch}>
              <AudioEditor />
            </DndProvider>
          </Route>
          <Redirect from="*" to="/" />
        </Switch>
      </Router>
    </div>
  );
}

export default App;
