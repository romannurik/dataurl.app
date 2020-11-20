import cn from "classnames";
import React from "react";
import "./file-drop-target.scss";

export class FileDropTarget extends React.Component {
  state = {
    isActive: false
  };

  onDragEnter = ev => {
    if (this.props.disabled || !dragEventHasFile(ev)) {
      return;
    }

    ev.preventDefault();
    if (this.enterLeaveTimeout_) {
      clearTimeout(this.enterLeaveTimeout_);
      delete this.enterLeaveTimeout_;
    }
    this.setState({ isActive: true });
  };

  onDragLeave = ev => {
    ev.preventDefault();
    if (this.enterLeaveTimeout_) {
      clearTimeout(this.enterLeaveTimeout_);
    }
    this.enterLeaveTimeout_ = setTimeout(() => {
      this.setState({ isActive: false });
    }, 10);
  };

  onDragOver = ev => {
    ev.preventDefault();
    if (this.enterLeaveTimeout_) {
      clearTimeout(this.enterLeaveTimeout_);
      delete this.enterLeaveTimeout_;
    }

    if (dragEventHasFile(ev)) {
      ev.dataTransfer.dropEffect = "copy";
    } else {
      ev.dataTransfer.dropEffect = "none";
    }
  };

  onDrop = ev => {
    ev.stopPropagation();
    ev.preventDefault();
    if (this.props.disabled || !dragEventHasFile(ev)) {
      return;
    }

    let fileNameRegexp = this.props.regex || /.*/;

    this.setState({ isActive: false });
    if (ev.dataTransfer.files.length === 1 && ev.dataTransfer.files[0].name.match(fileNameRegexp)) {
      this.props.onDrop(ev.dataTransfer.files[0]);
    } else {
      alert(this.props.invalidFileMessage);
    }
  };

  render() {
    return (
      <div
        className={cn(this.props.className, "file-drop-target", {
          "is-active": this.state.isActive
        })}
        onDragEnter={this.onDragEnter}
        onDragLeave={this.onDragLeave}
        onDragOver={this.onDragOver}
        onDrop={this.onDrop}
      >
        {this.props.children}
      </div>
    );
  }
}

function dragEventHasFile(ev) {
  // .files isn't always populated seemingly
  return [...ev.dataTransfer.items].find(i => i.kind === 'file');
}
