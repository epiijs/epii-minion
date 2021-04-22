import React, { useState, useEffect, } from 'react';
import './index.scss';

export default function Page() {
  const [version, setVersion] = useState('unknown');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/__data/getVersion', { method: 'POST' })
      .then(response => response.json())
      .then(json => {
        setVersion(json.model.version);
      });
  }, []);

  const throwError = () => {
    return fetch('/__data/throwError', {
      method: 'POST',
      body: JSON.stringify({ value: Math.random(), }),
    })
      .then(response => response.json())
      .then(json => setMessage(json.error));
  }
  
  return (
    <div className='container'>
      <h1>@epiijs/minion</h1>
      <h2>{version}</h2>
      <ul>
        <li><a onClick={e => throwError()}>{message || 'throwError'}</a></li>
        <li><a href='/__data/accessFile' target='_blank'>accessFile</a></li>
      </ul>
    </div>
  );
}