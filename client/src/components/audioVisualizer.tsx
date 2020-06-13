import "./css/audioVisualizer.css";

import {
  ACTIONS,
  DragItem,
  ITrack,
  ItemTypes,
  UserFiles,
  WidgetTypes,
} from "../types";
import {
  Button,
  CircularProgress,
  Drawer,
  Modal,
  TextField,
} from "@material-ui/core";
import { IWidgetProps, Widget } from "./Widgets/Widget";
import React, { useCallback, useEffect, useState } from "react";
import { Theme, createStyles, makeStyles } from "@material-ui/core/styles";
import { XYCoord, useDrop } from "react-dnd";
import { bucketData, convertTracksToBlob, downloadFromUrl } from "../util";

import { AudioTrackList } from "./AudioTrackList";
import { IconButton } from "@material-ui/core";
import { MusicNoteOutlined } from "@material-ui/icons";
import { WaveformItem } from "./waveformItem";
import update from "immutability-helper";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    modal: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
    },
    popover: {
      pointerEvents: "none",
    },
  })
);

interface IAudioVisualizerProps {
  userFiles: UserFiles;
  style?: React.CSSProperties;
  onAddFile: (file: File) => void;
  onClickLibraryItem: (key: string, url: string) => void;
}

// todo create context with user files

