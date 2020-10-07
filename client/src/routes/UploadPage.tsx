import "../css/UploadPage.css";

import { Button, TextField } from "@material-ui/core";
import React, { useContext, useEffect, useState } from "react";

import { AdventureLogo } from "../components/AdventureLogo";
import { FirebaseContext } from "../contexts/firebaseContext";
import { PlayerLogo } from "../components/PlayerButton";
import _ from "underscore";
import { userSong } from "../types";

interface ISubmission {
  url: string;
  songId: string;
}

export const UploadPage = () => {
  const firebaseContext = useContext(FirebaseContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSubmitted, setLatestSubmitted] = useState<ISubmission | null>(
    null
  );
  const [url, setUrl] = useState("");
  const [songId, setSongId] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [randomSongs, setRandomSongs] = useState<userSong[]>([]);

  useEffect(() => {
    firebaseContext.getSongs().then((songs) => {
      const filter = (song: userSong) => song.url.includes("youtube");

      songs = songs.filter(filter);

      setRandomSongs(getRandomSongs(songs));
    });
  }, [firebaseContext]);

  const submitVideo = () => {
    if (!isValidYouTubeURL(url)) {
      setError(new Error("Invalid YouTube URL: " + url));
      return;
    }

    if (!songId) {
      setError(new Error("No song ID submitted"));
      return;
    }

    setIsSubmitting(true);

    const trimmedURL = trimURL(url);

    firebaseContext
      .uploadYoutubeVideo(songId, trimmedURL)
      .then(() => {
        setIsSubmitting(false);
        setLatestSubmitted({ url: trimmedURL, songId });
        setUrl("");
        setSongId("");
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setIsSubmitting(false);
      });
  };

  const previewURL = `${window.location.origin}/#/youtube/${songId}`;

  return (
    <div className="upload-container">
      <div className="width-100 flex">
        <PlayerLogo />
      </div>

      <div className="flex-column align-center">
        <h2 style={{ margin: 0 }}>create</h2>
        <h2 style={{ margin: 0 }}>player page</h2>
      </div>

      {error && <div className="upload-error">{error.message}</div>}
      {latestSubmitted && (
        <div className="upload-latest-submitted">
          success! uploaded
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`${window.location.origin}/#/youtube/${latestSubmitted.songId}`}
          >
            {`${window.location.origin}/#/youtube/${latestSubmitted.songId}`}
          </a>
        </div>
      )}
      <TextField
        placeholder="YouTube URL"
        value={url}
        onChange={(evt) => setUrl(evt.target.value)}
        disabled={isSubmitting}
        style={{ width: 400, maxWidth: "100%" }}
      />
      <TextField
        placeholder="song id"
        value={songId}
        onChange={(evt) => setSongId(evt.target.value)}
        disabled={isSubmitting}
      />
      <Button variant="contained" disabled={isSubmitting} onClick={submitVideo}>
        submit
      </Button>

      <div className="upload-preview-url">
        url:
        <div className="upload-preview-url-string">{previewURL}</div>
      </div>

      <h2>visit</h2>

      <div className="visit-player-page-container">
        {randomSongs.map((song) => (
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`${window.location.origin}/#/youtube/${song.id}`}
          >
            {`${window.location.origin}/#/youtube/${song.id}`}
          </a>
        ))}
      </div>

      <div className="width-100 flex justify-between align-center">
        <AdventureLogo />
        <a
          className="about-us"
          target="_blank"
          rel="noopener noreferrer"
          href="http://adventure.pizza"
        >
          about us
        </a>
      </div>
    </div>
  );
};

const isValidYouTubeURL = (url: string): boolean => {
  //eslint-disable-next-line
  return /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/.test(url);
};

const trimURL = (url: string): string => {
  const indexAmpersand = url.indexOf("&");
  if (indexAmpersand !== -1) {
    url = url.slice(0, indexAmpersand);
  }
  return url.trim();
};

const getRandomSongs = (songs: userSong[]) => {
  if (songs.length <= 5) return songs;

  const indexArr = _.shuffle(Array.from(Array(songs.length).keys())).slice(
    0,
    5
  );

  console.log("index arr is ", indexArr);

  const randomSongArr = indexArr.map((index) => {
    return songs[index];
  });

  console.log("randomSongArr is ", randomSongArr);
  return randomSongArr;
};
