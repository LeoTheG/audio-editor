import React from "react";
import firebase from "firebase";
import { v4 as uuidv4 } from "uuid";
import { ILibraryMetadata, userSong } from "../types";

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
    authorName: string
  ) => Promise<string>;
  getSongs: () => Promise<userSong[]>;
  getSongURL: (songId: string) => Promise<string>;
  getLibraryMetadata: () => Promise<ILibraryMetadata[]>;
}

export const FirebaseContext = React.createContext<firebaseContext>({
  uploadSong: () => Promise.resolve(""),
  getSongs: () => Promise.resolve([]),
  getSongURL: () => Promise.resolve(""),
  getLibraryMetadata: () => Promise.resolve([]),
});

export function withFirebaseContext(Component: JSX.Element) {
  const firebaseContext: firebaseContext = {
    getSongURL: (songId) => {
      return storage.ref(`userSongs/${songId}.wav`).getDownloadURL();
    },
    getSongs: () => {
      return new Promise((resolve) => {
        db.collection("userSongs")
          .get()
          .then((result) => {
            resolve(result.docs.map((doc) => doc.data() as userSong));
          });
      });
    },
    uploadSong: (
      blob: Blob,
      songName: string,
      authorName: string
    ): Promise<string> => {
      // if (process.env.NODE_ENV === "development") {
      //   return Promise.resolve("abcd-efgh");
      // }
      return new Promise<string>((resolve) => {
        const songId = uuidv4();
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
              })
              .then(() => {
                resolve(songId);
              });
          });
      });
    },
    getLibraryMetadata: () => {
      //   if (process.env.NODE_ENV === "development") {
      //     return Promise.resolve([]);
      //   }
      return new Promise<ILibraryMetadata[]>((resolve) => {
        storage
          .ref("audio")
          .listAll()
          .then((result) => {
            Promise.all(
              result.items.map(async (item) => {
                const name = item.name;
                const downloadURL = (await item.getDownloadURL()) as string;
                return { name, downloadURL };
              })
            ).then((result) => {
              resolve(result);
            });
          });
      });
    },
  };

  return (
    <FirebaseContext.Provider value={firebaseContext}>
      {Component}
    </FirebaseContext.Provider>
  );
}
