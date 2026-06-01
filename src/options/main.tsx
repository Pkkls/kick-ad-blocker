import { render } from 'preact';
import { App } from './App';
import '../popup/styles.css';

render(<App />, document.getElementById('app')!);
