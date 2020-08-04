import { ItemTypes, UserFile } from "../types";

import React from "react";
import { useDrag } from "react-dnd";

interface IWaveFormItemProps {
  userFile: UserFile;
  top: number;
  left: number;
}

export const WaveformItem = React.forwardRef(
  (props: IWaveFormItemProps, ref: React.Ref<HTMLCanvasElement>) => {
    const { userFile, top, left } = props;
    const { file, id } = userFile;

    const [, drag] = useDrag({
      item: { id, left, top, type: ItemTypes.BOX },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    const width = window.innerWidth < 600 ? 100 : 200;

    return (
      <div
        ref={drag}
        style={{
          display: "flex",
          flexDirection: "column",
          width,
          left,
          top,
          position: "absolute",
          cursor: "move",
        }}
      >
        <>
          <div>{file.name}</div>
          <canvas
            ref={ref}
            width={width}
            height={150}
            style={{ border: "1px solid black" }}
          />
        </>
      </div>
    );
  }
);
