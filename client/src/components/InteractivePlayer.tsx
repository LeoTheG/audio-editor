import {
  Button,
  IconButton,
  Modal,
  Popover,
  TextField,
  Tooltip,
} from "@material-ui/core";
import {
  Close,
  InsertEmoticon,
  Lock,
  Share,
  SkipNext,
  SkipPrevious,
} from "@material-ui/icons";
import {
  IEmojiSelections,
  ISongEmojiSelections,
  userSong,
  ILiveEmojis,
  IBullets,
} from "../types";
import Picker, { IEmojiData } from "emoji-picker-react";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { AdventureLogo } from "../components/AdventureLogo";
import BulletSection from "../components/BulletSection";
import { EmojiPanel } from "./EmojiPanel";
import { FirebaseContext } from "../contexts/firebaseContext";
import { Leaderboard } from "../components/Leaderboard";
import LiveEmojiSection from "../components/LiveEmojiSection";
import { MusicController } from "adventure-component-library";
import ReactPlayer from "react-player";
import _ from "underscore";
import errorImg from "../assets/error-gif.gif";
import { useHistory } from "react-router-dom";
import { useParam } from "../util";

interface IInteractivePlayerProps {
  isYoutube?: boolean;
}

export const InteractivePlayer = ({ isYoutube }: IInteractivePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const youtubeRef = useRef<ReactPlayer>(null);

  const [error, setError] = useState<string | null>(null);
  const [songPlayingIndex, setSongPlayingIndex] = useState(-1);
  const firebaseContext = useContext(FirebaseContext);
  const [userSongs, setUserSongs] = useState<userSong[]>([]);
  const [selectedSongEmojis, setSelectedSongEmojis] = useState<
    ISongEmojiSelections
  >({});
  const [selectedSongLiveEmojis, setSelectedSongLiveEmojis] = useState<{
    [songId: string]: ILiveEmojis;
  }>({});
  const [selectedSongBullets, setSelectedSongBullets] = useState<{
    [songId: string]: IBullets;
  }>({});
  const [shareAnchor, setShareAnchor] = useState<HTMLButtonElement | null>(
    null
  );
  const [isDisplayingScoreModal, setDisplayingScoreModal] = useState(false);
  const [points, setPoints] = useState<number>(-1);
  const [scoreName, setScoreName] = useState<string>("");

  const historyURL = useMemo<string>(() => {
    return isYoutube ? "youtube" : "player";
  }, [isYoutube]);

  const [playedSong, setPlayedSong] = useState<{ [songId: string]: boolean }>(
    {}
  );

  const onSongEnd = useCallback(() => {
    setIsPlaying(false);
    onPause();
    if (points > 0) {
      setDisplayingScoreModal(true);
    }
  }, [points]);

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

  const updateBullets = useCallback(
    _.debounce((songId: string, data: any) => {
      firebaseContext.updateBullets(songId, data);
    }, 1000),
    [song]
  );

  useEffect(() => {
    if (songPlayingIndex !== -1) {
      const song = userSongs[songPlayingIndex];
      history.push(`/${historyURL}?id=${song.id}`);
    }
  }, [history, songPlayingIndex, userSongs, historyURL]);

  useEffect(() => {
    if (userSongs.length) {
      if (userSongs[songPlayingIndex]) {
        setSong(userSongs[songPlayingIndex]);
        liveEmojiRef.current?.initializeEmojis(
          selectedSongLiveEmojis[userSongs[songPlayingIndex].id]
        );
        bulletRef.current?.initializeBullets(
          selectedSongBullets[userSongs[songPlayingIndex].id]
        );
      }
    }
  }, [
    userSongs,
    songPlayingIndex,
    selectedSongLiveEmojis,
    selectedSongBullets,
  ]);

  useEffect(() => {
    firebaseContext.getSongs().then((songs) => {
      const filter = isYoutube
        ? (song: userSong) => song.url.includes("youtube")
        : (song: userSong) => song.authorName;

      songs = songs.filter(filter);

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

      const selectedSongBullets = songs.reduce<any>((acc, song) => {
        acc[song.id] = song.bullets || {};
        return acc;
      }, {});
      setSelectedSongBullets(selectedSongBullets);

      setUserSongs(songs);
    });
  }, [firebaseContext, isYoutube]);

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

        if (liveEmojiRef.current) {
          liveEmojiRef.current.addEmoji(emoji.unified);
        }
        updateLiveEmojis(song.id, selectedSongLiveEmojis[song.id]);
        return newSongEmojiSelections;
      });
    },
    [updateEmojis, updateLiveEmojis, selectedSongLiveEmojis]
  );

  useEffect(() => {
    if (audio === null) return;
    audio.addEventListener("ended", onSongEnd);
  }, [audio, onSongEnd]);

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

  const onPlayYoutube = () => {
    updatePlayCount(songPlayingIndex);
    onPlay();
  };

  const onPlay = () => {
    liveEmojiRef.current?.onPlayCallback();
    bulletRef.current?.onPlayCallback();
  };

  const onPause = () => {
    liveEmojiRef.current?.onPauseCallback();
    bulletRef.current?.onPauseCallback();
  };

  const updatePlayCount = useCallback(
    (songIndex: number) => {
      const song = userSongs[songIndex];

      if (song && !playedSong[song.id]) {
        setPlayedSong({ ...playedSong, [song.id]: true });
        const newPlayCount = (song.playCount || 0) + 1;
        firebaseContext.updatePlayCount(song.id, newPlayCount);
      }
    },
    [playedSong, firebaseContext, userSongs]
  );

  const playSong = (index: number) => {
    updatePlayCount(index);

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
        liveEmojiRef.current?.initializeAudio(_audio);
        bulletRef.current?.initializeAudio(_audio);
        _audio.onplaying = onPlay;
        _audio.onpause = onPause;
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

  const onClickEmojiPanel = useCallback(
    (key: string) => () => {
      console.log("clicked emoji", key);
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

      if (liveEmojiRef.current) {
        liveEmojiRef.current.addEmoji(key);
        console.log("adding emoji!");
      } else console.log("no liveEmojiRef.current");
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

  const onClickHome = useCallback(() => {
    if (audio) {
      audio.pause();
      audio.removeAttribute("src");
    }
    history.push("/");
  }, [audio, history]);

  return (
    <div className="player-page-container">
      {!isYoutube && (
        <div style={{ width: "100%" }}>
          <Button
            style={{
              minWidth: 20,
              color: "white",
              background: "grey",
              padding: 10,
            }}
            variant="contained"
            onClick={onClickHome}
          >
            HOME
          </Button>
        </div>
      )}

      <div className="player-body">
        {isYoutube ? (
          <ReactPlayer
            url={song?.url}
            controls={true}
            ref={youtubeRef}
            width={Math.min(640, window.innerWidth)}
            onReady={bulletRef.current?.matchPlayerDim}
            onPlay={onPlayYoutube}
            onPause={onPause}
            onEnded={onSongEnd}
          />
        ) : error === null && song && song.gifUrl ? (
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

        {error === null && (
          <LiveEmojiSection
            youtubeRef={isYoutube ? youtubeRef : undefined}
            ref={liveEmojiRef}
            onChangePoints={setPoints}
            scores={song?.highscores}
          />
        )}
        {error === null && (
          <BulletSection
            updateBullets={() => {
              if (song) updateBullets(song.id, selectedSongBullets[song.id]);
            }}
            ref={bulletRef}
            youtubeRef={isYoutube ? youtubeRef : undefined}
          />
        )}

        {isYoutube && (
          <div className="back-next-container">
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconButton onClick={onClickPrevSong}>
                <SkipPrevious />
              </IconButton>
              <div>back</div>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <IconButton onClick={onClickNextSong}>
                <SkipNext />
              </IconButton>
              next
            </div>
          </div>
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

        <div className="music-controller-emoji-container">
          {!isYoutube && (
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
                  <Share style={{ width: 50, height: 30, color: "#75d56c" }} />
                </IconButton>
              </Tooltip>
            </div>
          )}

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
            <>
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
            </>
          )}

          {song?.isLocked && (
            <Tooltip title="emojis cannot be added to this song">
              <Lock />
            </Tooltip>
          )}
        </div>

        <div className="leaderboard-plays-container">
          {song?.highscores && <Leaderboard scores={song.highscores} />}
          <div className="plays-container">plays: {song?.playCount || 0}</div>
        </div>
      </div>

      <AdventureLogo />

      <Popover
        open={Boolean(shareAnchor)}
        anchorEl={shareAnchor}
        onClose={() => setShareAnchor(null)}
        className="url-popover-container"
      >
        <a
          target="_blank"
          rel="noopener noreferrer"
          href={generateUrl(isYoutube, song)}
        >
          {generateUrl(isYoutube, song)}
        </a>
      </Popover>

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
    </div>
  );
};

const generateUrl = (isYoutube?: boolean, song?: userSong) => {
  if (!song) return "";
  return `${window.location.origin}/#/${isYoutube ? "youtube" : "player"}?id=${
    song.id
  }`;
};
