import * as ReactWindow from 'react-window';
console.log('Exports:', Object.keys(ReactWindow));
try {
    console.log('Grid prototype:', ReactWindow.Grid?.prototype);
    console.log('FixedSizeGrid prototype:', ReactWindow.FixedSizeGrid?.prototype);
} catch (e) { }
