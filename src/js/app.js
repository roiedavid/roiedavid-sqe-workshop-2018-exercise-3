import $ from 'jquery';
import {parseCode, getFunctionNodesString, getFunctionEdgesString} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val(), parsedCode = parseCode(codeToParse);
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
        let nodesString = getFunctionNodesString(parsedCode);
        console.log('nodes are\n' + nodesString);
        let edgesString = getFunctionEdgesString(parsedCode);
        console.log('edges are\n' + edgesString);
    });
});
