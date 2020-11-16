import cn from 'classnames';
import React from "react";
import "./App.scss";
import { FileDropTarget } from "./components/file-drop-target/file-drop-target";

export default function App() {
  let outRef = React.useRef();
  let [out, setOut] = React.useState(null);
  let [isImage, setIsImage] = React.useState(false);

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
    const reader = new FileReader();
    reader.addEventListener('load', () => {
      setOut(reader.result);
      setIsImage(file.type.match(/image\//));
    }, false);

    reader.readAsDataURL(file);
  };

  React.useEffect(() => {
    if (out && outRef.current) {
      selectNode(outRef.current);
    }
  }, [out]);

  React.useEffect(() => {
    let pasteHandler = event => {
      let clipboardData = event.clipboardData;
      if (clipboardData.files && clipboardData.files.length) {
        // TODO: check for png/gif?
        processFile(clipboardData.files[0]);
      } else {
        for (let item of Array.from(clipboardData.items).filter(({type}) => type == 'text/plain')) {
          item.getAsString(str => processText(str));
          break;
        }
      }
    };

    window.addEventListener("paste", pasteHandler, false);
    return () => window.removeEventListener("paste", this._pasteHandler, false);
  }, []);

  return (
    <FileDropTarget
        className={cn('main', {
          'is-zero': !out,
          'is-image': isImage,
        })}
        regex={/\.(png|webp|jpg|svg|txt)$/}
        invalidFileMessage="Bad file"
        onDrop={file => processFile(file)}>
      {out && <>
        <div className="output"
          onClick={ () => selectNode(outRef.current) }>
          <div className="output-main">
            <h2>Here's your Data URL!</h2>
            <div className="output-data-url" ref={outRef}>{out}</div>
          </div>
        </div>
      </>}
      {out && isImage && <div className="preview-image">
        <img src={out} />
      </div>}
      <div className='dropzone'>
        {out && <>
          <h1>Drop, paste or select another file</h1>
        </>}
        {!out && <div className="copy">
          <h1>Drop, paste or select a file</h1>
          <p>
            You'll get a Data URL with the file's contents
            to use in an <code>&lt;img&gt;</code> tag, a CSS <code>url(...)</code>,
            etc.
          </p>
        </div>}
        <input type="file"
          onChange={ evt => {
            processFile(evt.target.files[0]);
            evt.target.value = null;
          }} />
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
