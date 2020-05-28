import React, { useEffect, useState, useCallback, useRef } from "react";
import { UserFiles, ItemTypes, DragItem, DragItemTrack } from "./types";
import { WaveformItem } from "./waveformItem";
import { useDrop, XYCoord, DropTargetMonitor, useDrag } from "react-dnd";
import update from "immutability-helper";

interface IAudioVisualizerProps {
  userFiles: UserFiles;
  style?: React.CSSProperties;
}

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
      <AudioTrackList />
    </div>
  );
};

interface ITrack {
  id: string;
}

const AudioTrackList = () => {
  //   const [tracks, setTracks] = useState<ITrack[]>([]);
  const [tracks, setTracks] = useState<ITrack[]>([
    {
      id: "asdf",
    },
    {
      id: "asdfsss",
    },
    {
      id: "qqqq",
    },
  ]);

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

  return (
    <div
      style={{
        width: "100%",
        height: 170,
        border: "2px dotted black",
        display: "flex",
        flexDirection: "row",
      }}
    >
      {tracks.map((track, i) => (
        <AudioTrack
          id={track.id}
          key={track.id}
          index={i}
          moveTrack={moveTrack}
        />
      ))}
    </div>
  );
};

interface IAudioTrackProps {
  index: number;
  id: string;
  moveTrack: (dragIndex: number, hoverIndex: number) => void;
}

const AudioTrack = (props: IAudioTrackProps) => {
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
        border: "1px solid green",
        padding: 10,
        marginRight: 5,
      }}
    >
      {/* <div ref={ref} style={{ ...style, opacity }}> */}
      {id}
    </div>
  );
};
