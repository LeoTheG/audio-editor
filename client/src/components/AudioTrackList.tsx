import {
  ACTIONS,
  DragItem,
  ITrack,
  ItemTypes,
  UserFiles,
} from "../types/index";
import { Add, CloudDownload, Info, Remove, Share } from "@material-ui/icons";
import { DropTargetMonitor, useDrop } from "react-dnd";
import { IconButton, Popover, Tooltip } from "@material-ui/core";
import React, { useCallback, useContext, useEffect, useState } from "react";
import { Theme, createStyles, makeStyles } from "@material-ui/core/styles";
import { convertAudioBufferToBlob, convertBufferToWaveformData } from "../util";

import { AppStateContext } from "../contexts/appContext";
import { AudioTrack } from "./AudioTrack";
import { PlayerButton } from "./PlayerButton";
import infoGif from "../assets/audio-editor-info.gif";
import update from "immutability-helper";
import { v4 as uuidv4 } from "uuid";

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    popover: {
      pointerEvents: "none",
    },
  })
);

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
  const [scale, setScale] = useState(512);
  const { isIOS } = useContext(AppStateContext);
  const classes = useStyles();

  const [infoAnchorEl, setInfoAnchorEl] = React.useState<HTMLElement | null>(
    null
  );

  const handlePopoverOpen = (
    event: React.MouseEvent<HTMLElement, MouseEvent>
  ) => {
    //@ts-ignore
    setInfoAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setInfoAnchorEl(null);
  };

  const open = Boolean(infoAnchorEl);

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
  }, [tracks, boxes, canvasRefs]);

  useEffect(() => {
    if (tracks.length) {
      renderCanvas();
    }
  }, [tracks, renderCanvas]);

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

  const onDrop = async (item: DragItem, monitor: DropTargetMonitor) => {
    const newTrack = props.userFiles[item.id];
    let waveformData = newTrack.waveformData;
    waveformData = (
      await convertBufferToWaveformData(newTrack.audioBuffer, scale)
    ).waveform;
    setTracks(
      tracks.concat({
        ...newTrack,
        id: uuidv4(),
        referenceId: item.id,
        waveformData,
      })
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

  const changeSongScale = useCallback(
    (scale: number) => {
      Promise.all(
        tracks.map((track) => {
          const userFile = props.userFiles[track.referenceId];
          const waveformData = convertBufferToWaveformData(
            userFile.audioBuffer,
            scale
          );
          return waveformData;
        })
      ).then((waveformDataArr) => {
        const newTracks: ITrack[] = [];
        waveformDataArr.forEach((data, index) => {
          if (!data) return;
          const track = tracks[index];
          newTracks.push({ ...track, waveformData: data?.waveform });
        });
        setTracks(newTracks);
      });
    },
    [tracks, props.userFiles]
  );

  const isActive = canDrop && isOver;
  const isEmptyTracklist = !tracks.length;

  return (
    <div className="audio-tracklist-container">
      <ActionLinks onActionClick={props.onActionClick} />

      <div>arrange</div>

      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
        <div>
          <Tooltip title="zoom in">
            <IconButton
              onClick={() => {
                const newScale = scale / 2;
                setScale(newScale);
                changeSongScale(newScale);
              }}
            >
              <Add />
            </IconButton>
          </Tooltip>
          <Tooltip title="zoom out">
            <IconButton
              onClick={() => {
                const newScale = scale * 2;
                setScale(newScale);
                changeSongScale(newScale);
              }}
            >
              <Remove />
            </IconButton>
          </Tooltip>
        </div>
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
          style={{ backgroundColor: isActive ? "lightblue" : "inherit" }}
          className="tracklist-container"
          ref={drop}
          onScroll={(evt) => {
            if (timeListRef.current)
              // @ts-ignore
              timeListRef.current.scrollLeft = evt.target.scrollLeft;
          }}
        >
          <PlayLine
            pixelsPerSecond={
              tracks.length ? tracks[0].waveformData.pixels_per_second : 0
            }
            audio={audio}
            height={isIOS ? 120 : "100%"}
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
              <div
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
              >
                <Info style={{ width: 20, marginBottom: 5 }} />
              </div>
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
              // todo eventually calculate this, don't set to 100
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
        <Tooltip title="Download">
          <IconButton
            style={{ width: "fit-content" }}
            onClick={() => props.onClickDownload(tracks)}
          >
            <CloudDownload
              style={{ width: 50, color: "#36ade3", height: 30 }}
            />
          </IconButton>
        </Tooltip>

        <div style={{ height: 105 }}>
          <PlayerButton
            isPlaying={isPlayingSong}
            onClick={() => {
              if (isPlayingSong) {
                audio.pause();
                setPlayingSong(false);
              } else if (tracks.length) {
                const toConcatFiles: AudioBuffer[] = tracks.map(
                  (track) => props.userFiles[track.referenceId].audioBuffer
                );

                const blob = convertAudioBufferToBlob(toConcatFiles);

                const newAudioUrl = URL.createObjectURL(blob);

                const newAudio = new Audio(newAudioUrl);
                setAudio(newAudio);
                newAudio.play();
                setPlayingSong(true);

                newAudio.onended = () => {
                  setPlayingSong(false);
                };
              }
            }}
          />
        </div>

        <Tooltip title="Share">
          <IconButton
            style={{ width: "fit-content" }}
            onClick={() => props.onClickShare(tracks)}
          >
            <Share style={{ width: 50, color: "#75d56c", height: 30 }} />
          </IconButton>
        </Tooltip>
      </div>
      <Popover
        id="mouse-over-popover"
        className={classes.popover}
        open={open}
        anchorEl={infoAnchorEl}
        onClose={handlePopoverClose}
        disableRestoreFocus
      >
        <img
          alt="visual instructions"
          style={{ width: "100%" }}
          src={infoGif}
        />
      </Popover>
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
  height: string | number;
}

const PlayLine = (props: IPlayLineProps) => {
  const [position, setPosition] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setPosition(
        props.audio.currentTime * props.pixelsPerSecond // / waveformModifier
      );
    }, 50);

    return () => {
      clearInterval(interval);
    };
  }, [props.audio, props.pixelsPerSecond]);

  return (
    <div
      style={{
        width: 5,
        background: "lightgreen",
        height: props.height,
        position: "absolute",
        left: position,
        zIndex: 1,
        opacity: 0.7,
      }}
    />
  );
};
