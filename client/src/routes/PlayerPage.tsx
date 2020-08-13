import "../css/PlayerPage.css";

import { Button, IconButton, Popover, Tooltip } from "@material-ui/core";
import { Close, InsertEmoticon, Share } from "@material-ui/icons";
import { IEmojiSelections, ISongEmojiSelections, userSong } from "../types";
import Picker, { IEmojiData } from "emoji-picker-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { AdventureLogo } from "../components/AdventureLogo";
import BulletSection from "../components/BulletSection";
import { FirebaseContext } from "../contexts/firebaseContext";
import { MusicController } from "adventure-component-library";
import _ from "underscore";
import { useHistory } from "react-router-dom";
import { useParam } from "../util";

export const PlayerPage = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [songPlayingIndex, setSongPlayingIndex] = useState(-1);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);
  const firebaseContext = useContext(FirebaseContext);
  const [userSongs, setUserSongs] = useState<userSong[]>([]);
  const [selectedSongEmojis, setSelectedSongEmojis] = useState<
    ISongEmojiSelections
  >({});
  const [selectedSongLiveEmojis, setSelectedSongLiveEmojis] = useState<any>({});
  const [shareAnchor, setShareAnchor] = useState<HTMLButtonElement | null>(
    null
  );

  const history = useHistory();

  const selectedEmojis =
    userSongs.length && userSongs[songPlayingIndex]
      ? selectedSongEmojis[userSongs[songPlayingIndex].id] || {}
      : {};

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);

  const [song, setSong] = useState<userSong>();

  const bulletRef = useRef<BulletSection>(null);

  const onClickShare = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      setShareAnchor(event.currentTarget);
    },
    []
  );

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
    if (songPlayingIndex !== -1) {
      const song = userSongs[songPlayingIndex];
      history.push(`/player?id=${song.id}`);
    }
  }, [history, songPlayingIndex, userSongs]);

  useEffect(() => {
    if (userSongs.length) {
      if (userSongs[songPlayingIndex]) {
        setSong(userSongs[songPlayingIndex]);
        if (bulletRef && bulletRef.current) {
          bulletRef.current.initializeEmojis(
            selectedSongLiveEmojis[userSongs[songPlayingIndex].id]
          );
        }
      }
    }
  }, [userSongs, songPlayingIndex, selectedSongLiveEmojis]);

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

      const selectedSongLiveEmojis = songs.reduce<any>((acc, song) => {
        acc[song.id] = song.liveEmojis || {};
        return acc;
      }, {});
      setSelectedSongLiveEmojis(selectedSongLiveEmojis);
      setUserSongs(songs);
    });
  }, [firebaseContext]);

  const id = useParam("id") || "";

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

        if (bulletRef && bulletRef.current) {
          bulletRef.current.addEmoji(emoji.unified);
        }
        updateLiveEmojis(song.id, selectedSongLiveEmojis[song.id]);
        return newSongEmojiSelections;
      });
    },
    [updateEmojis, updateLiveEmojis, selectedSongLiveEmojis]
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
      setSongPlayingIndex(0);
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
        if (bulletRef && bulletRef.current)
          bulletRef.current.initializeAudio(_audio);
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

  //   if (error !== null) {
  //     return <div className="error-container">{error}</div>;
  //   }

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
        {error === null && song && song.gifUrl ? (
          <img
            alt="corresponding media"
            style={{ width: 200, height: 200 }}
            src={song.gifUrl}
            onError={(e) =>
              setError(
                "whoops, looks like there's too much activity, try the player tomorrow"
              )
            }
          />
        ) : (
          <div style={{ width: 200, height: 200 }} />
        )}

        {error === null && <BulletSection ref={bulletRef} />}

        {error !== null && (
          <div className="error-container">
            <img
              src="https://i.giphy.com/media/fDO2Nk0ImzvvW/giphy.webp"
              width="480"
              height="365"
              alt="error-gif"
              //   frameBorder="0"
              //   className="giphy-embed"
              //   allowFullScreen
            />
            {error}
          </div>
        )}

        <div className="music-controller-emoji-container">
          <div className="music-controller-container">
            <MusicController
              isPlaying={isPlaying}
              onClickPrev={onClickPrevSong}
              onClickNext={onClickNextSong}
              onTogglePlay={onTogglePlaySong}
              song={convertedSong}
            />
            <Tooltip title="shareable url">
              <IconButton
                style={{ width: "fit-content" }}
                onClick={onClickShare}
              >
                <Share style={{ width: 50, height: 30 }} />
              </IconButton>
            </Tooltip>
          </div>

          <div
            style={{
              display: isEmojiPickerOpen ? "flex" : "none",
            }}
            className="emoji-picker-container"
          >
            <IconButton onClick={() => setIsEmojiPickerOpen(false)}>
              <Close htmlColor="red" />
            </IconButton>
            <Picker key={song?.id} onEmojiClick={onEmojiClick(song)} />
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

                    setSelectedSongEmojis((selectedSongEmojis) => {
                      const newSelectedSongEmojis = {
                        ...selectedSongEmojis,
                        [song.id]: {
                          ...selectedSongEmojis[song.id],
                          [key]: (selectedSongEmojis[song.id][key] || 0) + 1,
                        },
                      };
                      updateEmojis(song, newSelectedSongEmojis[song.id]);
                      return newSelectedSongEmojis;
                    });

                    if (bulletRef && bulletRef.current)
                      bulletRef.current.addEmoji(key);
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
          <div>
            add emoji
            <Tooltip title="insert emoji">
              <IconButton onClick={() => setIsEmojiPickerOpen(true)}>
                <InsertEmoticon />
              </IconButton>
            </Tooltip>
          </div>
        </div>
      </div>

      <Popover
        open={Boolean(shareAnchor)}
        anchorEl={shareAnchor}
        onClose={() => setShareAnchor(null)}
        className="url-popover-container"
      >
        <a target="_blank" rel="noopener noreferrer" href={generateUrl(song)}>
          {generateUrl(song)}
        </a>
      </Popover>

      <AdventureLogo />
    </div>
  );
};

const baseEmojiUrl =
  "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/";

const getEmojiImageURL = (code: string) => {
  return `${baseEmojiUrl}${code}.png`;
};

const generateUrl = (song?: userSong) => {
  if (!song) return "";
  return `${window.location.origin}/#/player?id=${song.id}`;
};
