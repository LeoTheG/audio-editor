import "../css/UploadPage.css";

import { Button, TextField } from "@material-ui/core";
import React, { useContext, useState } from "react";

import { FirebaseContext } from "../contexts/firebaseContext";
import { useHistory } from "react-router-dom";

interface ISubmission {
  url: string;
  songId: string;
}

export const UploadPage = () => {
  const history = useHistory();
  const firebaseContext = useContext(FirebaseContext);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [latestSubmitted, setLatestSubmitted] = useState<ISubmission | null>(
    null
  );
  const [url, setUrl] = useState("");
  const [songId, setSongId] = useState("");
  const [error, setError] = useState<Error | null>(null);

  const submitVideo = () => {
    if (!isValidYouTubeURL(url)) {
      setError(new Error("Invalid YouTube URL: " + url));
      return;
    }

    if (!songId) {
      setError(new Error("No song ID submitted"));
      return;
    }

    setIsSubmitting(true);

    const trimmedURL = trimURL(url);

    firebaseContext
      .uploadYoutubeVideo(songId, trimmedURL)
      .then(() => {
        setIsSubmitting(false);
        setLatestSubmitted({ url: trimmedURL, songId });
        setUrl("");
        setSongId("");
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setIsSubmitting(false);
      });
  };

  const previewURL = `${window.location.origin}/#/youtube/${songId}`;

  return (
    <div className="upload-container">
      <div className="upload-button-container">
        <Button
          style={{
            minWidth: 20,
            color: "white",
            background: "grey",
            padding: 10,
            height: 50,
          }}
          variant="contained"
          onClick={() => history.push("/youtube")}
        >
          PLAYER
        </Button>
      </div>

      {error && <div className="upload-error">{error.message}</div>}
      {latestSubmitted && (
        <div className="upload-latest-submitted">
          success! uploaded
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`${window.location.origin}/#/youtube/${latestSubmitted.songId}`}
          >
            {`${window.location.origin}/#/youtube/${latestSubmitted.songId}`}
          </a>
        </div>
      )}
      <div>link youtube video</div>
      <TextField
        placeholder="YouTube URL"
        value={url}
        onChange={(evt) => setUrl(evt.target.value)}
        disabled={isSubmitting}
        style={{ width: 400, maxWidth: "100%" }}
      />
      <TextField
        placeholder="song id"
        value={songId}
        onChange={(evt) => setSongId(evt.target.value)}
        disabled={isSubmitting}
      />
      <Button variant="contained" disabled={isSubmitting} onClick={submitVideo}>
        submit
      </Button>

      <div className="upload-preview-url">
        url will look like:{" "}
        <div className="upload-preview-url-string">{previewURL}</div>
      </div>
    </div>
  );
};

const isValidYouTubeURL = (url: string): boolean => {
  //eslint-disable-next-line
  return /^(https?\:\/\/)?(www\.youtube\.com|youtu\.?be)\/.+$/.test(url);
};

const trimURL = (url: string): string => {
  const indexAmpersand = url.indexOf("&");
  if (indexAmpersand !== -1) {
    url = url.slice(0, indexAmpersand);
  }
  return url.trim();
};
