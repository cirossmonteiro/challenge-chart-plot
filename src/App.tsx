import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { start } from 'repl';
import { Line } from '@reactchartjs/react-chart.js'

interface IBasicLine {
  type: 'start' | 'data' | 'span' | 'stop',
  timestamp: number,
}

interface IStart extends IBasicLine {
  select: string[],
  group: string[]
}

interface ISpan extends IBasicLine {
  begin: number,
  end: number
}

interface IData extends IBasicLine {
  [key: string]: any
}

interface IStop extends IBasicLine {

}

type TGenericLine = IStart | ISpan | IData | IStop;


interface IState {
  entryData: string,
  currentIndex: number,
  plotData: {
    labels: string[],
    datasets: { label: string, data: number[] }[]
  },
  begin: number | null,
  end: number | null,
  groups: { [key: string]: string[] },
  stopped: boolean,
  groupNames: string[]
  valueNames: string[],
}

const initialState: IState = {
  entryData: '',
  currentIndex: 0,
  plotData: {
    labels: [],
    datasets: []
  },
  begin: null,
  end: null,
  groups: {},
  stopped: true,
  groupNames: [],
  valueNames: []
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

const generateInputData = async (concatString: (message: string) => void, dt: number = 500, iterations: number = 10) => {
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

  const spanData = {
    type: 'span',
    timestamp: currentTimestamp,
    begin: currentTimestamp,
    end: currentTimestamp+5*1000
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

  for(let k = 0; k < iterations; k++) {
    const arrayToSend = iterate();
    // const arrayToSend = [startData, ...combinations, stopData];
    const message = arrayToSend.map(item => JSON.stringify(item)).join('\n');
    concatString(message);
    await sleep(dt);
  }

  const message = JSON.stringify(stopData);
  concatString(message);

}

// const generateInputDataWrapper = (function: any) => 


const App = () => {

  const [state, setState] = useState<IState>(initialState);
  const { entryData } = state;

  useEffect(() => {
    generateInputData((message: string) => setState(state => ({...state, entryData: state.entryData+(state.entryData ? '\n' : '')+message})), 1000);
  }, []);

  useEffect(() => {
    // const datasets = [];
    // const groups: any = {};
    // console.log(113, entryData, entryData.split('\n'));

    setState(state => {
      let { currentIndex, groups, plotData, begin, end, stopped, valueNames, groupNames } = state;
      let { labels, datasets } = plotData;

      if (entryData === '')
        return state;

      const lines: TGenericLine[] = entryData.slice(currentIndex).split('\n')
                      .filter(line => line !== '').map(line => JSON.parse(line));
      if (lines.length === 0)
        return state;

      // let startData: any = {}, groups: any = {}, datasets: any = {}, begin: number= -1, end: number = -1, labels: number[] = [], stopped = false;
      lines.forEach(line => {
        switch(line.type) {

          case 'start':
            
            // const startData = { ...line };
            groups = {};
            // begin = line.timestamp;
            // end = line.timestamp;
            // labels = [];
            groupNames = (line as IStart).group.slice(0);
            groupNames.forEach((g: string) => {
              groups[g] = [];
            });
            // plotData = { ...initialState.plotData };
            valueNames = (line as IStart).select.slice(0);
            plotData = {
              labels: [],
              datasets: []
            }
            stopped = false;
            break;

          case 'span':
            begin = (line as ISpan).begin;
            end = (line as ISpan).end;
            break;

          case 'data':
            if (begin && end && (line.timestamp < begin || line.timestamp > end) || stopped)
              break;
            groupNames.forEach((g: string) => {
              if (!groups[g].includes((line as IData)[g])) {
                groups[g].push((line as IData)[g]);
              }
            });
            // TODO: break nameValue by underscores and apply capital letters
            // const lineNames = valueNames.map((valueName: string) => [...groupNames.map((g: string) => (line as IData)[g]), valueName].join(' '));
            console.log(232, valueNames);
            for (const valueName of valueNames) {
              const lineName = [...groupNames.map((g: string) => (line as IData)[g]), valueName].join(' ');
              console.log(242, groupNames, lineName);
              const index = datasets.findIndex(dataset => dataset.label === lineName);
              if (index === -1) {
                datasets.push({
                  label: lineName,
                  data: []
                });
              } else {
                datasets[index].data.push((line as IData)[valueName]);
              }
            }
            // lineNames.forEach(lineName => {
            //   const index = datasets.findIndex(dataset => dataset.label === lineName);
            //   const index2 = valueNames
            //   if (index === -1) {
            //     datasets.push({
            //       label: lineName,
            //       data: []
            //     })
            //   }
            // })
            if (!labels.includes(String(line.timestamp)))
              labels.push(String(line.timestamp));
            break;

          case 'stop':
            stopped = true;
            break;

          default:
            console.error('Bad type: ', line.type);
            break;
        }
        
      });
      plotData = { labels, datasets };
      return {
        ...state,
        currentIndex: entryData.length,
        groups, groupNames, valueNames,
        begin, end,
        plotData, stopped
      }
    });


    // setState(state => ({...state, currentIndex: entryData.length}));

    // return {
    //   // type: 'line',
    //   labels: labels.map((time: number) => (new Date(time).toISOString())),
    //   datasets: Object.keys(datasets).map((key: string) => ({label: key, data: datasets[key]}))
    // };

  }, [entryData]);

  // console.log(22, data);
  const options = {};

  console.log(293, state.plotData);

  return (
    <div className="app-root">
      <textarea value={entryData} onChange={e => setState(state => ({...state, entryData: e.target.value}))}/>
      <Line type='line' data={state.plotData} options={options} />
    </div>
  );
}

export default App;