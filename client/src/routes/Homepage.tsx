import { Button, Drawer } from "@material-ui/core";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import { ILibraryMetadata, UserFiles, WidgetTypes } from "../types";
import React, { useCallback, useContext, useEffect, useState } from "react";

import { AdventureLogo } from "../components/AdventureLogo";
import { AppStateContext } from "../contexts/appContext";
import { AudioVisualizer } from "../components/audioVisualizer";
import { FirebaseContext } from "../contexts/firebaseContext";
import { IWidgetProps } from "../components/Widgets/Widget";
import { LibraryButton } from "../components/LibraryButton";
import { NativeTypes } from "react-dnd-html5-backend";
import { PlayerLogo } from "../components/PlayerButton";
import WaveformData from "waveform-data";
// import { WidgetButton } from "../components/WidgetButton";
import update from "immutability-helper";
import { useHistory } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";

enum drawerTypes {
  music = "music",
  widgets = "widgets",
}

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

      audioContext.decodeAudioData(buffer, async (audioBuffer) => {
        const waveformData = await convertBufferToWaveformData(audioBuffer);
        resolve(waveformData);
      });
    };
    reader.readAsArrayBuffer(file);
  });
};

export const Homepage: React.FC = () => {
  const [userFiles, setUserFiles] = useState<UserFiles>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<drawerTypes | null>(null);
  const [widgets, setWidgets] = useState<{ [key: string]: IWidgetProps }>({});
  const [libraryMetadata, setLibraryMetadata] = useState<ILibraryMetadata[]>(
    []
  );
  const [shareSong, setShareSong] = useState<Blob | undefined>();
  const firebaseContext = useContext(FirebaseContext);

  const history = useHistory();

  useEffect(() => {
    if (!libraryMetadata.length) {
      firebaseContext.getLibraryMetadata().then(setLibraryMetadata);
    }
  }, [libraryMetadata.length, firebaseContext]);

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

  const onShareSong = (blob: Blob) => {
    setShareSong(blob);
    if (
      Object.values(widgets).findIndex(
        (widget) => widget.type === WidgetTypes.shareSong
      ) === -1
    ) {
      const newWidgetId = uuidv4();

      const newWidgets: {
        [key: string]: IWidgetProps;
      } = {
        [newWidgetId]: {
          id: newWidgetId,
          type: WidgetTypes.shareSong,
          top: 50,
          left: window.innerWidth / 2 - 200,
        },
      };

      setWidgets(update(widgets, { $merge: newWidgets }));
    }
  };

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
      return libraryMetadata.map(({ name, downloadURL }) => {
        return (
          <div
            key={name}
            onClick={() => onClickLibraryItem(name, downloadURL)}
            className="library-item"
          >
            {name}
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
            onClick={onClickWidgetItem(WidgetTypes.joke)}
          >
            joke
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
    <AppStateContext.Provider
      value={{
        shareSong,
        //   setShareSong: (blob: Blob) => setShareSong(blob)
      }}
    >
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
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <PlayerLogo />

          <Button
            style={{
              minWidth: 20,
              color: "white",
              background: "grey",
              padding: 10,
              height: 50,
            }}
            variant="contained"
            onClick={() => history.push("/player")}
          >
            PLAYER
          </Button>
        </div>

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
          widgets={widgets}
          moveWidget={moveWidget}
          onShareSong={onShareSong}
        />

        <AdventureLogo
        // widget={
        //   <WidgetButton onClick={() => setDrawerType(drawerTypes.widgets)} />
        // }
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
    </AppStateContext.Provider>
  );
};
