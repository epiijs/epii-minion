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
    // epiiQL only support POST
    fetch('/__/data/getVersion', { method: 'POST' })
      .then(response => response.json())
      .then(json => {
        this.setState({ version: json.model.version });
      });
    fetch('/__/data/throwError', { method: 'POST' })
      .then(response => response.json())
      .then(json => {
        console.error('query error', json.state);
        this.setState({ message: json.error });
      });
  }

  render() {
    const { version, message } = this.state;
    return (
      <div className='container'>
        <h1>EPII Minion</h1>
        <h2>{version}</h2>
        <p>{message}</p>
      </div>
    );
  }
}