export const AudioVisualizer = (props: IAudioVisualizerProps) => {
  const userFilesArr = Object.values(props.userFiles);
  const [isLibraryOpen, setLibraryOpen] = useState(false);
  const [isShareOpen, setShareOpen] = useState(false);
  const classes = useStyles();
  const [authorName, setAuthorName] = useState("");
  const [songName, setSongName] = useState("");
  const [tracks, setTracks] = useState<ITrack[]>([]);

  const [boxes, setBoxes] = useState<{
    [key: string]: {
      top: number;
      left: number;
    };
  }>({});

  const [widgets, setWidgets] = useState<{ [key: string]: IWidgetProps }>({
    // test: {
    //   top: 0,
    //   left: 0,
    //   id: "test",
    //   type: WidgetTypes.time,
    // },
    // test2: {
    //   top: 0,
    //   left: 0,
    //   id: "test2",
    //   type: WidgetTypes.time,
    // },
  });

  const canvasRefs: React.Ref<HTMLCanvasElement>[] = Array.from({
    length: userFilesArr.length,
  }).map((_) => {
    return React.createRef();
  });

  const onClickUpload = (
    songName: string,
    authorName: string
  ): Promise<string> => {
    return new Promise((resolve) => {
      const blob = convertTracksToBlob(tracks, props.userFiles);
      const formData = new FormData();
      formData.append("audioBlob", blob, "upload.wav");
      formData.append("songName", songName);
      formData.append("authorName", authorName);
      fetch("/upload-song", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((response) => {
          //@ts-ignore
          resolve(response.id);
        })
        .catch(console.error);
    });
  };

  const renderCanvas = useCallback(() => {
    const newBoxes: {
      [key: string]: {
        top: number;
        left: number;
      };
    } = {};
    userFilesArr.forEach((userFile, index) => {
      const { waveformData, id } = userFile;
      if (!boxes[id])
        newBoxes[id] = {
          top: 0,
          left: 0,
        };
      const scaleY = (amplitude: number, height: number) => {
        const range = 256;
        const offset = 128;

        return height - ((amplitude + offset) * height) / range;
      };

      //@ts-ignore
      const canvas = canvasRefs[index].current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.beginPath();

      const channel = waveformData.channel(0);

      // Loop forwards, drawing the upper half of the waveform
      for (let x = 0; x < waveformData.length; x++) {
        const val = channel.max_sample(x);

        ctx.lineTo(x + 0.5, scaleY(val, canvas.height) + 0.5);
      }

      // Loop backwards, drawing the lower half of the waveform
      for (let x = waveformData.length - 1; x >= 0; x--) {
        const val = channel.min_sample(x);

        ctx.lineTo(x + 0.5, scaleY(val, canvas.height) + 0.5);
      }

      ctx.closePath();
      ctx.stroke();
      ctx.fill();
    });
    setBoxes(update(boxes, { $merge: newBoxes }));
  }, [props.userFiles]);

  useEffect(() => {
    if (userFilesArr.length) {
      renderCanvas();
    }
  }, [props.userFiles]);

  const [, drop] = useDrop({
    accept: [ItemTypes.BOX, ItemTypes.WIDGET],
    drop(item: DragItem, monitor) {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;
      if (!delta) return;
      console.log(item);
      const left = Math.round(item.left + delta.x);
      const top = Math.round(item.top + delta.y);

      if (item.type === ItemTypes.BOX) {
        moveBox(item.id, left, top);
      }

      if (item.type === ItemTypes.WIDGET) {
        moveWidget(item.id, left, top);
      }
      return undefined;
    },
  });

  const moveBox = (id: string, left: number, top: number) => {
    setBoxes(
      update(boxes, {
        [id]: {
          $merge: { left, top },
        },
      })
    );
  };

  const moveWidget = (id: string, left: number, top: number) => {
    setWidgets(
      update(widgets, {
        [id]: {
          $merge: { left, top },
        },
      })
    );
  };

  const onClickDownload = (tracks: ITrack[]) => {
    const blob = convertTracksToBlob(tracks, props.userFiles);

    const newAudioUrl = URL.createObjectURL(blob);

    downloadFromUrl(newAudioUrl);
  };

  const onActionClick = (action: ACTIONS) => {
    switch (action) {
      case ACTIONS.selectFromFolder:
        const input = document.createElement("input");
        input.type = "file";

        input.onchange = (e: Event) => {
          if (!e.target) return;
          //@ts-ignore
          const file = e.target.files[0];
          props.onAddFile(file);
        };

        input.click();
        break;
    }
  };

  const onClickLibraryItem = (key: string, url: string) => () => {
    props.onClickLibraryItem(key, url);
  };

  const onClickShare = (tracks: ITrack[]) => {
    setTracks(tracks);
    setShareOpen(true);
  };

  return (
    <div
      ref={drop}
      style={{
        ...props.style,
        position: "relative",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}
      >
        <LibraryButton onClick={() => setLibraryOpen(true)} />
      </div>

      {Object.values(props.userFiles).map((userFile, index) => {
        const box = boxes[userFile.id];
        return (
          <WaveformItem
            key={userFile.id}
            userFile={userFile}
            {...box}
            ref={canvasRefs[index]}
          />
        );
      })}
      <AudioTrackList
        userFiles={props.userFiles}
        onClickDownload={onClickDownload}
        onAddFile={props.onAddFile}
        onActionClick={onActionClick}
        onClickShare={onClickShare}
      />
      <Drawer
        variant="persistent"
        anchor="right"
        open={isLibraryOpen}
        onClose={() => setLibraryOpen(false)}
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
              onClick={() => setLibraryOpen(false)}
            >
              x
            </Button>
          </div>
          {bucketData.map(({ key, url }) => {
            return (
              <div
                key={key}
                onClick={onClickLibraryItem(key, url)}
                className="library-item"
              >
                {key}
              </div>
            );
          })}
        </div>
      </Drawer>
      <Modal
        className={classes.modal}
        open={isShareOpen}
        onClose={() => setShareOpen(false)}
      >
        <ShareSong
          songName={songName}
          authorName={authorName}
          onChangeSongName={(val) => setSongName(val)}
          onChangeAuthorName={(val) => setAuthorName(val)}
          onClickUpload={onClickUpload}
        />
      </Modal>
      {Object.values(widgets).map((widget, index) => {
        return <Widget key={widget.id} {...widget} />;
      })}
    </div>
  );
};

interface IShareSongProps {
  songName: string;
  onChangeSongName: (value: string) => void;
  onChangeAuthorName: (value: string) => void;
  authorName: string;
  onClickUpload: (songName: string, authorName: string) => Promise<string>;
}
const ShareSong = React.forwardRef(
  (
    {
      songName,
      onChangeSongName,
      authorName,
      onChangeAuthorName,
      onClickUpload: onClickUploadProp,
    }: IShareSongProps,
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(false);
    const [uploadId, setUploadId] = useState("");

    const onClickUpload = async () => {
      setIsLoading(true);
      const id = await onClickUploadProp(songName, authorName);
      setUploadId(id);
      setIsLoading(false);
    };

    const songUrl = `${document.location.href}player?id=${uploadId}`;
    let render = null;

    if (isLoading) {
      render = <CircularProgress />;
    } else if (uploadId) {
      render = (
        <>
          <div style={{ fontSize: "1.2em", marginBottom: 10 }}>
            Successful upload!
          </div>
          <div>
            <div>Listen to your song with this shareable link:</div>
            <div style={{ marginTop: 10 }}>
              <a target="_blank" href={songUrl}>
                {songUrl}
              </a>
              {}
            </div>
          </div>
        </>
      );
    } else {
      render = (
        <>
          <div>Share song</div>
          <div className="share-modal-textfield-container">
            <TextField
              value={songName}
              onChange={(evt) => onChangeSongName(evt.target.value)}
              label="Song name"
            />
            <TextField
              value={authorName}
              onChange={(evt) => onChangeAuthorName(evt.target.value)}
              label="Author name"
            />
          </div>
          <Button onClick={onClickUpload} variant="contained">
            Upload
          </Button>
        </>
      );
    }

    return <div className="share-modal-container">{render}</div>;
  }
);

interface ILibraryButtonProps {
  onClick: () => void;
}

const LibraryButton = ({ onClick }: ILibraryButtonProps) => (
  <div
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      marginRight: 10,
    }}
  >
    <IconButton onClick={onClick}>
      <MusicNoteOutlined style={{ height: 40, width: 40 }} />
    </IconButton>
    library
  </div>
);
