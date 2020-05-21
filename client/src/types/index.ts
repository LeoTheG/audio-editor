import WaveformData from "waveform-data";

export interface UserFile {
  file: File;
  waveformData: WaveformData;
  id: string;
}

export interface UserFiles {
  [key: string]: UserFile;
}

export const ItemTypes = {
  BOX: "box",
};

export interface DragItem {
  type: string;
  id: string;
  top: number;
  left: number;
}
