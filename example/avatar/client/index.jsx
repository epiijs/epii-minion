import React, { Component } from 'react';
import './index.scss';

export default class extends Component {
  constructor(props) {
    super(props);
    this.state = {
      version: 'unknown'
    };
  }

  componentDidMount() {
    // epiiQL only support POST
    fetch('/__/data/getVersion', { method: 'POST' })
      .then(response => response.json())
      .then(json => {
        this.setState({ version: json.version });
      });
  }

  render() {
    const { version } = this.state;
    return (
      <div>
        <h1>EPII Minion</h1>
        <h2>{version}</h2>
      </div>
    );
  }
}