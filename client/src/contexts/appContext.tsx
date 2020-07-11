import React from "react";

interface IAppStateContext {
  shareSong?: Blob;
  //   setShareSong: (song: Blob) => void;
}

export const AppStateContext = React.createContext<IAppStateContext>({
  //   setShareSong: () => {},
});

// export default UserContext
