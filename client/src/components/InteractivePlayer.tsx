import "./css/InteractivePlayer.css";

import {
  Button,
  IconButton,
  Modal,
  Popover,
  Switch,
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
  IBullets,
  IEmojiSelections,
  ILiveEmojis,
  ISongEmojiSelections,
  userSong,
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
import { useHistory, useParams } from "react-router-dom";

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
import ghost from "../assets/red_ghost.gif";
import io from "socket.io-client";
import kirby from "../assets/kirby.gif";
import link from "../assets/link-run.gif";
import mario from "../assets/mario.gif";
import nyancat from "../assets/nyancat_big.gif";
import yoshi from "../assets/yoshi.gif";

const socket = io("wss://yeeplayer.herokuapp.com");
// const socket = io("ws://localhost:8000");

const avatarMap: { [key: string]: string } = {
  mario: mario,
  kirby: kirby,
  link: link,
  nyancat: nyancat,
  ghost: ghost,
  yoshi: yoshi,
};

interface IUserLocations {
  [userId: string]: { x: number; y: number };
}

interface IInteractivePlayerProps {
  isYoutube?: boolean;
}

interface IUserProfiles {
  [clientId: string]: { name: string; avatar: string };
}

const selectedProfiles: { [clientId: string]: string } = {};

export const InteractivePlayer = ({ isYoutube }: IInteractivePlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audio, setAudio] = useState<HTMLAudioElement | null>(null);

  const youtubeRef = useRef<ReactPlayer>(null);

  const playerBodyRef = useRef<HTMLDivElement>(null);
  const [playerBodyRect, setPlayerBodyRect] = useState<DOMRect>();

  const { id } = useParams();

  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [song, setSong] = useState<userSong>();
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

  const [isCollaborating, setCollaborating] = useState(false);
  const [amountOnline, setAmountOnline] = useState(0);
  const [userLocations, setUserLocations] = useState<IUserLocations>({});
  const [userProfiles, setUserProfiles] = useState<IUserProfiles>({});

  const updateCursorPosition = useCallback(
    _.throttle((position: [number, number]) => {
      socket.emit("cursor move", { x: position[0], y: position[1] });
    }, 200),
    []
  );

  const onMouseMove = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      if (!isCollaborating || !playerBodyRect) {
        return;
      }
      const x = event.clientX - playerBodyRect.left; //x position within the element.
      const y = event.clientY - playerBodyRect.top; //y position within the element.

      const width = event.currentTarget.clientWidth;
      const height = event.currentTarget.clientHeight;

      const relativeX = x / width;
      const relativeY = y / height;

      updateCursorPosition([relativeX, relativeY]);
    },
    [isCollaborating, updateCursorPosition, playerBodyRect]
  );

  useEffect(() => {
    window.onresize = () => {
      if (playerBodyRef.current) {
        const rect = playerBodyRef.current.getBoundingClientRect();
        setPlayerBodyRect(rect);
      }
    };
    if (playerBodyRef.current) {
      const rect = playerBodyRef.current.getBoundingClientRect();
      setPlayerBodyRect(rect);
    }
  }, [playerBodyRef]);

  useEffect(() => {
    if (isCollaborating) {
      socket.emit("connect room", id);
    } else {
      socket.emit("disconnect room");
      setUserProfiles({});
      setUserLocations({});
      setAmountOnline(0);
    }
  }, [isCollaborating, id]);

  const onChangeCollaboration = useCallback((_, isCollaborating: boolean) => {
    setCollaborating(isCollaborating);
  }, []);

  const onCursorMove = useCallback(function cursorMove(
    clientId: string,
    [x, y]: number[]
  ) {
    if (!playerBodyRef.current) return;

    const rect = playerBodyRef.current.getBoundingClientRect();

    const width = rect.width;
    const height = rect.height;

    const absoluteX = width * x;
    const absoluteY = height * y;

    setUserLocations((userLocations) => {
      const newUserLocations = {
        ...userLocations,
        [clientId]: {
          ...userLocations[clientId],
          x: absoluteX,
          y: absoluteY,
        },
      };

      if (!userLocations[clientId]) {
        setAmountOnline(Object.keys(userLocations).length + 1);
      }

      return newUserLocations;
    });
  },
  []);

  useEffect(() => {
    setUserLocations({});

    socket.emit("connect room", id);
    socket.on("connect", function () {
      socket.emit("connect room", id);
    });
    socket.on("roommate disconnect", (clientId: string) => {
      setUserLocations((userLocations) => {
        const newUserLocations = {
          ...userLocations,
        };

        delete newUserLocations[clientId];
        delete selectedProfiles[clientId];

        setAmountOnline(Math.max(Object.keys(userLocations).length - 1, 0));

        return newUserLocations;
      });
    });
    socket.on(
      "profile info",
      (clientId: string, clientProfile: { name: string; avatar: string }) => {
        setUserProfiles((userProfiles) => ({
          ...userProfiles,
          [clientId]: clientProfile,
        }));
      }
    );

    socket.on("room profile info", (profileInfo: IUserProfiles) => {
      setUserProfiles(profileInfo);
    });

    socket.on("cursor move", onCursorMove);
  }, [id, onCursorMove]);

  const onSubmitPoints = useCallback(() => {
    if (song) {
      const highscores = song.highscores || [];
      highscores.push({ name: scoreName, score: points });
      firebaseContext.updateLiveEmojiPoints(song.id, highscores);
      setDisplayingScoreModal(false);
      setUserSongs((userSongs) => [
        ...userSongs.slice(0, songPlayingIndex),
        { ...song, highscores },
        ...userSongs.slice(songPlayingIndex + 1),
      ]);
    }
  }, [song, firebaseContext, points, scoreName, songPlayingIndex]);

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
      history.push(`/${historyURL}/${song.id}`);
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
    if (!userSongs.length) return;
    const songIndex = userSongs.findIndex((upload) => upload.id === id);
    if (songIndex === -1) {
      if (id) alert("Song with id " + id + " not found");
      setSongPlayingIndex(0);
    } else {
      setSongPlayingIndex(songIndex);
    }
  }, [id, userSongs]);

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

  const onPlay = useCallback(() => {
    liveEmojiRef.current?.onPlayCallback();
    bulletRef.current?.onPlayCallback();
  }, [liveEmojiRef, bulletRef]);

  const onPlayYoutube = useCallback(() => {
    updatePlayCount(songPlayingIndex);
    onPlay();
  }, [onPlay, updatePlayCount, songPlayingIndex]);

  const onPause = useCallback(() => {
    liveEmojiRef.current?.onPauseCallback();
    bulletRef.current?.onPauseCallback();
  }, [liveEmojiRef, bulletRef]);

  const playSong = useCallback(
    (index: number) => {
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
    },
    [updatePlayCount, audio, onPause, onPlay, songPlayingIndex, userSongs]
  );

  const onClickPrevSong = useCallback(() => {
    let newSongIndex = songPlayingIndex - 1;
    if (newSongIndex < 0) {
      newSongIndex = userSongs.length - 1;
    }
    playSong(newSongIndex);
    setAmountOnline(0);
  }, [playSong, songPlayingIndex, userSongs.length]);

  const onClickNextSong = useCallback(() => {
    let newSongIndex = songPlayingIndex + 1;
    if (newSongIndex >= userSongs.length) {
      newSongIndex = 0;
    }
    playSong(newSongIndex);
    setAmountOnline(0);
  }, [playSong, songPlayingIndex, userSongs.length]);

  const onSongEnd = useCallback(() => {
    setIsPlaying(false);
    onPause();
    if (points > 0) {
      setDisplayingScoreModal(true);
    }
  }, [points, onPause]);

  useEffect(() => {
    if (audio === null) return;
    audio.addEventListener("ended", onSongEnd);
  }, [audio, onSongEnd]);

  const onTogglePlaySong = useCallback(() => {
    if (userSongs.length && !isPlaying) {
      if (songPlayingIndex !== -1) {
        playSong(songPlayingIndex);
      }
    } else if (audio && isPlaying) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [userSongs, isPlaying, playSong, audio, songPlayingIndex]);

  const convertedSong = useMemo<{
    url: string;
    artist: string;
    songName: string;
  }>(() => {
    if (song) {
      return {
        url: song.url,
        artist: song.authorName,
        songName: song.songName,
      };
    } else {
      return {
        url: "",
        artist: "",
        songName: "",
      };
    }
  }, [song]);

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

      if (liveEmojiRef.current) {
        liveEmojiRef.current.addEmoji(key);
      }
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

      <div
        ref={playerBodyRef}
        className="player-body"
        onMouseMove={onMouseMove}
      >
        {isCollaborating && (
          <UserCursors
            userLocations={userLocations}
            userProfiles={userProfiles}
          />
        )}

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
          <>
            <div className="collaboration-container">
              <div style={{ display: "flex" }}>
                <div>collaboration</div>
                <Switch
                  color="primary"
                  value={isCollaborating}
                  onChange={onChangeCollaboration}
                />
              </div>
              {isCollaborating && (
                <div style={{ background: "white", padding: 5 }}>
                  online: {amountOnline}
                </div>
              )}
            </div>
            <LiveEmojiSection
              youtubeRef={isYoutube ? youtubeRef : undefined}
              ref={liveEmojiRef}
              onChangePoints={setPoints}
              scores={song?.highscores}
            />
          </>
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

interface IUserCursorsProps {
  userLocations: IUserLocations;
  userProfiles: IUserProfiles;
}

const UserCursors = (props: IUserCursorsProps) => {
  return (
    <>
      {Object.entries(props.userLocations).map(([key, value]) => {
        const { x, y } = value;

        if (!props.userProfiles[key]) {
          return null;
        }
        const { avatar, name } = props.userProfiles[key];

        return (
          <div
            style={{ transform: `translate(${x}px, ${y}px)` }}
            className="user-connection-cursor"
            key={key}
          >
            <img src={avatarMap[avatar]} alt="avatar" />
            <div>{name}</div>
          </div>
        );
      })}
    </>
  );
};
