import React from "react";

interface IAppStateContext {
  shareSong?: Blob;
  isIOS: boolean;
  waveformLength: number;
}

export const AppStateContext = React.createContext<IAppStateContext>({
  isIOS: false,
  waveformLength: 0,
});
