import * as esprima from 'esprima';
import * as estraverse from 'estraverse';
import * as escodegen from 'escodegen';

// parseCode : string -> ast
const parseCode = (codeToParse) => {
    return esprima.parseScript(codeToParse ,{loc:true});
};

// astToCode : ast -> string
const astToCode = (ast) => {
    return escodegen.generate(ast);
};


export {parseCode, astToCode};