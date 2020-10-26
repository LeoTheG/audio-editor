import "../css/UploadPage.css";

import {
  Button,
  TextField,
  Checkbox,
  FormControlLabel,
  Tooltip,
} from "@material-ui/core";
import React, { useContext, useEffect, useRef, useState } from "react";

import { AdventureLogo } from "../components/AdventureLogo";
import { FirebaseContext } from "../contexts/firebaseContext";
import { PlayerLogo } from "../components/PlayerButton";
import _ from "underscore";
import bananaDance from "../assets/bananadance.gif";
import { userSong } from "../types";
import ReactPlayer from "react-player";
import { ILiveEmojis } from "../types";

interface ISubmission {
  url: string;
  songId: string;
  songName: string;
  generatedEmojis: ILiveEmojis;
}
const RANDOM_EMOJIS = [
  "1f941",
  "1f48e",
  "1f3c6",
  "1f602",
  "1f3b6",
  "1f48e",
  "1f3b9",
  "1f4f1",
  "1f63b",
  "1f499",
  "1f30d",
  "1f9e1",
  "1f525",
  "1f381",
  "1f49c",
];
const RANDOM_EMOJI_STREAM_OFFSET = 3;

export const UploadPage = () => {
  const firebaseContext = useContext(FirebaseContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSubmitted, setLatestSubmitted] = useState<ISubmission | null>(
    null
  );
  const [url, setUrl] = useState("");
  const [songId, setSongId] = useState("");
  const [songName, setSongName] = useState("");
  const [error, setError] = useState<Error | null>(null);
  const [randomSongs, setRandomSongs] = useState<userSong[]>([]);
  const [generateEmoji, setGenerateEmoji] = useState<boolean>(true);

  const youtubeRef = useRef<ReactPlayer>(null);

  useEffect(() => {
    firebaseContext.getSongs().then((songs) => {
      const filter = (song: userSong) => song.url.includes("youtube");

      songs = songs.filter(filter);

      setRandomSongs(getRandomSongs(songs));
    });
  }, [firebaseContext]);

  const generateEmojiStream = (emojis: ILiveEmojis) => {
    if (youtubeRef?.current) {
      const duration = youtubeRef.current.getDuration();
      for (
        var timestamp = 0;
        timestamp < duration;
        timestamp += Math.random() * RANDOM_EMOJI_STREAM_OFFSET
      ) {
        //const randomEmojiUnicode = randomEmoji.random({count:1})[0];
        const roundedTime = roundTime(timestamp);
        if (!(roundedTime in emojis)) emojis[roundedTime] = [];
        emojis[roundedTime].push(
          RANDOM_EMOJIS[Math.floor(Math.random() * RANDOM_EMOJIS.length)]
        );
      }
    }
    console.log(emojis);
  };

  const submitVideo = () => {
    const generatedEmojis: ILiveEmojis = {};

    if (!isValidYouTubeURL(url)) {
      setError(new Error("Invalid YouTube URL: " + url));
      return;
    }

    if (!songId) {
      setError(new Error("No song ID submitted"));
      return;
    }

    if (!songName) {
      setError(new Error("No song name submitted"));
      return;
    }

    if (generateEmoji) {
      generateEmojiStream(generatedEmojis);
    }

    setIsSubmitting(true);

    const trimmedURL = trimURL(url);

    firebaseContext
      .uploadYoutubeVideo(songId, songName, trimmedURL, generatedEmojis)
      .then(() => {
        setIsSubmitting(false);
        setLatestSubmitted({
          url: trimmedURL,
          songId,
          songName,
          generatedEmojis,
        });
        setUrl("");
        setSongId("");
        setSongName("");
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
      <div className="width-100 flex justify-between align-center">
        <PlayerLogo />
        <img
          style={{ width: 50, height: 50, marginRight: 10 }}
          src={bananaDance}
          alt="banana dance"
        />
      </div>

      <div className="flex-column align-center">
        <h2 style={{ margin: 0 }}>create</h2>
        <h2 style={{ margin: 0 }}>player page</h2>
      </div>

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
      <TextField
        placeholder="song name"
        value={songName}
        onChange={(evt) => setSongName(evt.target.value)}
        disabled={isSubmitting}
      />
      <Tooltip title={"Auto generate an emoji stream for the video"}>
        <FormControlLabel
          control={
            <Checkbox
              checked={generateEmoji}
              onChange={(event) => {
                setGenerateEmoji(event.target.checked);
              }}
              color="primary"
            />
          }
          label="generate emoji stream"
        />
      </Tooltip>

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

      {isValidYouTubeURL(url) && <ReactPlayer url={url} ref={youtubeRef} />}

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
            key={song.id}
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

const roundTime = (num: number) => {
  const result = Math.floor(num * 20) / 20;
  // being compatible with previous data
  if (parseFloat(result.toFixed(1)) === parseFloat(result.toFixed(2)))
    return result.toFixed(1);
  return result.toFixed(2);
};
