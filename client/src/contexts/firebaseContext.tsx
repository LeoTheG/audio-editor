import { IEmojiSelections, ILibraryMetadata, userSong } from "../types";

import React from "react";
import firebase from "firebase";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: "AIzaSyC19cZLLW3oYWjQxWEFPhdtzSOGWQcgQjQ",
  authDomain: "adventure-ea7cd.firebaseapp.com",
  databaseURL: "https://adventure-ea7cd.firebaseio.com",
  projectId: "adventure-ea7cd",
  storageBucket: "adventure-ea7cd.appspot.com",
  messagingSenderId: "753400311148",
  appId: "1:753400311148:web:f8f56db5a153280f185749",
};

firebase.initializeApp(firebaseConfig);

const storage = firebase.storage();
const db = firebase.firestore();

interface firebaseContext {
  uploadSong: (
    song: Blob,
    songName: string,
    authorName: string,
    gif?: Blob
  ) => Promise<string>;
  getSongs: () => Promise<userSong[]>;
  getSongURL: (songId: string) => Promise<string>;
  getLibraryMetadata: () => Promise<ILibraryMetadata[] | Error>;
  updateEmojis: (songId: string, emojiSelections: IEmojiSelections) => void;
  updateLiveEmojis: (songId: string, data: any) => void;
  updateLiveEmojiPoints: (
    songId: string,
    scores: { name: string; score: number }[]
  ) => void;
}

export const FirebaseContext = React.createContext<firebaseContext>({
  uploadSong: () => Promise.resolve(""),
  getSongs: () => Promise.resolve([]),
  getSongURL: () => Promise.resolve(""),
  getLibraryMetadata: () => Promise.resolve([]),
  updateEmojis: () => {},
  updateLiveEmojis: () => {},
  updateLiveEmojiPoints: () => {},
});

export function withFirebaseContext(Component: JSX.Element) {
  const firebaseContext: firebaseContext = {
    getSongURL: (songId) => {
      return storage.ref(`userSongs/${songId}.wav`).getDownloadURL();
    },
    getSongs: () => {
      //   if (process.env.NODE_ENV === "development") {
      //     return Promise.resolve([]);
      //   }
      return new Promise((resolve) => {
        db.collection("userSongs")
          .get()
          .then((result) => {
            resolve(result.docs.map((doc) => doc.data() as userSong));
          })
          .catch((e) => {
            resolve(e);
          });
      });
    },
    uploadSong: (
      blob: Blob,
      songName: string,
      authorName: string,
      gif?: Blob
    ): Promise<string> => {
      // if (process.env.NODE_ENV === "development") {
      //   return Promise.resolve("abcd-efgh");
      // }
      return new Promise<string>(async (resolve) => {
        const songId = uuidv4();
        let gifId: string;
        let gifUrl: string;

        if (gif) {
          gifId = uuidv4();
          const storageRes = await storage
            .ref(`userGifs/${gifId}.gif`)
            .put(gif);

          gifUrl = await storageRes.ref.getDownloadURL();
        }
        storage
          .ref(`userSongs/${songId}.wav`)
          .put(blob)
          .then(async (snapshot) => {
            const songUrl = await firebaseContext.getSongURL(songId);

            db.collection("userSongs")
              .doc(songId)
              .set({
                songName,
                authorName,
                fullPath: snapshot.metadata.fullPath,
                url: songUrl,
                id: songId,
                gifId,
                gifUrl,
              })
              .then(() => {
                resolve(songId);
              });
          });
      });
    },
    getLibraryMetadata: () => {
      // if (process.env.NODE_ENV === "development") {
      //   return Promise.resolve([
      //     { name: "test1", downloadURL: "" },
      //     { name: "test2", downloadURL: "" },
      //     { name: "test3", downloadURL: "" },
      //   ]);
      // }
      return new Promise<ILibraryMetadata[] | Error>((resolve) => {
        storage
          .ref("audio")
          .listAll()
          .then((result) => {
            try {
              Promise.all(
                result.items.map(async (item) => {
                  const name = item.name;
                  const downloadURL = (await item.getDownloadURL()) as string;
                  return { name, downloadURL };
                })
              ).then((result) => {
                resolve(result);
              });
            } catch (e) {
              resolve(e);
            }
          })
          .catch((e) => {
            resolve(e);
          });
      });
    },
    updateEmojis: (songId: string, emojiSelections: IEmojiSelections) => {
      db.collection("userSongs").doc(songId).set(
        {
          emojiSelections,
        },
        { merge: true }
      );
      //   .then(() => {
      //     resolve(songId);
      //   });
    },
    updateLiveEmojis: (songId: string, data: any) => {
      db.collection("userSongs").doc(songId).set(
        {
          liveEmojis: data,
        },
        { merge: true }
      );
    },
    updateLiveEmojiPoints: (songId, highscores) => {
      db.collection("userSongs").doc(songId).set(
        {
          highscores,
        },
        { merge: true }
      );
    },
  };

  return (
    <FirebaseContext.Provider value={firebaseContext}>
      {Component}
    </FirebaseContext.Provider>
  );
}
