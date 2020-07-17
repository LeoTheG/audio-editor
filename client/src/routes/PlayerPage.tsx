import "../css/PlayerPage.css";

import React, { useContext, useEffect, useState } from "react";

import { AdventureLogo } from "../components/AdventureLogo";
import { Button } from "@material-ui/core";
import { FirebaseContext } from "../contexts/firebaseContext";
import { MusicController } from "adventure-component-library";
import { useHistory } from "react-router-dom";
import { useParam } from "../util";
import { userSong } from "../types";

export const PlayerPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songPlayingIndex, setSongPlayingIndex] = useState(-1);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const firebaseContext = useContext(FirebaseContext);
  const [userSongs, setUserSongs] = useState<userSong[]>([]);

  const song = userSongs[songPlayingIndex];

  useEffect(() => {
    firebaseContext.getSongs().then((songs) => {
      setUserSongs(songs);
    });
  }, [firebaseContext]);

  const id = useParam("id") || "";

  const history = useHistory();

  const onEndAudio = () => {
    setIsPlaying(false);
  };

  useEffect(() => {
    if (audio === null) return;

    audio.addEventListener("ended", onEndAudio);
    return onEndAudio;
  }, [audio]);

  useEffect(() => {
    if (!userSongs.length) return;
    const songIndex = userSongs.findIndex((upload) => upload.id === id);
    if (songIndex === -1) {
      if (id.length) alert("Song with id " + id + " not found");
      else {
        setSongPlayingIndex(0);
      }
    } else {
      setSongPlayingIndex(songIndex);
    }
  }, [id, userSongs]);

  const onClickPrevSong = () => {
    let newSongIndex = songPlayingIndex - 1;
    if (newSongIndex < 0) {
      newSongIndex = userSongs.length - 1;
    }
    playSong(newSongIndex);
  };

  const onClickNextSong = () => {
    let newSongIndex = songPlayingIndex + 1;
    if (newSongIndex >= userSongs.length) {
      newSongIndex = 0;
    }
    playSong(newSongIndex);
  };

  const playSong = (index: number) => {
    if (index === songPlayingIndex && audio) {
      audio.play();
    } else {
      audio?.pause();
      const song = userSongs[index];

      let _audio: HTMLAudioElement = audio || new window.Audio(song.url);

      _audio.src = song.url;
      _audio?.play();
      if (!audio) {
        setAudio(_audio);
      }

      setSongPlayingIndex(index);
    }
    setIsPlaying(true);
  };

  const onTogglePlaySong = () => {
    if (userSongs.length && !isPlaying) {
      if (songPlayingIndex !== -1) {
        playSong(songPlayingIndex);
      }
    } else if (audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const convertedSong =
    songPlayingIndex === -1
      ? {
          url: "",
          artist: "",
          songName: "",
        }
      : {
          url: song.url,
          artist: song.authorName,
          songName: song.songName,
        };

  return (
    <div className="player-page-container">
      <div style={{ width: "100%" }}>
        <Button
          style={{
            minWidth: 20,
            color: "white",
            background: "grey",
            padding: 10,
          }}
          variant="contained"
          onClick={() => history.push("/")}
        >
          HOME
        </Button>
      </div>
      <div className="player-body">
        {song && song.gifUrl ? (
          <img
            alt="corresponding gif"
            style={{ width: 200, height: 200 }}
            src={song.gifUrl}
          />
        ) : (
          <div style={{ width: 200, height: 200 }} />
        )}
        <div className="music-controller-container">
          <MusicController
            isPlaying={isPlaying}
            onClickPrev={onClickPrevSong}
            onClickNext={onClickNextSong}
            onTogglePlay={onTogglePlaySong}
            song={convertedSong}
          />
        </div>
      </div>
      <AdventureLogo />
    </div>
  );
};
