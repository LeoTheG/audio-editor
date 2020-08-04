import React from "react";

interface IAppStateContext {
  shareSong?: Blob;
  isIOS: boolean;
  waveformLength: number;
  //   setShareSong: (song: Blob) => void;
}

export const AppStateContext = React.createContext<IAppStateContext>({
  isIOS: false,
  waveformLength: 0,
  //   setShareSong: () => {},
});

// export default UserContext
