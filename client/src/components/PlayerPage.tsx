import React, { useEffect, useState, useContext } from "react";
import { useParam } from "../util";
import { MusicController } from "adventure-component-library";
import { userSong } from "../types";
import "./css/PlayerPage.css";
import { AdventureLogo } from "./AdventureLogo";
import { Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";
import { FirebaseContext } from "../App";

interface IPlayerPageProps {
  // uploadList: IUserUpload[];
}

export const PlayerPage = (props: IPlayerPageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songPlayingIndex, setSongPlayingIndex] = useState(-1);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const firebaseContext = useContext(FirebaseContext);
  const [userSongs, setUserSongs] = useState<userSong[]>([]);

  const song = userSongs[songPlayingIndex];

  useEffect(() => {
    firebaseContext.getSongs().then((songs) => {
      console.log(songs);
      setUserSongs(songs);
      if (songs.length) {
        setAudio(new window.Audio(songs[0].url));
        setSongPlayingIndex(0);
      }
    });
  }, [firebaseContext]);

  const id = useParam("id") || "";

  const history = useHistory();

  const onEndAudio = () => {
    setIsPlaying(false);
    // onClickNextSong();
  };

  useEffect(() => {
    if (audio === null) return;

    audio.addEventListener("ended", onEndAudio);
    return onEndAudio;
  }, [audio]);

  useEffect(() => {
    // if (props.uploadList.length) {
    if (userSongs.length) {
      const songIndex = userSongs.findIndex((upload) => upload.id === id);
      if (songIndex !== -1) {
        const song = userSongs[songIndex];

        setAudio(new window.Audio(song.url));
        setSongPlayingIndex(songIndex);
        console.log("song playing index is ", songIndex);

        // const songUrl = firebaseContext.getSongURL(song._id).then((url) => {
        //   // setAudio(new window.Audio(song.url));
        //   setAudio(new window.Audio(url));
        //   setSongPlayingIndex(songIndex);
        // });
      } else {
        alert("Song with id " + id + " not found");
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

  console.log(convertedSong);

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
