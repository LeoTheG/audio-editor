import { ITrack, UserFiles } from "./types";

import WaveformData from "waveform-data";
import audioBufferToWav from "./audioBufferToWav";
import { useLocation } from "react-router-dom";

// @ts-ignore
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioContext = new AudioContext();

export function concatBuffer(buffers: AudioBuffer[]) {
  const buffLength = buffers.length;
  const channels = [];
  let totalDuration = 0;

  for (var a = 0; a < buffLength; a++) {
    channels.push(buffers[a].numberOfChannels); // Store all number of channels to choose the lowest one after
    totalDuration += buffers[a].duration; // Get the total duration of the new buffer when every buffer will be added/concatenated
  }

  var numberOfChannels = channels.reduce(function (a, b) {
    return Math.min(a, b);
  }); // The lowest value contained in the array channels
  var tmp = audioContext.createBuffer(
    numberOfChannels,
    audioContext.sampleRate * totalDuration,
    audioContext.sampleRate
  ); // Create new buffer

  for (var b = 0; b < numberOfChannels; b++) {
    var channel = tmp.getChannelData(b);
    var dataIndex = 0;

    for (var c = 0; c < buffers.length; c++) {
      try {
        channel.set(buffers[c].getChannelData(b), dataIndex);
      } catch (e) {
        console.log(buffers[c].getChannelData(b));
        console.log(dataIndex);
        console.log(buffers.length);
        console.log(c);
        console.error(e);
      }
      dataIndex += buffers[c].length; // Next position where we should store the next buffer values
    }
  }
  return tmp;
}

export const convertAudioBufferToBlob = (buffers: AudioBuffer[]) => {
  const concat = concatBuffer(buffers);
  // const buff = concat.getChannelData(1);

  const blob = new Blob([audioBufferToWav(concat)], {
    type: "audio/wav",
  });

  return blob;
};

export const convertTracksToBlob = (tracks: ITrack[], userFiles: UserFiles) => {
  const toConcatFiles: AudioBuffer[] = tracks.map(
    (track) => userFiles[track.referenceId].audioBuffer
  );
  const blob = convertAudioBufferToBlob(toConcatFiles);

  return blob;
};

export function downloadFromUrl(url: string) {
  // Construct the <a> element
  var link = document.createElement("a");
  link.download = "adventure-audio.wav";
  // Construct the uri
  //   var uri = 'data:text/csv;charset=utf-8;base64,' + someb64data
  link.href = url;
  document.body.appendChild(link);
  link.click();
  // Cleanup the DOM
  document.body.removeChild(link);
}

export function useParam(paramName: string) {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  return params.get(paramName);
}

export const isiOS = () => {
  return (
    [
      "iPad Simulator",
      "iPhone Simulator",
      "iPod Simulator",
      "iPad",
      "iPhone",
      "iPod",
    ].includes(navigator.platform) ||
    // iPad on iOS 13 detection
    (navigator.userAgent.includes("Mac") && "ontouchend" in document)
  );
};

export const convertBufferToWaveformData = (
  audioBuffer: AudioBuffer,
  scale: number
) => {
  const options = {
    audio_context: audioContext,
    audio_buffer: audioBuffer,
    scale,
  };

  return new Promise<{ waveform: WaveformData; audioBuffer: AudioBuffer }>(
    (resolve, reject) => {
      WaveformData.createFromAudio(options, (err, waveform) => {
        if (err) {
          reject(err);
        } else {
          resolve({ waveform, audioBuffer });
        }
      });
    }
  );
};

export const createWaveform = async (
  file: File,
  scale: number
): Promise<{ waveform: WaveformData; audioBuffer: AudioBuffer }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const buffer = reader.result as Buffer;

      audioContext.decodeAudioData(buffer, async (audioBuffer) => {
        const waveformData = await convertBufferToWaveformData(
          audioBuffer,
          scale
        );
        resolve(waveformData);
      });
    };
    reader.readAsArrayBuffer(file);
  });
};
