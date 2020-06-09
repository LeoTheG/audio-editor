import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  UserFiles,
  ItemTypes,
  DragItem,
  DragItemTrack,
  ITrack,
  ACTIONS,
} from "./types";
import { WaveformItem } from "./waveformItem";
import { useDrop, XYCoord, DropTargetMonitor, useDrag } from "react-dnd";
import update from "immutability-helper";
import WaveformData from "waveform-data";
import { Button, Drawer, Modal, TextField } from "@material-ui/core";
import { makeStyles, Theme, createStyles } from "@material-ui/core/styles";
import "./audioVisualizer.css";
import {
  bucketData,
  concatBuffer,
  convertTracksToBlob,
  downloadFromUrl,
} from "./util";
import { AudioTrackList } from "./components/AudioTrackList";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    modal: {
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
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

  const canvasRefs: React.Ref<HTMLCanvasElement>[] = Array.from({
    length: userFilesArr.length,
  }).map((_) => {
    return React.createRef();
  });

  const onClickUpload = () => {};

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
    accept: ItemTypes.BOX,
    drop(item: DragItem, monitor) {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;
      if (!delta) return;
      const left = Math.round(item.left + delta.x);
      const top = Math.round(item.top + delta.y);
      moveBox(item.id, left, top);
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

      case ACTIONS.selectFromLibrary:
        setLibraryOpen(true);
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
        // className={classes.drawer}
        variant="persistent"
        anchor="right"
        open={isLibraryOpen}
        onClose={() => setLibraryOpen(false)}
      >
        <div style={{ width: 400 }}>
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
    </div>
  );
};

interface IShareSongProps {
  songName: string;
  onChangeSongName: (value: string) => void;
  onChangeAuthorName: (value: string) => void;
  authorName: string;
  onClickUpload: () => void;
}
const ShareSong = React.forwardRef(
  (
    {
      songName,
      onChangeSongName,
      authorName,
      onChangeAuthorName,
      onClickUpload,
    }: IShareSongProps,
    ref
  ) => (
    <div className="share-modal-container">
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
    </div>
  )
);
