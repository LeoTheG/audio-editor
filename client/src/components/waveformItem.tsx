import { ItemTypes, UserFile } from "../types";
import React, { useContext } from "react";

import { AppStateContext } from "../contexts/appContext";
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
    const { waveformLength } = useContext(AppStateContext);

    const [, drag] = useDrag({
      item: { id, left, top, type: ItemTypes.BOX },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    });

    return (
      <div
        ref={drag}
        style={{
          display: "flex",
          flexDirection: "column",
          width: waveformLength,
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
            width={waveformLength}
            height={150}
            style={{ border: "1px solid black" }}
          />
        </>
      </div>
    );
  }
);
