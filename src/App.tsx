import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { start } from 'repl';
import { Line } from '@reactchartjs/react-chart.js'


interface IState {
  entryData: string
}

const initialState: IState = {
  entryData: ''
}

const sleep = (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const os = ['linux', 'mac'];
const browser = ['chrome', 'firefox'];
const groups: any = { os, browser };

const randInterval = (a: number, b: number) => (b-a)*Math.random()+a;

const randInt = (a: number, b: number) => Math.round(randInterval(a,b));

const newArray = (size: number) => Array.apply(null, Array(size));

const generateInputData = async (concatString: (message: string) => void, dt: number) => {
  const numGroups = randInt(2,2);
  const numValues = randInt(2,2); // storing values associated to each object create above
  const group: any = {}; // storing all options for all groups
  const groups = newArray(numGroups).map((_, index) => `g${index}`); // array with names of groups - eg.: 'OS', 'browser'
  const nameValues = newArray(numValues).map((_, index) => `v${index}`);
  const currentTimestamp = Date.now();

  

  for (const g of groups) {
    group[g] = newArray(randInt(2,2)).map((_, index) => `${g}option${index}`); // initializing a randomly-sized array for options of a group
  }

  const startData = {
    type: 'start',
    timestamp: currentTimestamp,
    select: nameValues,
    group: groups.slice(0)
  }

  concatString(JSON.stringify(startData));

  console.log(41, 'Groups: ', groups);

  console.log(42, 'Group object: ', group);

  const iterate = () => {
    const timestamp = Date.now();
      // each line is a combination of groups
    let combinations: any[] = [{type: 'data'}];
    // let combinations: any[] = group[groups[0]].map((option: string) => ({[groups[0]]: option}));
    for (let k = 0; k < numGroups; k++) {
      let newCombinations: any[] = [];
      const currentGroup = group[groups[k]];
      for (const option of currentGroup) {
        newCombinations = newCombinations.concat(combinations.map((combination: any) => ({...combination, [groups[k]]: option})));
      }
      combinations = newCombinations.slice(0);
    }

    console.log(43, 'Combinations: ', combinations.length);

    // assigning values and a timestamp for each line
    for (let k = 0; k < combinations.length; k++) {
      for (const nameValue of nameValues) {
        combinations[k][nameValue] = randInterval(0,5);
      }
      // combinations[k].timestamp = (1614813534 + randInt(-1000, 1000))*1000;
      combinations[k].timestamp = timestamp;
    }

    return combinations;
  }

  

  // const numSpans = randInt(0, Math.floor(combinations.length/3));
  // const spans = (numSpans === 0 ? [] : [randInt(1, combinations.length-1)]);
  // for (let k = 1; k < numSpans; k++)
  //   spans.push(randInt(spans[spans.length-1]+1, combinations.length-1));

  // spans.forEach(index => combinations.splice(index, 0, ({
  //   type: 'span',
  //   timestamp: currentTimestamp,
  //   begin: currentTimestamp + randInt(0, 100)*1000,
  //   end: currentTimestamp + randInt(101, 200)*1000
  // })));

  const stopData = {
    type: 'stop',
    timestamp: currentTimestamp + 201*1000
  }

  while(true) {
    const arrayToSend = iterate();
    // const arrayToSend = [startData, ...combinations, stopData];
    const message = arrayToSend.map(item => JSON.stringify(item)).join('\n');
    concatString(message);
    await sleep(dt);
  }
}

// const generateInputDataWrapper = (function: any) => 


const App = () => {

  const [state, setState] = useState<IState>(initialState);
  const { entryData } = state;

  useEffect(() => {
    generateInputData((message: string) => setState(state => ({...state, entryData: state.entryData+(state.entryData ? '\n' : '')+message})), 1000);
  }, []);

  const data = useMemo(() => {
    // const datasets = [];
    // const groups: any = {};
    // console.log(113, entryData, entryData.split('\n'));
    if (entryData === '')
      return;      
    const lines = entryData.split('\n').map(line => JSON.parse(line));
    if (lines.length === 0)
      return;
    let startData: any = {}, groups: any = {}, datasets: any = {}, begin: number= -1, end: number = -1, labels: number[] = [], stopped = false;
    lines.forEach(line => {
      switch(line.type) {

        case 'start':
          startData = { ...line };
          groups = {};
          datasets = {};
          begin = 0;
          end = 0;
          labels = [];
          startData.group.forEach((g: string) => {
            groups[g] = [];
          });
          break;

        case 'span':
          begin = line.begin;
          end = line.end;
          break;

        case 'data':
          if (begin && end && (line.timestamp < begin || line.timestamp > end) || stopped)
            break;
          startData.group.forEach((g: string) => {
            if (!groups[g].includes(line[g])) {
              groups[g].push(line[g]);
            }
          });
          // TODO: break nameValue by underscores and apply capital letters
          const lineNames = startData.select.map((nameValue: string) => [...startData.group.map((g: string) => line[g]), nameValue].join(' '));
          lineNames.forEach((lineName: string, index: number) => {
            if (datasets[lineName]) {
              datasets[lineName].push(line[startData.select[index]]);
            } else {
              datasets[lineName] = [line[startData.select[index]]];
            }
          });
          if (!labels.includes(line.timestamp))
            labels.push(line.timestamp);
          break;

        case 'stop':
          break;

        default:
          console.error('Bad type: ', line.type);
          break;
      }
      
    });

    return {
      // type: 'line',
      labels: labels.map((time: number) => (new Date(time).toISOString())),
      datasets: Object.keys(datasets).map((key: string) => ({label: key, data: datasets[key]}))
    };

  }, [entryData]) || {};

  // console.log(22, data);
  const options = {};

  return (
    <div className="app-root">
      <textarea value={entryData} onChange={e => setState(state => ({...state, entryData: e.target.value}))}/>
      <Line type='line' data={data} options={options} />
    </div>
  );
}

export default App;
