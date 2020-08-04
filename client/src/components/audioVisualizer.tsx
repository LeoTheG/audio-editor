import "./css/audioVisualizer.css";

import { ACTIONS, DragItem, ITrack, ItemTypes, UserFiles } from "../types";
import { IWidgetProps, Widget } from "./Widgets/Widget";
import React, { useCallback, useEffect, useState } from "react";
import { XYCoord, useDrop } from "react-dnd";
import { convertTracksToBlob, downloadFromUrl } from "../util";

import { AudioTrackList } from "./AudioTrackList";
import { WaveformItem } from "./waveformItem";
import update from "immutability-helper";

interface IAudioVisualizerProps {
  userFiles: UserFiles;
  style?: React.CSSProperties;
  onAddFile: (file: File) => void;
  widgets: { [key: string]: IWidgetProps };
  moveWidget: (id: string, left: number, top: number) => void;
  onShareSong: (song: Blob) => void;
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
  }, [boxes, canvasRefs, userFilesArr]);

  useEffect(() => {
    if (userFilesArr.length) {
      renderCanvas();
    }
  }, [props.userFiles, renderCanvas, userFilesArr.length]);

  const [, drop] = useDrop({
    accept: [ItemTypes.BOX, ItemTypes.WIDGET],
    drop(item: DragItem, monitor) {
      const delta = monitor.getDifferenceFromInitialOffset() as XYCoord;
      if (!delta) return;
      const left = Math.round(item.left + delta.x);
      const top = Math.round(item.top + delta.y);

      if (item.type === ItemTypes.BOX) {
        moveBox(item.id, left, top);
      }

      if (item.type === ItemTypes.WIDGET) {
        props.moveWidget(item.id, left, top);
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

  const onClickShare = (tracks: ITrack[]) => {
    if (!tracks.length) {
      return;
    }
    const blob = convertTracksToBlob(tracks, props.userFiles);
    props.onShareSong(blob);
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

      {Object.values(props.widgets).map((widget, index) => {
        return <Widget key={widget.id} {...widget} />;
      })}
    </div>
  );
};
