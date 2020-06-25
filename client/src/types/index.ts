import WaveformData from "waveform-data";

export enum WidgetTypes {
  time = "time",
  joke = "joke",
}

export interface UserFile {
  file: File | { name: string };
  waveformData: WaveformData;
  id: string;
  audioBuffer: AudioBuffer;
}

export interface UserFiles {
  [key: string]: UserFile;
}

export const ItemTypes = {
  BOX: "BOX",
  TRACK: "TRACK",
  WIDGET: "WIDGET",
};

export interface DragItem {
  type: string;
  id: string;
  top: number;
  left: number;
}

export interface DragItemTrack {
  index: number;
  id: string;
  type: string;
}

export interface ITrack {
  id: string;
  waveformData: WaveformData;
  referenceId: string;
}

export enum ACTIONS {
  dragAndDropFile = "drag and drop file",
  selectFromFolder = "select from folder",
  //   selectFromLibrary = "select from library",
}

export interface IUserUpload {
  _id: string;
  songName: string;
  authorName: string;
  url: string;
}
