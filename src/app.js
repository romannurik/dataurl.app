import cn from 'classnames';
import React from "react";
import { Clipboard as ClipboardIcon, Check as CheckIcon, File as FileIcon } from 'react-feather';
import "./app.scss";
import { FileDropTarget } from "./components/file-drop-target/file-drop-target";
import filesize from 'filesize';

const WARNING_URL_LENGTH = 500 /* KB */ * 1024;
const ERROR_FILE_SIZE = 2 /* MB */ * 1024 * 1024;

// do this at the root to avoid flash of un-layout'd content
(() => {
  let update = () => document.body.style.setProperty('--vh', `${window.innerHeight / 100}px`);
  update();
  window.addEventListener('resize', update, false);
})();

export default function App() {
  let outRef = React.useRef();
  let [out, setOut] = React.useState(null);
  let [isLoading, setIsLoading] = React.useState(false);
  let [isConfirmingCopy, setIsConfirmingCopy] = React.useState(false);
  let [isImage, setIsImage] = React.useState(false);

  React.useEffect(() => {
    if (out && outRef.current) {
      selectNode(outRef.current);
    }
  }, [out]);

  React.useEffect(() => {
    let pasteHandler = event => {
      if (isLoading) {
        return;
      }

      let clipboardData = event.clipboardData;
      if (clipboardData.files && clipboardData.files.length) {
        processFile(clipboardData.files[0]);
      } else {
        let textItem = Array.from(clipboardData.items).find(({type}) => type === 'text/plain');
        if (textItem) {
          textItem.getAsString(str => processText(str));
        }
      }
    };

    window.addEventListener("paste", pasteHandler, false);
    return () => window.removeEventListener("paste", pasteHandler, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  let processText = str => {
    let type = 'text/plain';
    let isImage = false;
    if (str.match(/<html/)) {
      type = 'text/html';
    } else if (str.match(/<svg/)) {
      type = 'image/svg+xml';
      isImage = true;
    }
    setOut(`data:${type};base64,${btoa(str)}`);
    setIsImage(isImage);
  };

  let processFile = file => {
    if (file.size > ERROR_FILE_SIZE) {
      alert(`The file you chose is too big (${filesize(file.size)}). ` +
            `Get your file down to ${filesize(ERROR_FILE_SIZE)} and try again.`);
      return;
    }

    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setIsLoading(false);
      setOut(reader.result);
      setIsImage(file.type.match(/image\//));
    }, false);

    reader.addEventListener('error', (e) => {
      setIsLoading(false);
      alert(`Couldn't load the file. According to your browser: "${reader.error.message}"`);
    }, false);

    setIsLoading(true);
    reader.readAsDataURL(file);
  };

  let setClipboard = async () => {
    if (out) {
      await navigator.clipboard.writeText(out);
      if (App.ccTimeout_) {
        clearTimeout(App.ccTimeout_);
      }

      App.ccTimeout_ = setIsConfirmingCopy(true);
      setTimeout(() => {
        setIsConfirmingCopy(false);
        delete App.ccTimeout_;
      }, 1500);
    }
  };

  return (
    <FileDropTarget
        className={cn('main', {
          'is-zero': !out,
          'is-image': isImage,
        })}
        disabled={isLoading}
        regex={/.*/}
        invalidFileMessage="Bad file"
        onDrop={file => processFile(file)}>
      {out && <>
        <div className="output">
          <div className="output-main">
            <div className="output-header">
              {out.length < WARNING_URL_LENGTH && <h2>Here's your data URL:</h2>}
              {out.length >= WARNING_URL_LENGTH && <h2 className="warning">
                Your data URL might be too long ({ filesize(out.length) }).
                {isImage && <>{' '}
                  Try <a href="https://squoosh.app/"
                    target="_blank"
                    rel="noreferrer">Squooshing</a> first.
                </>}
              </h2>}
              <button
                  disabled={isConfirmingCopy}
                  className={cn('btn', {'is-confirming': isConfirmingCopy})}
                  onClick={ setClipboard }>
                {isConfirmingCopy && <CheckIcon className="btn-confirming-icon" />}
                <div className="btn-content">
                  <ClipboardIcon className="btn-start-icon" />
                  Copy
                </div>
              </button>
            </div>
            <div className="output-data-url"
                ref={outRef}
                onClick={ () => selectNode(outRef.current) }>{out}</div>
          </div>
        </div>
      </>}
      {out && isImage && <div className="preview-image">
        <img src={out} alt="Preview" />
      </div>}
      <div className='dropzone' disabled={isLoading}>
        {out && <>
          <FileIcon />
          <h1>Drop, paste or select another file</h1>
        </>}
        {!out && <div className="copy">
          <FileIcon />
          <h1>Drop, paste or select a file</h1>
          <p>
            You'll get a <code>data:</code> URL with the file's contents
            to use in an <code>&lt;img&gt;</code> tag, a CSS <code>url(...)</code>,
            etc. This is all done in your browser &mdash; your file is never
            uploaded anywhere.
          </p>
        </div>}
        <input type="file"
          title=" "
          onChange={ evt => {
            processFile(evt.target.files[0]);
            evt.target.value = null;
          }}
          disabled={isLoading} />
      </div>
    </FileDropTarget>
  );
}

function selectNode(node) {
  if (document.selection) {
    let range = document.body.createTextRange();
    range.moveToElementText(node);
    range.select();
  } else if (window.getSelection) {
    let range = document.createRange();
    range.selectNode(node);
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(range);
  }
}
