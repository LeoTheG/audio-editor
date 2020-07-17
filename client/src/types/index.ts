import WaveformData from "waveform-data";

export interface ISongEmojiSelections {
  [songId: string]: IEmojiSelections;
}

export interface IEmojiSelections {
  [emojiId: string]: number;
}

export interface userSong {
  authorName: string;
  songName: string;
  fullPath: string;
  id: string;
  url: string;
  gifUrl?: string;
  gifId?: string;
  emojiSelections?: IEmojiSelections;
}

export interface ILibraryMetadata {
  name: string;
  downloadURL: string;
}

export enum WidgetTypes {
  time = "time",
  joke = "joke",
  shareSong = "share song",
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
