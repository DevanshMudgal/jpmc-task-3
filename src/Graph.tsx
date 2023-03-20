import React, { Component } from 'react';
import { Table, TableData } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    //to track ratios bw abc and def stocks
    // also to track the moment the upper and lower bounds are crossed, so trigger alert
    const schema = {
      price_abc: 'float',
      price_def: 'float',
      ratio: 'float',
      upper_bound: 'float',
      lower_bound: 'float',
      trigger_alert: 'float',
      timestamp: 'date',
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      // not using col pivots as we need ratios bw 2 stocks and not their prices
      //elem.setAttribute('column-pivots', '["stock"]');
      // row-pivots - map each datapoint based on its timestamp
      elem.setAttribute('row-pivots', '["timestamp"]');
      // col - to focus on a particular part of a datapoint's data along y-axis
      elem.setAttribute('columns', '["ratio","lower_bound","upper_bound","trigger_alert"]');
      // aggregate - consolidate duplicate data into one data point
      elem.setAttribute('aggregates', JSON.stringify({
        price_abc: 'avg',
        price_def: 'avg',
        ratio: 'avg',
        timestamp: 'distinct count',
        upper_bound: 'avg',
        lower_bound: 'avg',
        trigger_alert: 'avg',
      }));
    }
  }

  componentDidUpdate() {
    if (this.table) {
      this.table.update([
        DataManipulator.generateRow(this.props.data),
      ] as unknown as TableData);
    }
  }
}

export default Graph;
