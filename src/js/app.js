import $ from 'jquery';
import * as flowchart from 'flowchart.js';
import {parseCode, getFunctionNodesString, getFunctionEdgesString} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val(), parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let nodesString = getFunctionNodesString(parsedCode);
        let edgesString = getFunctionEdgesString(parsedCode);
        console.log(nodesString + '\n' + edgesString);
        let diagram = flowchart.parse(nodesString + '\n' + edgesString);
        clearGraph();
        diagram.drawSVG('graph', {
            'flowstate' : {
                'connection' : {'font-color': 'white'},
                'approved' : {'fill':'Chartreuse', 'yes-text': 'T', 'no-text': 'F'}
            }
        });
    });
});

function clearGraph() {
    document.getElementById('graph').innerHTML = '';
}