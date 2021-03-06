import { DragItemTrack, ItemTypes } from "../types";
import { DropTargetMonitor, XYCoord, useDrag, useDrop } from "react-dnd";
import React, { useContext, useRef } from "react";

import { AppStateContext } from "../contexts/appContext";
import { Button } from "@material-ui/core";
import WaveformData from "waveform-data";

interface IAudioTrackProps {
  index: number;
  id: string;
  moveTrack: (dragIndex: number, hoverIndex: number) => void;
  waveformData: WaveformData;
  isHovering: boolean;
  setIsHovering: (isHovering: boolean) => void;
  onClickDelete: () => void;
}

export const AudioTrack = React.forwardRef(
  (props: IAudioTrackProps, canvasRef: React.Ref<HTMLCanvasElement>) => {
    const { index, id, moveTrack } = props;
    const { isIOS } = useContext(AppStateContext);

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
          position: "relative",
          background: props.isHovering ? "lightgrey" : "transparent",
          cursor: "move",
          height: isIOS ? 120 : 150,
        }}
      >
        <canvas
          ref={canvasRef}
          width={props.waveformData.length}
          height={isIOS ? 120 : 150}
          style={{ border: "1px solid black" }}
          onMouseOver={() => props.setIsHovering(true)}
          onMouseLeave={() => props.setIsHovering(false)}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            height: isIOS ? 120 : 150,
          }}
        >
          <Button
            style={{
              minWidth: 20,
              display: props.isHovering ? "block" : "none",
              color: "red",
            }}
            onMouseOver={() => props.setIsHovering(true)}
            variant="contained"
            onClick={props.onClickDelete}
          >
            x
          </Button>
        </div>
      </div>
    );
  }
);
