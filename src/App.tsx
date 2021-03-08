import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './App.scss';
// import { Line } from '@reactchartjs/react-chart.js'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

interface IBasicLine {
  type: 'start' | 'data' | 'span' | 'stop',
  timestamp: string | number,
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
    labels: (number | string)[],
    datasets: { label: string, data: number[], borderColor?: string}[],
  },
  begin: number | null,
  end: number | null,
  groups: { [key: string]: string[] },
  stopped: boolean,
  groupNames: string[]
  valueNames: string[],
  dragging: boolean,
  dragHeight: number // unit %
}

const initialState: IState = {
  entryData: '',
  currentIndex: 0,
  plotData: {
    labels: [],
    datasets: [],
  },
  begin: null,
  end: null,
  groups: {},
  stopped: true,
  groupNames: [],
  valueNames: [],
  dragging: false,
  dragHeight: 30
}

const randomColor = () => {
  const letters = '0123456789ABCDEF';
  const color = '#' + [0,1,2,3,4,5].map(_ => letters[Math.floor(Math.random() * 16)]).join('');
  return color;
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

  const iterate = () => {
    const timestamp = Date.now();

    // each line in chart is a combination of groups with variable names
    let combinations: any[] = [{type: 'data'}];
    for (let k = 0; k < numGroups; k++) {
      let newCombinations: any[] = [];
      const currentGroup = group[groups[k]];
      for (const option of currentGroup) {
        newCombinations = newCombinations.concat(combinations.map((combination: any) => ({...combination, [groups[k]]: option})));
      }
      combinations = newCombinations.slice(0);
    }

    // assigning values and a timestamp for each line
    for (let k = 0; k < combinations.length; k++) {
      for (const nameValue of nameValues) {
        combinations[k][nameValue] = randInterval(0,5);
      }
      combinations[k].timestamp = timestamp;
    }

    return combinations;
  }

  const stopData = {
    type: 'stop',
    timestamp: currentTimestamp + 201*1000
  }

  for(let k = 0; k < iterations; k++) {
    const arrayToSend = iterate();
    const message = arrayToSend.map(item => JSON.stringify(item)).join('\n');
    concatString(message);
    await sleep(dt);
  }

  const message = JSON.stringify(stopData);
  concatString(message);

}


const App = () => {

  const [state, setState] = useState<IState>(initialState);
  const { entryData } = state;

  const startGeneratingData = useCallback(() => {
    generateInputData((message: string) =>
      setState(state => ({...state, entryData: state.entryData+(state.entryData ? '\n' : '')+message})), 1000);
  }, []);

  useEffect(() => {
    startGeneratingData();
  }, []);

  useEffect(() => {

    setState(state => {
      let { currentIndex, groups, plotData, begin, end, stopped, valueNames, groupNames } = state;
      let { labels, datasets } = plotData;

      if (entryData === '')
        return state;

      const lines: TGenericLine[] = entryData.slice(currentIndex).split('\n')
                      .filter(line => line !== '').map(line => JSON.parse(line));
      if (lines.length === 0)
        return state;

      lines.forEach(line => {
        switch(line.type) {

          case 'start':
            groups = {};
            groupNames = (line as IStart).group.slice(0);
            groupNames.forEach((g: string) => {
              groups[g] = [];
            });
            valueNames = (line as IStart).select.slice(0);
            plotData = {
              labels: [],
              datasets: [],
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
            for (const valueName of valueNames) {
              const prettyValueName = valueName.split('_').join(' ');
              const lineName = [...groupNames.map((g: string) => (line as IData)[g]), prettyValueName].join(' ');
              const index = datasets.findIndex(dataset => dataset.label === lineName);
              if (index === -1) {
                datasets.push({
                  label: lineName,
                  data: [],
                  borderColor: randomColor()
                });
              } else {
                datasets[index].data.push((line as IData)[valueName]);
              }
            }
            if (!labels.includes(line.timestamp)) {
              // labels.push(line.timestamp);
              let hour = new Date(line.timestamp).getHours(),
                    minute = new Date(line.timestamp).getMinutes(),
                    second = new Date(line.timestamp).getSeconds();
              labels.push(`${hour < 10 ? `0${hour}` : hour}:${minute < 10 ? `0${minute}` : minute}:${second < 10 ? `0${second}` : second}`); 
            }
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

  }, [entryData]);

  const legendHTML = useMemo(() => state.plotData.datasets.map(dataset => (
    <div className="legend-item d-flex align-items-center mb-1">
      <div className="legend-circle mr-2" style={{background: dataset.borderColor}}></div>
      <span style={{color: dataset.borderColor}}>{dataset.label}</span>
    </div>
  )), [state.plotData]);

  const plotData2 = useMemo(() => {
    if (state.plotData.datasets.length === 0)
      return []
    const data = [], nPoints = state.plotData.datasets[0].data.length;
    for (let k = 0; k < nPoints; k++) {
      const point: any = {name: state.plotData.labels[k]};
      state.plotData.datasets.forEach(dataset => {
        point[dataset.label] = dataset.data[k];
      });
      data.push(point);
    }
    return data
  }, [state.plotData]);

  const onDrag = useCallback(e => {
    if (state.dragging && e.clientY !== 0)
      setState(state => ({...state, dragHeight: (e.clientY)/window.screen.availHeight*100}));
  }, [state.dragging]);

  return (
    <div className="app-root">
      <div className="app-header d-flex align-items-center">
        <h1>Ciro's Challenge</h1>
      </div>
      <div className="app-body" onDrop={_ => setState(state => ({...state, dragging: false}))}>
        <div className="app-textarea-container d-flex" style={{height: `${state.dragHeight}%`}}>
          <div className="app-textarea-sidebar"></div>
          <div className="app-textarea-holder">
            <textarea value={entryData} onChange={e => setState(state => ({...state, entryData: e.target.value}))}/>
          </div>
          <div className="drag-box d-flex flex-column justify-content-center align-items-center" draggable="true"
            onDrag={onDrag} onDragStart={_ => setState(state => ({...state, dragging: true}))}>
            <div className="drag-line mb-1"></div>
            <div className="drag-line"></div>
          </div>
        </div>
        <div className="app-graph d-flex" style={{maxHeight: `${100-state.dragHeight}%`, height: `${100-state.dragHeight}%`}}>
          <div className="app-graph-holder">
            <ResponsiveContainer>
              <LineChart data={plotData2}>
                <XAxis dataKey="name" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip />
                {state.plotData.datasets.map(dataset => <Line type="monotone" dataKey={String(dataset.label)} stroke={dataset.borderColor} />)}
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="legend-container d-flex flex-column">{legendHTML}</div>
        </div>
      </div>
      <div className="app-footer pl-5 d-flex align-items-center">
        <button className="btn btn-primary" onClick={startGeneratingData} disabled={!state.stopped}>GENERATE CHART</button>
      </div>
    </div>
  );
}

export default App;
