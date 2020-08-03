import "../css/PlayerPage.css";

import { Button, IconButton, Tooltip } from "@material-ui/core";
import { Close, InsertEmoticon } from "@material-ui/icons";
import { IEmojiSelections, ISongEmojiSelections, userSong } from "../types";
import Picker, { IEmojiData } from "emoji-picker-react";
import React, { useCallback, useContext, useEffect, useState } from "react";

import { AdventureLogo } from "../components/AdventureLogo";
import { FirebaseContext } from "../contexts/firebaseContext";
import BulletSection from "../components/BulletSection";
import { MusicController } from "adventure-component-library";
import _ from "underscore";
import { useHistory } from "react-router-dom";
import { useParam } from "../util";

declare global {
  interface Window {
    bulletComponent: any;
  }
}

export const PlayerPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songPlayingIndex, setSongPlayingIndex] = useState(-1);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const firebaseContext = useContext(FirebaseContext);
  const [userSongs, setUserSongs] = useState<userSong[]>([]);
  const [selectedSongEmojis, setSelectedSongEmojis] = useState<
    ISongEmojiSelections
  >({});
  const [selectedSongLiveEmojis, setSelectedSongLiveEmojis] = useState<any>({});

  const selectedEmojis =
    userSongs.length && userSongs[songPlayingIndex]
      ? selectedSongEmojis[userSongs[songPlayingIndex].id] || {}
      : {};

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const [song, setSong] = useState<userSong>();

  const updateEmojis = useCallback(
    _.debounce((song: userSong, emojiSelections: IEmojiSelections) => {
      if (!song || !Object.keys(emojiSelections).length) return;
      firebaseContext.updateEmojis(song.id, emojiSelections);
    }, 1000),
    [song]
  );

  const updateLiveEmojis = useCallback(
    _.debounce((songId: string, data: any) => {
      firebaseContext.updateLiveEmojis(songId, data);
    }, 1000),
    [song]
  );

  useEffect(() => {
    if (userSongs.length) {
      if (userSongs[songPlayingIndex] !== undefined) {
        window.bulletComponent.initializeEmojis(
          selectedSongLiveEmojis[userSongs[songPlayingIndex].id]
        );
      }
      setSong(userSongs[songPlayingIndex]);
    }
  }, [userSongs, songPlayingIndex]);

  useEffect(() => {
    firebaseContext.getSongs().then((songs) => {
      const selectedSongEmojis = songs.reduce<ISongEmojiSelections>(
        (acc, song) => {
          acc[song.id] = song.emojiSelections || {};
          return acc;
        },
        {}
      );
      setSelectedSongEmojis(selectedSongEmojis);

      const selectedSongliveEmojis = songs.reduce<any>((acc, song) => {
        acc[song.id] = song.liveEmojis || {};
        return acc;
      }, {});
      setSelectedSongLiveEmojis(selectedSongliveEmojis);
      setUserSongs(songs);
    });
  }, [firebaseContext]);

  const id = useParam("id") || "";

  const history = useHistory();

  const onEmojiClick = useCallback(
    (song?: userSong) => (_: MouseEvent, emoji: IEmojiData) => {
      if (!song) return;

      setSelectedSongEmojis((selectedSongEmojis) => {
        let newSongEmojiSelections: ISongEmojiSelections = {
          ...selectedSongEmojis,
        };
        if (!selectedSongEmojis[song.id]) {
          newSongEmojiSelections[song.id] = {};
        }

        newSongEmojiSelections = {
          ...newSongEmojiSelections,
          [song.id]: {
            ...selectedSongEmojis[song.id],
            [emoji.unified]:
              (newSongEmojiSelections[song.id][emoji.unified] || 0) + 1,
          },
        };

        updateEmojis(song, newSongEmojiSelections[song.id]);

        window.bulletComponent.addEmoji(emoji.unified);
        updateLiveEmojis(song.id, selectedSongLiveEmojis[song.id]);
        return newSongEmojiSelections;
      });
    },
    [updateEmojis, updateLiveEmojis]
  );

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
      if (!song) return;

      let _audio: HTMLAudioElement = audio || new window.Audio(song.url);

      _audio.src = song.url;
      _audio?.play();
      if (!audio) {
        setAudio(_audio);
        console.log(song.id);
        window.bulletComponent.initializeAudio(_audio);
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

  const convertedSong = song
    ? {
        url: song.url,
        artist: song.authorName,
        songName: song.songName,
      }
    : {
        url: "",
        artist: "",
        songName: "",
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
            alt="corresponding media"
            style={{ width: 200, height: 200 }}
            src={song.gifUrl}
          />
        ) : (
          <div style={{ width: 200, height: 200 }} />
        )}

        <BulletSection />

        <div className="music-controller-container">
          <MusicController
            isPlaying={isPlaying}
            onClickPrev={onClickPrevSong}
            onClickNext={onClickNextSong}
            onTogglePlay={onTogglePlaySong}
            song={convertedSong}
          />
        </div>
        <div
          style={{
            width: 400,
            display: "flex",
            overflowX: "hidden",
            overflowWrap: "break-word",
            flexWrap: "wrap",
            maxHeight: 300,
            overflowY: "auto",
          }}
        >
          {Object.entries(selectedEmojis || {}).map(([key, value]) => (
            <div key={key} style={{ textAlign: "center" }}>
              <IconButton
                onClick={() => {
                  const song = userSongs[songPlayingIndex];

                  setSelectedSongEmojis((selectedSongEmojis) => ({
                    ...selectedSongEmojis,
                    [song.id]: {
                      ...selectedSongEmojis[song.id],
                      [key]: (selectedSongEmojis[song.id][key] || 0) + 1,
                    },
                  }));

                  window.bulletComponent.addEmoji(key);
                  updateLiveEmojis(song.id, selectedSongLiveEmojis[song.id]);
                }}
              >
                <img
                  style={{ width: 30, height: 30 }}
                  src={getEmojiImageURL(key)}
                  alt="emoji"
                />
              </IconButton>
              <div>{value}</div>
            </div>
          ))}
        </div>

        <Tooltip title="insert emoji">
          <IconButton onClick={() => setIsEmojiPickerOpen(true)}>
            <InsertEmoticon />
          </IconButton>
        </Tooltip>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          visibility: isEmojiPickerOpen ? "visible" : "hidden",
        }}
      >
        <IconButton onClick={() => setIsEmojiPickerOpen(false)}>
          <Close htmlColor="red" />
        </IconButton>
        <Picker key={song?.id} onEmojiClick={onEmojiClick(song)} />
      </div>
      <AdventureLogo />
    </div>
  );
};

const baseEmojiUrl =
  "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/";

const getEmojiImageURL = (code: string) => {
  return `${baseEmojiUrl}${code}.png`;
};
