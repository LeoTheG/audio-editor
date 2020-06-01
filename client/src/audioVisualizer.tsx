import React, { useEffect, useState, useCallback, useRef } from "react";
import { UserFiles, ItemTypes, DragItem, DragItemTrack } from "./types";
import { WaveformItem } from "./waveformItem";
import { useDrop, XYCoord, DropTargetMonitor, useDrag } from "react-dnd";
import update from "immutability-helper";
import WaveformData from "waveform-data";
import { v4 as uuidv4 } from "uuid";
import { IconButton } from "@material-ui/core";
import { GetApp, PlayArrow, Pause } from "@material-ui/icons";
import audioBufferToWav from "./audioBufferToWav";

interface IAudioVisualizerProps {
  userFiles: UserFiles;
  style?: React.CSSProperties;
}

// todo create context with user files

export const AudioVisualizer = (props: IAudioVisualizerProps) => {
  const userFilesArr = Object.values(props.userFiles);

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
    const toConcatFiles: AudioBuffer[] = tracks.map(
      (track) => props.userFiles[track.referenceId].audioBuffer
    );
    const concat = concatBuffer(toConcatFiles);
    const buff = concat.getChannelData(1);

    const blob = new Blob([audioBufferToWav(concat)], {
      type: "audio/wav",
    });

    const newAudioUrl = URL.createObjectURL(blob);

    downloadFromUrl(newAudioUrl);
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
      <div style={{ flex: 1 }} />
      {/* <audio src={audioUrl} play /> */}
      <AudioTrackList
        userFiles={props.userFiles}
        onClickDownload={onClickDownload}
      />
    </div>
  );
};

interface ITrack {
  id: string;
  waveformData: WaveformData;
  referenceId: string;
}
interface IAudioTrackListProps {
  userFiles: UserFiles;
  onClickDownload: (tracks: ITrack[]) => void;
}

const AudioTrackList = (props: IAudioTrackListProps) => {
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [isPlayingSong, setPlayingSong] = useState(false)
  const [audio, setAudio] = useState(new Audio())

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
  const isEmptyTracklist = !tracks.length

  useEffect(()=> {
    if(isPlayingSong){

    const toConcatFiles: AudioBuffer[] = tracks.map(
      (track) => props.userFiles[track.referenceId].audioBuffer
    );
    const concat = concatBuffer(toConcatFiles);

    const blob = new Blob([audioBufferToWav(concat)], {
      type: "audio/wav",
    });

    const newAudioUrl = URL.createObjectURL(blob);

    const newAudio = new Audio(newAudioUrl)
    setAudio(newAudio)
    newAudio.play()
    }
    else {
      audio.pause()
    }
  }, [isPlayingSong])

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          visibility: isEmptyTracklist ? 'hidden' : 'visible'
        }}
      >
        <div>

        <IconButton
          style={{ width: "fit-content" }}
          onClick={() => props.onClickDownload(tracks)}
        >
          <GetApp style={{ width: 30 }} />
        </IconButton>
        Download Song
        </div>

        <IconButton
          style={{ width: "fit-content" }}
          onClick={() => setPlayingSong(!isPlayingSong)}
        >
          {
            isPlayingSong ? <Pause style={{width: 30}} /> : <PlayArrow style={{width: 30}} />
          }
        </IconButton>

      </div>


    
      {isActive && (
        <div
          style={{
            fontSize: "1em",
            textAlign: "center",
            color: "blue",
          }}
        >
          copy track
        </div>
      )}
      <div
        style={{
          width: "100%",
          height: 150,
          border: "2px dotted black",
          display: "flex",
          flexDirection: "row",
          backgroundColor: isActive ? "lightblue" : "inherit",
        }}
        ref={drop}
      >
        {tracks.map((track, i) => (
          <AudioTrack
            id={track.id}
            key={track.id}
            index={i}
            moveTrack={moveTrack}
            ref={canvasRefs[i]}
          />
        ))}
      </div>
    </div>
  );
};

interface IAudioTrackProps {
  index: number;
  id: string;
  moveTrack: (dragIndex: number, hoverIndex: number) => void;
}

const AudioTrack = React.forwardRef(
  (props: IAudioTrackProps, canvasRef: React.Ref<HTMLCanvasElement>) => {
    const { index, id, moveTrack } = props;

    const ref = useRef<HTMLDivElement>(null);
    const [, drop] = useDrop({
      accept: ItemTypes.TRACK,
      hover(item: DragItemTrack, monitor: DropTargetMonitor) {
        if (!ref.current) {
          return;
        }
        const dragIndex = item.index;
        const hoverIndex = index;

        // Don't replace items with themselves
        if (dragIndex === hoverIndex) {
          return;
        }

        // Determine rectangle on screen
        const hoverBoundingRect = ref.current?.getBoundingClientRect();

        // Get horizontal middle
        const hoverMiddleX =
          (hoverBoundingRect.left - hoverBoundingRect.right) / 2;

        // Determine mouse position
        const clientOffset = monitor.getClientOffset();

        // Get pixels to the right
        const hoverClientX =
          (clientOffset as XYCoord).x - hoverBoundingRect.right;

        // Only perform the move when the mouse has crossed half of the items width

        // Dragging left
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) {
          return;
        }

        // Dragging right
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) {
          return;
        }

        // Time to actually perform the action
        moveTrack(dragIndex, hoverIndex);

        // Note: we're mutating the monitor item here!
        // Generally it's better to avoid mutations,
        // but it's good here for the sake of performance
        // to avoid expensive index searches.
        item.index = hoverIndex;
      },
    });

    const [{ isDragging }, drag] = useDrag({
      item: { type: ItemTypes.TRACK, id, index },
      collect: (monitor: any) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const opacity = isDragging ? 0 : 1;
    drag(drop(ref));
    return (
      <div
        ref={ref}
        style={{
          opacity,
          //   margin: 5,
        }}
      >
        <canvas
          ref={canvasRef}
          width={200}
          height={150}
          style={{ border: "1px solid black" }}
        />
      </div>
    );
  }
);

const audioContext = new AudioContext();

function concatBuffer(_buffers: AudioBuffer[]) {
  // _buffers[] is an array containig our audiobuffer list

  var buflengh = _buffers.length;
  var channels = [];
  var totalDuration = 0;

  for (var a = 0; a < buflengh; a++) {
    channels.push(_buffers[a].numberOfChannels); // Store all number of channels to choose the lowest one after
    totalDuration += _buffers[a].duration; // Get the total duration of the new buffer when every buffer will be added/concatenated
  }

  var numberOfChannels = channels.reduce(function (a, b) {
    return Math.min(a, b);
  }); // The lowest value contained in the array channels
  var tmp = audioContext.createBuffer(
    numberOfChannels,
    audioContext.sampleRate * totalDuration,
    audioContext.sampleRate
  ); // Create new buffer

  for (var b = 0; b < numberOfChannels; b++) {
    var channel = tmp.getChannelData(b);
    var dataIndex = 0;

    for (var c = 0; c < buflengh; c++) {
      channel.set(_buffers[c].getChannelData(b), dataIndex);
      dataIndex += _buffers[c].length; // Next position where we should store the next buffer values
    }
  }
  return tmp;
}

function downloadFromUrl(url: string) {
  // Construct the <a> element
  var link = document.createElement("a");
  link.download = "adventure-audio.wav";
  // Construct the uri
  //   var uri = 'data:text/csv;charset=utf-8;base64,' + someb64data
  link.href = url;
  document.body.appendChild(link);
  link.click();
  // Cleanup the DOM
  document.body.removeChild(link);
}
