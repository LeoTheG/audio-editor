import "../components/css/Leaderboard.css";

import {
  Button,
  IconButton,
  Popover,
  Tooltip,
  Modal,
  TextField,
} from "@material-ui/core";
import {
  Close,
  InsertEmoticon,
  Lock,
  SkipNext,
  SkipPrevious,
} from "@material-ui/icons";
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
import LiveEmojiSection from "../components/LiveEmojiSection";
import ReactPlayer from "react-player";
import _ from "underscore";
import errorImg from "../assets/error-gif.gif";
import { useHistory } from "react-router-dom";
import { useParam } from "../util";

export const YoutubePage = () => {
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
  const [isDisplayingScoreModal, setDisplayingScoreModal] = useState(false);
  const [points, setPoints] = useState<number>(-1);
  const [scoreName, setScoreName] = useState<string>("");

  const onSubmitPoints = () => {
    if (song) {
      const highscores = song.highscores || [];
      highscores.push({ name: scoreName, score: points });
      firebaseContext.updateLiveEmojiPoints(song.id, highscores);
      setDisplayingScoreModal(false);
      setUserSongs([
        ...userSongs.slice(0, songPlayingIndex),
        { ...song, highscores },
        ...userSongs.slice(songPlayingIndex + 1),
      ]);
    }
  };

  useEffect(() => {
    if (!isDisplayingScoreModal && liveEmojiRef.current) {
      liveEmojiRef.current.resetPoints();
    }
  }, [isDisplayingScoreModal]);

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

  const onSongEnd = () => {
    setDisplayingScoreModal(true);
  };

  const onClickPrevious = () => {
    const newIndex = (songPlayingIndex - 1) % userSongs.length;
    setSongPlayingIndex(newIndex);
  };

  const onClickNext = () => {
    const newIndex = (songPlayingIndex + 1) % userSongs.length;
    setSongPlayingIndex(newIndex);
  };

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
      let songIndex =
        songPlayingIndex !== -1
          ? songPlayingIndex
          : userSongs.findIndex((song) => song.id === id);
      if (songIndex === -1) {
        songIndex = 0;
      }
      const song = userSongs[songIndex];
      history.push("/youtube?id=" + song.id);

      setSongPlayingIndex(songIndex);
      setSong(userSongs[songIndex]);
      if (liveEmojiRef.current) {
        liveEmojiRef.current.initializeEmojis(
          selectedSongLiveEmojis[userSongs[songIndex].id]
        );
      }

      //   for (var i = 0; i < userSongs.length; i++)
      //     if (userSongs[i].id === id) {
      //       setSongPlayingIndex(i);
      //       setSong(userSongs[i]);
      //       if (liveEmojiRef.current) {
      //         liveEmojiRef.current.initializeEmojis(
      //           selectedSongLiveEmojis[userSongs[i].id]
      //         );
      //       }
      //       break;
      //     }
    }
  }, [userSongs, songPlayingIndex, selectedSongLiveEmojis, id, history]);

  useEffect(() => {
    firebaseContext.getSongs().then((songs) => {
      songs = songs.filter((song) => song.url.includes("youtube"));
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
    liveEmojiRef.current?.onPlayCallback();
    bulletRef.current?.onPlayCallback();
  };

  const onPauseCallback = () => {
    liveEmojiRef.current?.onPauseCallback();
    bulletRef.current?.onPauseCallback();
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
          onEnded={onSongEnd}
        />

        {error === null && (
          <LiveEmojiSection
            youtubeRef={youtubeRef}
            ref={liveEmojiRef}
            onChangePoints={setPoints}
          />
        )}
        {error === null && (
          <BulletSection youtubeRef={youtubeRef} ref={bulletRef} />
        )}

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

        <div>
          <IconButton onClick={onClickPrevious}>
            <SkipPrevious />
          </IconButton>
          <IconButton onClick={onClickNext}>
            <SkipNext />
          </IconButton>
        </div>

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

          {!song?.isLocked && (
            <EmojiPanel
              selectedEmojis={selectedEmojis}
              onClickEmoji={onClickEmojiPanel}
              isDisabled={song?.isLocked}
            />
          )}
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

        {song?.highscores && <Leaderboard scores={song.highscores} />}
      </div>

      <Popover
        open={Boolean(shareAnchor)}
        anchorEl={shareAnchor}
        onClose={() => setShareAnchor(null)}
        className="url-popover-container"
      ></Popover>
      <Modal open={isDisplayingScoreModal}>
        <div className="streak-modal-container">
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              width: "100%",
            }}
          >
            <IconButton onClick={() => setDisplayingScoreModal(false)}>
              <div style={{ color: "red" }}>x</div>
            </IconButton>
          </div>
          score: {points}
          <div style={{ display: "flex", marginBottom: 10 }}>
            <div style={{ marginRight: 10 }}>enter name:</div>
            <TextField
              value={scoreName}
              onChange={(e) => setScoreName(e.target.value)}
            />
          </div>
          <Button variant="contained" onClick={onSubmitPoints}>
            submit
          </Button>
        </div>
      </Modal>

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

interface ILeaderboardProps {
  scores: { name: string; score: number }[];
}

const Leaderboard = (props: ILeaderboardProps) => {
  const inOrderScores = props.scores.sort((a, b) => a.score - b.score);
  return (
    <div className="leaderboard-container">
      <div className="leaderboard-title">Leaderboard</div>
      {inOrderScores.map((score) => (
        <div key={score.name + score.score} style={{ display: "flex" }}>
          <div className="leaderboard-name">{score.name}</div>
          <div className="leaderboard-score">{score.score}</div>
        </div>
      ))}
    </div>
  );
};
