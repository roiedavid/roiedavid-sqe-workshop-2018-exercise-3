import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {parseCode, getFunctionNodesString, getFunctionEdgesString} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val(), argumentsToParse = $('#argumentsPlaceholder').val();
        let parsedCode = parseCode(codeToParse), parsedArgs = parseCode(argumentsToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let nodesString = getFunctionNodesString(parsedCode);
        let edgesString = getFunctionEdgesString(parsedCode);
        console.log(nodesString + '\n' + edgesString);
        let graph = flowchart.parse(nodesString + '\n' + edgesString);
        clearGraph();
        graph.drawSVG('graph', {
            'flowstate': {
                'connection': {'font-color': 'white'},
                'inPath': {'fill': 'Chartreuse', 'yes-text': 'T', 'no-text': 'F'},
                'ifAndFalse': {'yes-text': 'T', 'no-text': 'F'}
            }
        });
    });
});

function clearGraph() {
    document.getElementById('graph').innerHTML = '';
}