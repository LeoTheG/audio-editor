import React from "react";
import { isiOS } from "../util";

interface IAppStateContext {
  shareSong?: Blob;
  isIOS: boolean;
  //   setShareSong: (song: Blob) => void;
}

export const AppStateContext = React.createContext<IAppStateContext>({
  isIOS: false,
  //   setShareSong: () => {},
});

// export default UserContext
