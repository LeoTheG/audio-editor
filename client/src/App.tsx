import "./css/App.css";

import { Button, Drawer } from "@material-ui/core";
import { DragObjectWithType, DropTargetMonitor, useDrop } from "react-dnd";
import React, { useEffect } from "react";
import {
  Redirect,
  Route,
  HashRouter as Router,
  Switch,
} from "react-router-dom";
import { UserFiles, WidgetTypes, libraryMetadata, userSong } from "./types";
import { useCallback, useState } from "react";

import { AdventureLogo } from "./components/AdventureLogo";
import { AudioVisualizer } from "./components/audioVisualizer";
import { DndProvider } from "react-dnd-multi-backend";
import HTML5toTouch from "react-dnd-multi-backend/dist/esm/HTML5toTouch";
import { IWidgetProps } from "./components/Widgets/Widget";
import { LibraryButton } from "./components/LibraryButton";
import { NativeTypes } from "react-dnd-html5-backend";
import { PlayerLogo } from "./components/PlayerButton";
import WaveformData from "waveform-data";
import { WidgetButton } from "./components/WidgetButton";
import backgroundImage from "./assets/Polka-Dots.svg";
// import { bucketData } from "./util";
import firebase from "firebase";
import update from "immutability-helper";
import { v4 as uuidv4 } from "uuid";
import { PlayerPage } from "./components/PlayerPage";

const firebaseConfig = {
  apiKey: "AIzaSyC19cZLLW3oYWjQxWEFPhdtzSOGWQcgQjQ",
  authDomain: "adventure-ea7cd.firebaseapp.com",
  databaseURL: "https://adventure-ea7cd.firebaseio.com",
  projectId: "adventure-ea7cd",
  storageBucket: "adventure-ea7cd.appspot.com",
  messagingSenderId: "753400311148",
  appId: "1:753400311148:web:f8f56db5a153280f185749",
};

firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();

interface firebaseContext {
  uploadSong: (
    song: Blob,
    songName: string,
    authorName: string
  ) => Promise<string>;
  getSongs: () => Promise<userSong[]>;
  getSongURL: (songId: string) => Promise<string>;
}

export const FirebaseContext = React.createContext<firebaseContext>({
  uploadSong: () => Promise.resolve(""),
  getSongs: () => Promise.resolve([]),
  getSongURL: () => Promise.resolve(""),
});

const db = firebase.firestore();

const getLibraryMetadata = (): Promise<libraryMetadata[]> => {
  //   if (process.env.NODE_ENV === "development") {
  //     return Promise.resolve([]);
  //   }
  return new Promise<libraryMetadata[]>((resolve) => {
    storage
      .ref("audio")
      .listAll()
      .then((result) => {
        Promise.all(
          result.items.map(async (item) => {
            const name = item.name;
            const downloadURL = (await item.getDownloadURL()) as string;
            return { name, downloadURL };
          })
        ).then((result) => {
          resolve(result);
        });
      });
  });
};

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

enum drawerTypes {
  music = "music",
  widgets = "widgets",
}

export const AudioEditor: React.FC = () => {
  const [userFiles, setUserFiles] = useState<UserFiles>({});
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<drawerTypes | null>(null);
  const [widgets, setWidgets] = useState<{ [key: string]: IWidgetProps }>({});
  const [libraryMetadata, setLibraryMetadata] = useState<libraryMetadata[]>([]);

  useEffect(() => {
    if (!libraryMetadata.length) {
      getLibraryMetadata().then(setLibraryMetadata);
    }
  }, [libraryMetadata.length]);

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
  //   const [songList, setSongList] = useState<IUserUpload[]>([]);

  // useEffect(() => {
  //   //TODO fetch uploads
  //   fetch("/user-uploads")
  //     // .then(console.log);
  //     .then((res) => res.json())
  //     .then((_res) => {
  //       const res = _res as { uploads: IUserUpload[] };
  //       setSongList(res.uploads);
  //     });
  // }, []);

  const firebaseContext: firebaseContext = {
    getSongURL: (songId) => {
      return storage.ref(`userSongs/${songId}.wav`).getDownloadURL();
    },
    getSongs: () => {
      return new Promise((resolve) => {
        console.log("yes");
        db.collection("userSongs")
          .get()
          .then((result) => {
            resolve(result.docs.map((doc) => doc.data() as userSong));
          });
      });
    },
    uploadSong: (
      blob: Blob,
      songName: string,
      authorName: string
    ): Promise<string> => {
      return new Promise<string>((resolve) => {
        const songId = uuidv4();
        storage
          .ref(`userSongs/${songId}.wav`)
          .put(blob)
          .then(async (snapshot) => {
            console.log(snapshot);
            console.log(snapshot.metadata);
            const songUrl = await firebaseContext.getSongURL(songId);

            db.collection("userSongs")
              .doc(songId)
              .set({
                songName,
                authorName,
                fullPath: snapshot.metadata.fullPath,
                url: songUrl,
                id: songId,
              })
              .then(() => {
                resolve(songId);
              });
          });
      });
    },
  };

  return (
    <div
      className="App"
      style={{
        background: `url(${backgroundImage})`,
      }}
    >
      <FirebaseContext.Provider value={firebaseContext}>
        <Router>
          <Switch>
            <Route exact path={"/"}>
              <DndProvider options={HTML5toTouch}>
                <AudioEditor />
              </DndProvider>
            </Route>
            <Route path={"/player"}>
              <PlayerPage />
            </Route>
            <Redirect from="*" to={"/"} />
          </Switch>
        </Router>
      </FirebaseContext.Provider>
    </div>
  );
}

export default App;
