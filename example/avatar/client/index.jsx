import React, { Component } from 'react';
import './index.scss';

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      version: 'unknown',
      message: ''
    };
  }

  componentDidMount() {
    fetch('/__data/getVersion', { method: 'POST' })
      .then(response => response.json())
      .then(json => {
        this.setState({ version: json.model.version });
      });
    fetch('/__data/throwError', { method: 'POST' })
      .then(response => response.json())
      .then(json => {
        this.setState({ message: json.error });
      });
  }

  render() {
    const { version, message } = this.state;
    return (
      <div className='container'>
        <h1>epii minion</h1>
        <h2>{version}</h2>
        <p>{message}</p>
        <p><a href='/__data/accessFile' target='_blank'>accessFile</a></p>
      </div>
    );
  }
}