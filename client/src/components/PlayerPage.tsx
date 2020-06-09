import React, { useEffect, useState } from "react";
import { useParam } from "../util";
import { MusicController } from "adventure-component-library";
import { IUserUpload } from "../types";
import "./css/PlayerPage.css";
import { AdventureLogo } from "./AdventureLogo";
import { Button } from "@material-ui/core";
import { useHistory } from "react-router-dom";

interface IPlayerPageProps {
  uploadList: IUserUpload[];
}

export const PlayerPage = (props: IPlayerPageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songPlayingIndex, setSongPlayingIndex] = useState(-1);
  const song = props.uploadList[songPlayingIndex];
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

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
    if (props.uploadList.length) {
      const songIndex = props.uploadList.findIndex(
        (upload) => upload._id === id
      );
      if (songIndex !== -1) {
        const song = props.uploadList[songIndex];
        setAudio(new window.Audio(song.url));
        setSongPlayingIndex(songIndex);
      } else {
        alert("Song with id " + id + " not found");
      }
    }
  }, [props.uploadList]);

  const onClickPrevSong = () => {
    let newSongIndex = songPlayingIndex - 1;
    if (newSongIndex < 0) {
      newSongIndex = props.uploadList.length - 1;
    }
    setSongPlayingIndex(newSongIndex);
    setIsPlaying(true);
  };
  const onClickNextSong = () => {
    let newSongIndex = songPlayingIndex + 1;
    if (newSongIndex >= props.uploadList.length) {
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
      audio.src = props.uploadList[songPlayingIndex].url;
      audio.play();
    }
  }, [songPlayingIndex, audio]);

  const convertedSong =
    songPlayingIndex === -1
      ? {
          url: "",
          artist: "",
          songName: "",
        }
      : {
          ...song,
          artist: song.authorName,
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
