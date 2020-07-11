import React, { useEffect, useState, useContext } from "react";
import { useParam } from "../util";
import { MusicController } from "adventure-component-library";
import { userSong } from "../types";
import "../css/PlayerPage.css";
import { AdventureLogo } from "../components/AdventureLogo";
import { Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { FirebaseContext } from "../contexts/firebaseContext";

// interface IPlayerPageProps {
// }

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
      // if (songs.length && songPlayingIndex === -1) {
      //   setAudio(new window.Audio(songs[0].url));
      //   setSongPlayingIndex(0);
      // }
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
    if (userSongs.length) {
      const songIndex = userSongs.findIndex((upload) => upload.id === id);
      if (songIndex !== -1) {
        const song = userSongs[songIndex];

        setAudio(new window.Audio(song.url));
        setSongPlayingIndex(songIndex);
      } else {
        alert("Song with id " + id + " not found");
        setSongPlayingIndex(0);
      }
    }
  }, [userSongs, id]);

  const onClickPrevSong = () => {
    let newSongIndex = songPlayingIndex - 1;
    if (newSongIndex < 0) {
      newSongIndex = userSongs.length - 1;
    }
    setSongPlayingIndex(newSongIndex);
    setIsPlaying(true);
  };
  const onClickNextSong = () => {
    let newSongIndex = songPlayingIndex + 1;
    if (newSongIndex >= userSongs.length) {
      newSongIndex = 0;
    }
    setSongPlayingIndex(newSongIndex);
    setIsPlaying(true);
  };

  const onTogglePlaySong = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (!audio) return;
    if (isPlaying) {
      audio.play();
    }
    if (!isPlaying) {
      audio.pause();
    }
  }, [isPlaying, audio]);

  useEffect(() => {
    if (isPlaying && audio) {
      const song = userSongs[songPlayingIndex];
      audio.src = song.url;
      audio.play();
      // firebaseContext.getSongURL(song._id).then((songUrl) => {
      //   audio.src = songUrl;
      //   audio.play();
      // });
    }
  }, [songPlayingIndex, audio, isPlaying, userSongs]);

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
          // ...song,
          // artist: song.authorName,
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
