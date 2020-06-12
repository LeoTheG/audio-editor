import {
  ACTIONS,
  DragItem,
  ITrack,
  ItemTypes,
  UserFiles,
} from "../types/index";
import { CloudDownload, Pause, PlayArrow, Share } from "@material-ui/icons";
import { DropTargetMonitor, XYCoord, useDrag, useDrop } from "react-dnd";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  TRACK_LENGTH_MODIFIDER,
  concatBuffer,
  convertAudioBufferToBlob,
} from "../util";

import { AudioTrack } from "./AudioTrack";
import { IconButton } from "@material-ui/core";
import { PlayerButton } from "./PlayerButton";
import update from "immutability-helper";
import { v4 as uuidv4 } from "uuid";

interface IAudioTrackListProps {
  userFiles: UserFiles;
  onClickDownload: (tracks: ITrack[]) => void;
  onAddFile: (file: File) => void;

  onActionClick: (action: ACTIONS) => void;
  onClickShare: (tracks: ITrack[]) => void;
}

export const AudioTrackList = (props: IAudioTrackListProps) => {
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [isPlayingSong, setPlayingSong] = useState(false);
  const [audio, setAudio] = useState(new Audio());
  const [isHoveringId, setIsHoveringId] = useState<string | null>(null);
  const timeListRef = React.createRef<HTMLDivElement>();

  const [boxes, setBoxes] = useState<{
    [key: string]: {
      top: number;
      left: number;
    };
  }>({});

  const canvasRefs: React.Ref<HTMLCanvasElement>[] = Array.from({
    length: tracks.length,
  }).map((_) => {
    return React.createRef();
  });

  useEffect(() => {
    if (tracks.length) {
      renderCanvas();
    }
  }, [tracks]);

  const renderCanvas = useCallback(() => {
    const newBoxes: {
      [key: string]: {
        top: number;
        left: number;
      };
    } = {};
    tracks.forEach((track, index) => {
      const { waveformData, id } = track;
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
  }, [tracks]);

  const moveTrack = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const dragTicket = tracks[dragIndex];
      setTracks(
        update(tracks, {
          $splice: [
            [dragIndex, 1],
            [hoverIndex, 0, dragTicket],
          ],
        })
      );
    },
    [tracks]
  );

  const onDrop = (item: DragItem, monitor: DropTargetMonitor) => {
    const newTrack = props.userFiles[item.id];
    setTracks(
      tracks.concat({ ...newTrack, id: uuidv4(), referenceId: item.id })
    );
  };

  const [{ canDrop, isOver }, drop] = useDrop({
    accept: ItemTypes.BOX,
    drop(item, monitor) {
      //@ts-ignore
      onDrop(item, monitor);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
      canDrop: monitor.canDrop(),
    }),
  });

  const isActive = canDrop && isOver;
  const isEmptyTracklist = !tracks.length;

  useEffect(() => {
    if (isPlayingSong && tracks.length) {
      const toConcatFiles: AudioBuffer[] = tracks.map(
        (track) => props.userFiles[track.referenceId].audioBuffer
      );

      const blob = convertAudioBufferToBlob(toConcatFiles);

      const newAudioUrl = URL.createObjectURL(blob);

      const newAudio = new Audio(newAudioUrl);
      setAudio(newAudio);
      newAudio.play();

      newAudio.onended = () => {
        setPlayingSong(false);
      };
    } else {
      audio.pause();
    }
  }, [isPlayingSong]);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "0 50px",
        boxSizing: "border-box",
      }}
      className="audio-tracklist-container"
    >
      <ActionLinks onActionClick={props.onActionClick} />

      <div>arrange</div>

      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div
          style={{
            fontSize: "1em",
            textAlign: "center",
            color: "blue",
            visibility: isActive ? "visible" : "hidden",
          }}
        >
          copy track
        </div>
        <div
          style={{
            width: "100%",
            height: 154,
            border: "2px dashed orange",
            display: "flex",
            flexDirection: "row",
            backgroundColor: isActive ? "lightblue" : "inherit",
            boxSizing: "border-box",
            overflowX: "auto",
            overflowY: "hidden",
            position: "relative",
          }}
          ref={drop}
          onScroll={(evt) => {
            // @ts-ignore
            timeListRef.current.scrollLeft = evt.target.scrollLeft;
          }}
        >
          <PlayLine
            pixelsPerSecond={
              tracks.length ? tracks[0].waveformData.pixels_per_second : 0
            }
            audio={audio}
          />

          {isEmptyTracklist && (
            <div
              style={{
                width: "100%",
                justifyContent: "center",
                alignItems: "center",
                display: "flex",
              }}
            >
              edit
            </div>
          )}
          {tracks.map((track, i) => {
            return (
              <AudioTrack
                id={track.id}
                key={track.id}
                index={i}
                moveTrack={moveTrack}
                ref={canvasRefs[i]}
                waveformData={track.waveformData}
                setIsHovering={(isHovering) => {
                  if (isHovering) {
                    setIsHoveringId(track.id);
                  } else setIsHoveringId(null);
                }}
                isHovering={isHoveringId === track.id}
                onClickDelete={() => {
                  const newTracks = [
                    ...tracks.slice(0, i),
                    ...tracks.slice(i + 1),
                  ];
                  setTracks(newTracks);
                }}
              />
            );
          })}
        </div>

        {tracks.length && (
          <div
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              overflowX: "hidden",
            }}
            ref={timeListRef}
          >
            {Array.from({ length: 100 }).map((_, index) => {
              // eventually calculate this, don't set to 100
              return (
                <div
                  key={index}
                  style={{
                    width: 30,
                    marginRight: 40,
                    marginTop: 10,
                    borderLeft: "1px solid black",
                  }}
                >
                  {(
                    tracks[0].waveformData.seconds_per_pixel *
                    70 *
                    TRACK_LENGTH_MODIFIDER *
                    index
                  ).toFixed(1)}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
        }}
      >
        <IconButton
          style={{ width: "fit-content" }}
          onClick={() => props.onClickDownload(tracks)}
        >
          <CloudDownload style={{ width: 50, color: "#36ade3", height: 30 }} />
        </IconButton>

        <div style={{ height: 105 }}>
          <PlayerButton
            isPlaying={isPlayingSong}
            onClick={() => setPlayingSong(!isPlayingSong)}
          />
        </div>

        <IconButton
          style={{ width: "fit-content" }}
          onClick={() => props.onClickShare(tracks)}
        >
          <Share style={{ width: 50, color: "#75d56c", height: 30 }} />
        </IconButton>
      </div>
    </div>
  );
};

interface IActionLinksProps {
  onActionClick: (action: ACTIONS) => void;
}

const ActionLinks = (props: IActionLinksProps) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        width: "fit-content",
        alignItems: "center",
      }}
    >
      {Object.values(ACTIONS).map((action) => (
        <div
          key={action}
          onClick={() => props.onActionClick(action)}
          className="action-link"
        >
          {action}
        </div>
      ))}
    </div>
  );
};

interface IPlayLineProps {
  audio: HTMLAudioElement;
  pixelsPerSecond: number;
}

const PlayLine = (props: IPlayLineProps) => {
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(
        (props.audio.currentTime * props.pixelsPerSecond) /
          TRACK_LENGTH_MODIFIDER
      );
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [props.audio]);

  return (
    <div
      style={{
        width: 5,
        background: "lightgreen",
        height: "100%",
        position: "absolute",
        left: position,
        zIndex: 1,
        opacity: 0.7,
      }}
    />
  );
};
