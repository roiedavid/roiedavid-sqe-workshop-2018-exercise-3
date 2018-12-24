import $ from 'jquery';
import {parseCode, astToCode} from './code-analyzer';

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        let codeToParse = $('#codePlaceholder').val(), argumentsToParse = $('#argumentsPlaceholder').val();
        let parsedCode = parseCode(codeToParse), parsedArgs = parseCode(argumentsToParse); // string -> ast
        $('#parsedCode').val(JSON.stringify(parsedCode, null, 2));
    });
});
