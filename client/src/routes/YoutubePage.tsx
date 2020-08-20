import "../css/YoutubePage.css";

import { Button, IconButton, Popover, Tooltip } from "@material-ui/core";
import { Close, InsertEmoticon, Lock } from "@material-ui/icons";
import { IEmojiSelections, ISongEmojiSelections, userSong } from "../types";
import Picker, { IEmojiData } from "emoji-picker-react";
import ReactPlayer from "react-player";
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { AdventureLogo } from "../components/AdventureLogo";
import LiveEmojiSection from "../components/LiveEmojiSection";
import BulletSection from "../components/BulletSection";
import { FirebaseContext } from "../contexts/firebaseContext";
import _ from "underscore";
import errorImg from "../assets/error-gif.gif";
import { useHistory } from "react-router-dom";
import { useParam } from "../util";

export const PlayerPage = () => {
  const [error] = useState<string | null>(null);
  const [songPlayingIndex, setSongPlayingIndex] = useState(-1);
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

  const liveEmojiRef = useRef<LiveEmojiSection>(null);
  const bulletRef = useRef<BulletSection>(null);
  const youtubeRef = useRef<ReactPlayer>(null);

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

  const id = useParam("id") || "";

  // find the data for song id and use that for the page
  useEffect(() => {
    if (userSongs.length) {
      for (var i = 0; i < userSongs.length; i++)
        if (userSongs[i].id === id) {
          setSongPlayingIndex(i);
          setSong(userSongs[i]);
          if (liveEmojiRef.current) {
            liveEmojiRef.current.initializeEmojis(
              selectedSongLiveEmojis[userSongs[i].id]
            );
          }
          break;
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

        if (liveEmojiRef.current) {
          liveEmojiRef.current.addEmoji(emoji.unified);
        }
        updateLiveEmojis(song.id, selectedSongLiveEmojis[song.id]);
        return newSongEmojiSelections;
      });
    },
    [updateEmojis, updateLiveEmojis, selectedSongLiveEmojis]
  );

  const onClickEmojiPanel = useCallback(
    (key: string) => () => {
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

      if (liveEmojiRef.current) liveEmojiRef.current.addEmoji(key);
      updateLiveEmojis(song.id, selectedSongLiveEmojis[song.id]);
    },
    [
      userSongs,
      liveEmojiRef,
      selectedSongLiveEmojis,
      songPlayingIndex,
      updateEmojis,
      updateLiveEmojis,
    ]
  );

  const onPlayCallback = () => {
    if (liveEmojiRef.current) {
      liveEmojiRef.current.onPlayCallback();
    }
  };

  const onPauseCallback = () => {
    if (liveEmojiRef.current) liveEmojiRef.current.onPauseCallback();
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
        <ReactPlayer
          url={song?.url}
          controls={true}
          ref={youtubeRef}
          onPlay={onPlayCallback}
          onPause={onPauseCallback}
        />

        {error === null && (
          <LiveEmojiSection youtubeRef={youtubeRef} ref={liveEmojiRef} />
        )}
        {error === null && <BulletSection ref={bulletRef} />}

        {error !== null && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <img src={errorImg} width="480" height="365" alt="error-gif" />
            <div className="error-container">{error}</div>
          </div>
        )}

        <div className="music-controller-emoji-container">
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

          <EmojiPanel
            selectedEmojis={selectedEmojis}
            onClickEmoji={onClickEmojiPanel}
            isDisabled={song?.isLocked}
          />

          <div>
            add emoji
            <Tooltip title="insert emoji">
              <IconButton
                disabled={song?.isLocked}
                onClick={() => setIsEmojiPickerOpen(true)}
              >
                <InsertEmoticon />
              </IconButton>
            </Tooltip>
          </div>

          {song?.isLocked && (
            <Tooltip title="emojis cannot be added to this song">
              <Lock />
            </Tooltip>
          )}
        </div>
      </div>

      <Popover
        open={Boolean(shareAnchor)}
        anchorEl={shareAnchor}
        onClose={() => setShareAnchor(null)}
        className="url-popover-container"
      ></Popover>

      <AdventureLogo />
    </div>
  );
};

const baseEmojiUrl =
  "https://cdn.jsdelivr.net/gh/iamcal/emoji-data@master/img-apple-64/";

const getEmojiImageURL = (code: string) => {
  return `${baseEmojiUrl}${code}.png`;
};

interface IEmojiPanelProps {
  selectedEmojis: IEmojiSelections;
  onClickEmoji: (emoji: string) => () => void;
  isDisabled?: boolean;
}

const EmojiPanel = (props: IEmojiPanelProps) => {
  const { selectedEmojis, onClickEmoji, isDisabled } = props;

  return (
    <div className="emoji-panel-container">
      {Object.entries(selectedEmojis).map(([key, value]) => (
        <div key={key} style={{ textAlign: "center" }}>
          <IconButton disabled={isDisabled} onClick={onClickEmoji(key)}>
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
  );
};
