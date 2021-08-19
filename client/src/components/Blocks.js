import React, { Component } from 'react';
import Block from './Block';

import { Link } from 'react-router-dom';

class Blocks extends Component {
  state = { blocks: [] };

  componentDidMount() {
    fetch(`${document.location.origin}/api/blocks`)
      .then(response => response.json())
      .then(json => this.setState({ blocks: json }));
  }

  render() {
    console.log('this.state', this.state);
      
    return (
      <div>
        <h3>Blocks</h3>
        <a href="/">Home</a>
        {
          this.state.blocks.map(block => {
            return (
              <Block key={block.mixHash} block={block} />
            );
          })
        }
      </div>
    );
  }
}

export default Blocks;