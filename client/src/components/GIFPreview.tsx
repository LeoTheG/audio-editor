import React, { useState, useEffect, useContext } from "react";
import "./css/GIFPreview.css";
import {
  TextField,
  IconButton,
  CircularProgress,
  Tooltip,
} from "@material-ui/core";
import CreateIcon from "@material-ui/icons/Create";
import DoneIcon from "@material-ui/icons/Done";
import { AppStateContext } from "../contexts/appContext";
import { Share } from "@material-ui/icons";
import { FirebaseContext } from "../contexts/firebaseContext";

export const GIFPreview = () => {
  const [authorName, setAuthorName] = useState("");
  const [songName, setSongName] = useState("");
  const appStateContext = useContext(AppStateContext);
  const firebaseContext = useContext(FirebaseContext);
  const [songUrl, setSongUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [songId, setSongId] = useState("");

  useEffect(() => {
    if (appStateContext.shareSong) {
      const newSongUrl = URL.createObjectURL(appStateContext.shareSong);

      setSongUrl(newSongUrl);
    }
  }, [appStateContext.shareSong]);

  if (songId) {
    const sharedSongUrl = `${document.location.href}player?id=${songId}`;
    return (
      <div className="width-100-centered">
        <div className="gif-preview-container">
          <div style={{ fontSize: "1.2em", marginBottom: 10 }}>
            Successful upload!
          </div>
          <div>
            <div>Listen to your song with this shareable link:</div>
            <div style={{ marginTop: 10 }}>
              <a target="_blank" rel="noopener noreferrer" href={sharedSongUrl}>
                {sharedSongUrl}
              </a>
              {}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="width-100-centered">
      <div className="gif-preview-container">
        <div className="gif-preview-title">preview</div>
        <div className="add-gif-container">
          <div>add gif</div>
        </div>

        <div>
          <EditableTextfield onChange={setAuthorName} label="author name" />
          <EditableTextfield onChange={setSongName} label="song name" />
        </div>

        <audio controls src={songUrl} />

        {isLoading ? (
          <CircularProgress />
        ) : (
          <Tooltip title="Share song">
            <IconButton
              onClick={() => {
                if (appStateContext.shareSong) {
                  setIsLoading(true);
                  firebaseContext
                    .uploadSong(appStateContext.shareSong, songName, authorName)
                    .then((id) => {
                      setSongId(id);
                      setIsLoading(false);
                    });
                }
              }}
            >
              <Share />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

interface IEditableTextFieldProps {
  onChange: (value: string) => void;
  label: string;
  //   initialValue?: string;
}

const EditableTextfield = (props: IEditableTextFieldProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState("");

  //   useEffect(() => {
  //     setValue(props.initialValue);
  //   }, [props.initialValue]);

  useEffect(() => {
    props.onChange(value);
  }, [value]);

  if (isEditing) {
    return (
      <div className="editable-textfield-container">
        <TextField
          value={value}
          onChange={(evt) => setValue(evt.target.value)}
          label={props.label}
        />
        <IconButton onClick={() => setIsEditing(false)}>
          <DoneIcon />
        </IconButton>
      </div>
    );
  } else {
    return (
      <div className="editable-textfield-container">
        <div style={{ marginRight: 15 }}>{props.label}:</div>
        <div
          style={{
            textDecoration: "underline",
            minWidth: 50,
            minHeight: 30,
          }}
        >
          {value.length ? value : "___________"}
        </div>
        <IconButton onClick={() => setIsEditing(true)}>
          <CreateIcon />
        </IconButton>
      </div>
    );
  }
};
